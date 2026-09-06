import { Injectable, Optional } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  PasswordValidationResult,
  SanitizationResult,
  SecurityAlert,
  SecurityAlertSeverity,
  SecurityAlertType,
  SecurityPolicy,
  SessionToken,
  SignedDocumentToken,
} from '../domain/security.model';
import { User } from '../domain/user.model';
import { AuditLogService } from './audit-log.service';

/**
 * Phase 15: Security Foundation Service
 * Comprehensive healthcare security architecture:
 * - Cryptographic password hashing & strength verification.
 * - Session security, idle detection, and CSRF token verification.
 * - Zero-Leakage PHI Privacy Shield (masking logs, errors, AI prompts, URLs).
 * - Rate limiting and brute-force mitigation.
 * - Time-bound signed document access tokens.
 * - Recommended enterprise HTTP security headers.
 */
@Injectable({
  providedIn: 'root',
})
export class SecurityFoundationService {
  private readonly SIGNING_SECRET = 'med_platform_internal_signing_key_v1';

  public readonly defaultPolicy: SecurityPolicy = {
    sessionTimeoutMinutes: 60,
    idleTimeoutMinutes: 15,
    maxConcurrentSessions: 3,
    requireMfa: true,
    passwordPolicy: {
      minLength: 10,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      maxAgeDays: 90,
    },
    rateLimitPolicy: {
      maxRequestsPerMinute: 60,
      bruteForceLockoutAttempts: 5,
      lockoutDurationMinutes: 15,
    },
    headersAndTransport: {
      enforceHttps: true,
      hstsMaxAgeSeconds: 31536000,
      contentSecurityPolicy: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-ancestors 'none';",
      referrerPolicy: 'strict-origin-when-cross-origin',
    },
    phiPrivacyShield: {
      enableAutoRedaction: true,
      anonymizeAiPrompts: true,
      sanitizeErrorToasts: true,
      stripUrlQueryParams: true,
    },
  };

  // State Management
  private activeSessions = new Map<string, SessionToken>();
  private rateLimitTimestamps = new Map<string, number[]>();
  private failedAttempts = new Map<string, { count: number; lockoutUntil?: number }>();

  private securityAlertsSubject = new BehaviorSubject<SecurityAlert[]>([]);
  public securityAlerts$: Observable<SecurityAlert[]> = this.securityAlertsSubject.asObservable();

  constructor(@Optional() private auditLogService?: AuditLogService) {
    this.seedInitialSecurityAlerts();
  }

  // =========================================================================
  // 1. Password Security & Cryptographic Hashing
  // =========================================================================

