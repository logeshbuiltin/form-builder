/**
 * Core Domain Model: Security Foundation (Phase 15)
 * Enterprise-grade security definitions for healthcare template and document governance.
 */

export interface SecurityPolicy {
  sessionTimeoutMinutes: number;
  idleTimeoutMinutes: number;
  maxConcurrentSessions: number;
  requireMfa: boolean;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    maxAgeDays: number;
  };
  rateLimitPolicy: {
    maxRequestsPerMinute: number;
    bruteForceLockoutAttempts: number;
    lockoutDurationMinutes: number;
  };
  headersAndTransport: {
    enforceHttps: boolean;
    hstsMaxAgeSeconds: number;
    contentSecurityPolicy: string;
    referrerPolicy: string;
  };
  phiPrivacyShield: {
    enableAutoRedaction: boolean;
    anonymizeAiPrompts: boolean;
    sanitizeErrorToasts: boolean;
    stripUrlQueryParams: boolean;
  };
}

export interface SessionToken {
  token: string;
  userId: string;
  workspaceId: string;
  organizationId?: string;
  createdAt: string;       // ISO 8601
  expiresAt: string;       // ISO 8601
  lastActivityAt: string;  // ISO 8601
  csrfToken: string;
  deviceFingerprint?: string;
}

export interface SignedDocumentToken {
  tokenId: string;
  documentId: string;
  workspaceId: string;
  expiresAt: string;       // ISO 8601
  purpose: 'view' | 'download' | 'print' | 'export';
  signature: string;
}

export type SecurityAlertSeverity = 'info' | 'warning' | 'high' | 'critical';

export type SecurityAlertType =
  | 'rate_limit_exceeded'
  | 'brute_force_detected'
  | 'phi_leak_intercepted'
  | 'csrf_mismatch'
  | 'session_expired'
  | 'unauthorized_access';

export interface SecurityAlert {
  id: string;
  severity: SecurityAlertSeverity;
  type: SecurityAlertType;
  timestamp: string;       // ISO 8601
  message: string;
  actorId?: string;
  workspaceId?: string;
  ipAddress?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface SanitizationResult<T> {
  cleanData: T;
  phiDetected: boolean;
  maskedFields: string[];
}

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0 to 100
  strengthLabel: 'Very Weak' | 'Weak' | 'Medium' | 'Strong' | 'Very Strong';
  issues: string[];
}