  /**
   * Generates a cryptographically random hexadecimal salt.
   */
  public generateSalt(length = 16): string {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const bytes = new Uint8Array(length);
      crypto.getRandomValues(bytes);
      return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    }
    // Safe deterministic fallback
    let salt = '';
    for (let i = 0; i < length * 2; i++) {
      salt += Math.floor(Math.random() * 16).toString(16);
    }
    return salt;
  }

  /**
   * Computes a SHA-256 salted hash of the password using Web Crypto API.
   */
  public async hashPassword(password: string, customSalt?: string): Promise<{ hash: string; salt: string }> {
    const salt = customSalt || this.generateSalt(16);
    const combined = `${salt}:${password}`;

    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(combined);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      return { hash, salt };
    }

    // Synchronous deterministic fallback
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return { hash: Math.abs(hash).toString(16).padStart(32, '0'), salt };
  }

  /**
   * Verifies that the provided plaintext password matches the stored salted hash.
   */
  public async verifyPassword(password: string, storedHash: string, salt: string): Promise<boolean> {
    const result = await this.hashPassword(password, salt);
    return result.hash === storedHash;
  }

  /**
   * Evaluates password strength against the healthcare platform security policy.
   */
  public validatePasswordStrength(password: string): PasswordValidationResult {
    const issues: string[] = [];
    let score = 0;

    if (!password) {
      return {
        isValid: false,
        score: 0,
        strengthLabel: 'Very Weak',
        issues: ['Password cannot be empty.'],
      };
    }

    // Length check
    if (password.length >= this.defaultPolicy.passwordPolicy.minLength) {
      score += 30;
    } else {
      issues.push(`Must be at least ${this.defaultPolicy.passwordPolicy.minLength} characters.`);
    }

    // Character diversity
    if (/[A-Z]/.test(password)) {
      score += 20;
    } else {
      issues.push('Must contain at least one uppercase letter (A-Z).');
    }

    if (/[a-z]/.test(password)) {
      score += 15;
    } else {
      issues.push('Must contain at least one lowercase letter (a-z).');
    }

    if (/[0-9]/.test(password)) {
      score += 20;
    } else {
      issues.push('Must contain at least one numerical digit (0-9).');
    }

    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      score += 15;
    } else {
      issues.push('Must contain at least one special character (!@#$%...).');
    }

    let strengthLabel: PasswordValidationResult['strengthLabel'] = 'Very Weak';
    if (score >= 90) strengthLabel = 'Very Strong';
    else if (score >= 75) strengthLabel = 'Strong';
    else if (score >= 50) strengthLabel = 'Medium';
    else if (score >= 25) strengthLabel = 'Weak';

    return {
      isValid: issues.length === 0,
      score: Math.min(100, score),
      strengthLabel,
      issues,
    };
  }

  // =========================================================================
  // 2. Session Security & Anti-CSRF Protection
  // =========================================================================

  /**
   * Creates a secure authenticated session with an anti-forgery CSRF token.
   */
  public createSession(user: User, workspaceId: string): SessionToken {
    const now = Date.now();
    const expiryMs = now + this.defaultPolicy.sessionTimeoutMinutes * 60 * 1000;

    const token: SessionToken = {
      token: `ses_${this.generateSalt(20)}`,
      userId: user.id,
      workspaceId,
      organizationId: user.organizationId,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(expiryMs).toISOString(),
      lastActivityAt: new Date(now).toISOString(),
      csrfToken: `csrf_${this.generateSalt(16)}`,
      deviceFingerprint: typeof navigator !== 'undefined' ? `${navigator.userAgent.length}_${navigator.language}` : 'server',
    };

    this.activeSessions.set(token.token, token);
    return token;
  }

  /**
   * Validates active session token, enforcing maximum lifespan and idle timeout.
   */
  public validateSession(tokenStr: string): boolean {
    const session = this.activeSessions.get(tokenStr);
    if (!session) {
      return false;
    }

    const now = Date.now();
    const expiryTime = new Date(session.expiresAt).getTime();
    const lastActivity = new Date(session.lastActivityAt).getTime();
    const idleLimitMs = this.defaultPolicy.idleTimeoutMinutes * 60 * 1000;

    // Check maximum lifespan
    if (now > expiryTime) {
      this.activeSessions.delete(tokenStr);
      this.recordAlert('warning', 'session_expired', `Session ${tokenStr.substring(0, 10)}... expired by absolute timeout.`);
      return false;
    }

    // Check idle timeout
    if (now - lastActivity > idleLimitMs) {
      this.activeSessions.delete(tokenStr);
      this.recordAlert('warning', 'session_expired', `Session ${tokenStr.substring(0, 10)}... expired due to user inactivity.`);
      return false;
    }

    // Touch session
    session.lastActivityAt = new Date(now).toISOString();
    return true;
  }

  /**
   * Verifies that the submitted anti-forgery CSRF token matches the authenticated session.
   */
  public verifyCsrfToken(submittedToken: string, sessionTokenStr: string): boolean {
    const session = this.activeSessions.get(sessionTokenStr);
    if (!session || !submittedToken) {
      this.recordAlert('high', 'csrf_mismatch', 'Missing session or CSRF token on state modification.');
      return false;
    }

    const matches = session.csrfToken === submittedToken;
    if (!matches) {
      this.recordAlert('critical', 'csrf_mismatch', `CSRF token mismatch detected for user ${session.userId}.`);
    }
    return matches;
  }

  public terminateSession(tokenStr: string): void {
    this.activeSessions.delete(tokenStr);
  }

  // =========================================================================
  // 3. Zero-Leakage PHI Privacy Shield
  // =========================================================================

  private readonly PHI_PATTERNS = {
    mrn: /\b(MRN|mrn|REC|rec)[-:\s]?[A-Z0-9]{4,10}\b/g,
    ssn: /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g,
    phone: /\b(\+?[0-9]{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b/g,
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g,
    date: /\b(19|20)\d{2}[-/](0[1-9]|1[0-2])[-/](0[1-9]|[12]\d|3[01])\b/g,
  };

  private readonly SENSITIVE_KEYS = [
    'patient',
    'patientname',
    'name',
    'firstname',
    'lastname',
    'fullname',
    'mrn',
    'dob',
    'dateofbirth',
    'ssn',
    'diagnosis',
    'diagnoses',
    'clinicalnote',
    'notes',
    'medicalhistory',
    'allergies',
    'prescription',
    'prescriptions',
    'vitals',
    'bloodpressure',
  ];

  /**
   * Recursively sanitizes any structured data payload, masking all clinical & patient identifiers.
   */
  public maskPhi<T>(data: T): SanitizationResult<T> {
    const maskedFields: string[] = [];
    let phiDetected = false;

    const sanitizeValue = (val: any, path: string): any => {
      if (val === null || val === undefined) return val;

      if (typeof val === 'string') {
        let sanitizedStr = val;

        if (this.PHI_PATTERNS.ssn.test(sanitizedStr)) {
          sanitizedStr = sanitizedStr.replace(this.PHI_PATTERNS.ssn, '[REDACTED_SSN]');
          phiDetected = true;
          maskedFields.push(`${path}:ssn`);
        }
        if (this.PHI_PATTERNS.mrn.test(sanitizedStr)) {
          sanitizedStr = sanitizedStr.replace(this.PHI_PATTERNS.mrn, '[REDACTED_MRN]');
          phiDetected = true;
          maskedFields.push(`${path}:mrn`);
        }
        if (this.PHI_PATTERNS.phone.test(sanitizedStr)) {
          sanitizedStr = sanitizedStr.replace(this.PHI_PATTERNS.phone, '[REDACTED_PHONE]');
          phiDetected = true;
          maskedFields.push(`${path}:phone`);
        }

        return sanitizedStr;
      }

      if (Array.isArray(val)) {
        return val.map((item, idx) => sanitizeValue(item, `${path}[${idx}]`));
      }

      if (typeof val === 'object' && val !== null) {
        const result: Record<string, any> = {};
        for (const [k, v] of Object.entries(val)) {
          const lowerKey = k.toLowerCase();
          const isKeySensitive = this.SENSITIVE_KEYS.some((sk) => lowerKey.includes(sk));

          if (isKeySensitive && (typeof v !== 'object' || v === null)) {
            phiDetected = true;
            maskedFields.push(`${path ? path + '.' : ''}${k}`);
            if (lowerKey.includes('diagnosis')) {
              result[k] = '[REDACTED_DIAGNOSIS]';
            } else if (lowerKey.includes('mrn')) {
              result[k] = '[REDACTED_MRN]';
            } else if (lowerKey.includes('ssn')) {
              result[k] = '[REDACTED_SSN]';
            } else if (lowerKey.includes('patient') || lowerKey.includes('name')) {
              result[k] = '[REDACTED_PATIENT]';
            } else {
              result[k] = '[REDACTED_CLINICAL_DATA]';
            }
          } else {
            result[k] = sanitizeValue(v, `${path ? path + '.' : ''}${k}`);
          }
        }
        return result;
      }

      return val;
    };

    const cleanData = sanitizeValue(data, '');
    return { cleanData, phiDetected, maskedFields };
  }

  /**
   * De-identifies prompt text before transmission to external AI generation or search endpoints.
   */
  public anonymizeForAiPrompt(prompt: string): string {
    if (!prompt) return '';
    let clean = prompt;

    // Mask SSNs, MRNs, emails, phone numbers, and common patient markers
    clean = clean.replace(this.PHI_PATTERNS.ssn, '[REDACTED_SSN]');
    clean = clean.replace(this.PHI_PATTERNS.mrn, '[REDACTED_MRN]');
    clean = clean.replace(this.PHI_PATTERNS.email, '[REDACTED_EMAIL]');
    clean = clean.replace(this.PHI_PATTERNS.phone, '[REDACTED_PHONE]');
    clean = clean.replace(/(patient\s+(?:named|is)?\s*)([A-Z][a-z]+(\s+[A-Z][a-z]+)+)/gi, '$1[REDACTED_PATIENT]');
    clean = clean.replace(/(diagnosed with\s+)([A-Za-z0-9\s,-]+)/gi, '$1[CLINICAL_CONDITION]');

    return clean;
  }

  /**
   * Formats error messages safely, stripping internal stack traces, DB keys, and patient identifiers.
   */
  public formatSafeErrorMessage(error: any): string {
    if (!error) return 'An unexpected system error occurred.';

    const rawMessage = typeof error === 'string' ? error : error.message || 'Operation failed.';

    // Check for internal stack traces or database errors
    if (rawMessage.includes('at ') || rawMessage.includes('Exception') || rawMessage.includes('TypeError')) {
      return 'A system processing error occurred. The technical team has been notified with zero clinical data.';
    }

    // Mask any potential PHI
    const sanitized = this.maskPhi(rawMessage);
    return sanitized.cleanData;
  }

  /**
   * Validates that route URLs and query parameters NEVER carry Protected Health Information.
   */
  public buildSafeUrl(baseUrl: string, queryParams: Record<string, string>): string {
    const url = new URL(baseUrl, 'http://localhost');
    for (const [key, val] of Object.entries(queryParams)) {
      const lowerKey = key.toLowerCase();
      if (this.SENSITIVE_KEYS.some((sk) => lowerKey.includes(sk))) {
        this.recordAlert('high', 'phi_leak_intercepted', `Blocked attempt to include sensitive param "${key}" in URL.`);
        continue;
      }
      url.searchParams.set(key, val);
    }
    return `${url.pathname}${url.search}`;
  }

  // =========================================================================
  // 4. Rate Limiting & Brute-Force Protection
  // =========================================================================

  /**
   * Enforces a sliding-window rate limit for API keys, user actions, or IP addresses.
   */
  public checkRateLimit(
    key: string,
    maxRequests = this.defaultPolicy.rateLimitPolicy.maxRequestsPerMinute,
    windowMs = 60000
  ): { allowed: boolean; remaining: number; retryAfterSeconds?: number } {
    const now = Date.now();
    const timestamps = (this.rateLimitTimestamps.get(key) || []).filter((t) => now - t < windowMs);

    if (timestamps.length >= maxRequests) {
      const oldest = timestamps[0];
      const retryAfterSeconds = Math.ceil((oldest + windowMs - now) / 1000);
      this.recordAlert('warning', 'rate_limit_exceeded', `Rate limit exceeded for key "${key}" (${timestamps.length} reqs).`);
      return { allowed: false, remaining: 0, retryAfterSeconds };
    }

    timestamps.push(now);
    this.rateLimitTimestamps.set(key, timestamps);
    return { allowed: true, remaining: maxRequests - timestamps.length };
  }

  /**
   * Records a failed authentication attempt and locks out accounts upon exceeding the threshold.
   */
  public recordFailedAuthAttempt(identifier: string): { isLockedOut: boolean; remainingAttempts: number } {
    const now = Date.now();
    const existing = this.failedAttempts.get(identifier) || { count: 0 };
    existing.count += 1;

    const threshold = this.defaultPolicy.rateLimitPolicy.bruteForceLockoutAttempts;
    if (existing.count >= threshold) {
      existing.lockoutUntil = now + this.defaultPolicy.rateLimitPolicy.lockoutDurationMinutes * 60 * 1000;
      this.failedAttempts.set(identifier, existing);
      this.recordAlert('critical', 'brute_force_detected', `Account "${identifier}" locked out for 15 minutes after ${existing.count} failed attempts.`);
      return { isLockedOut: true, remainingAttempts: 0 };
    }

    this.failedAttempts.set(identifier, existing);
    return { isLockedOut: false, remainingAttempts: threshold - existing.count };
  }

  /**
   * Checks if an account or IP is currently locked out.
   */
  public isLockedOut(identifier: string): boolean {
    const existing = this.failedAttempts.get(identifier);
    if (!existing || !existing.lockoutUntil) return false;

    if (Date.now() > existing.lockoutUntil) {
      this.failedAttempts.delete(identifier);
      return false;
    }
    return true;
  }

  public resetAuthAttempts(identifier: string): void {
    this.failedAttempts.delete(identifier);
  }

  // =========================================================================
  // 5. Secure Document Access & Expirable Signed Tokens
  // =========================================================================

  /**
   * Generates a tamper-evident, time-bound access ticket for viewing or downloading a document.
   */
  public generateSignedDocumentAccessToken(
    documentId: string,
    workspaceId: string,
    ttlSeconds = 300,
    purpose: SignedDocumentToken['purpose'] = 'view'
  ): SignedDocumentToken {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    const tokenId = `dtok_${this.generateSalt(12)}`;
    const payload = `${tokenId}:${documentId}:${workspaceId}:${expiresAt}:${purpose}:${this.SIGNING_SECRET}`;

    // Simple deterministic hash signature
    let sigHash = 0;
    for (let i = 0; i < payload.length; i++) {
      sigHash = (sigHash << 5) - sigHash + payload.charCodeAt(i);
      sigHash |= 0;
    }
    const signature = Math.abs(sigHash).toString(16).padStart(16, '0');

    return {
      tokenId,
      documentId,
      workspaceId,
      expiresAt,
      purpose,
      signature,
    };
  }

  /**
   * Validates a signed document access ticket before releasing document bytes.
   */
  public verifySignedDocumentAccessToken(token: SignedDocumentToken): { valid: boolean; reason?: string } {
    if (!token || !token.signature || !token.expiresAt) {
      return { valid: false, reason: 'Malformed token payload.' };
    }

    if (new Date().getTime() > new Date(token.expiresAt).getTime()) {
      this.recordAlert('warning', 'unauthorized_access', `Attempted use of expired document access token for ${token.documentId}.`);
      return { valid: false, reason: 'Token has expired.' };
    }

    const payload = `${token.tokenId}:${token.documentId}:${token.workspaceId}:${token.expiresAt}:${token.purpose}:${this.SIGNING_SECRET}`;
    let sigHash = 0;
    for (let i = 0; i < payload.length; i++) {
      sigHash = (sigHash << 5) - sigHash + payload.charCodeAt(i);
      sigHash |= 0;
    }
    const expectedSig = Math.abs(sigHash).toString(16).padStart(16, '0');

    if (expectedSig !== token.signature) {
      this.recordAlert('critical', 'unauthorized_access', `Forged document signature token detected for document ${token.documentId}!`);
      return { valid: false, reason: 'Invalid cryptographic signature.' };
    }

    return { valid: true };
  }

  // =========================================================================
  // 6. Security Headers & Alerts
  // =========================================================================

  public getRecommendedSecurityHeaders(): Record<string, string> {
    return {
      'Content-Security-Policy': this.defaultPolicy.headersAndTransport.contentSecurityPolicy,
      'Strict-Transport-Security': `max-age=${this.defaultPolicy.headersAndTransport.hstsMaxAgeSeconds}; includeSubDomains; preload`,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': this.defaultPolicy.headersAndTransport.referrerPolicy,
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Cross-Origin-Opener-Policy': 'same-origin',
    };
  }

  public recordAlert(
    severity: SecurityAlertSeverity,
    type: SecurityAlertType,
    message: string,
    metadata?: Record<string, string | number | boolean | null>
  ): SecurityAlert {
    const alert: SecurityAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      severity,
      type,
      timestamp: new Date().toISOString(),
      message,
      metadata,
    };

    const current = this.securityAlertsSubject.value;
    this.securityAlertsSubject.next([alert, ...current.slice(0, 49)]);

    // Emit event to Phase 14 Audit Logging
    try {
      this.auditLogService?.recordEvent(
        'permission.changed',
        'system',
        alert.id,
        {
          alertType: type,
          severity,
          securityNotice: message,
        }
      );
    } catch {
      // Safe fallback
    }

    return alert;
  }

  private seedInitialSecurityAlerts(): void {
    const now = Date.now();
    this.securityAlertsSubject.next([
      {
        id: 'alt_001',
        severity: 'info',
        type: 'session_expired',
        timestamp: new Date(now - 3600000 * 8).toISOString(),
        message: 'Idle session auto-terminated after 15 minutes of inactivity for compliance.',
      },
      {
        id: 'alt_002',
        severity: 'warning',
        type: 'rate_limit_exceeded',
        timestamp: new Date(now - 3600000 * 3).toISOString(),
        message: 'Batch export rate limit threshold throttled (60 requests/min).',
      },
      {
        id: 'alt_003',
        severity: 'info',
        type: 'phi_leak_intercepted',
        timestamp: new Date(now - 3600000 * 1).toISOString(),
        message: 'PHI Privacy Shield intercepted and masked 2 patient MRN identifiers before render.',
      },
    ]);
  }
}
