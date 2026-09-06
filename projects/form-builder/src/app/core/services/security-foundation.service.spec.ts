import { TestBed } from '@angular/core/testing';
import { SecurityFoundationService } from './security-foundation.service';
import { AuditLogService } from './audit-log.service';
import { User } from '../domain/user.model';

describe('SecurityFoundationService (Phase 15: Security Foundation)', () => {
  let service: SecurityFoundationService;

  const mockUser: User = {
    id: 'usr_sec_test',
    organizationId: 'org_test',
    workspaceIds: ['ws_test'],
    email: 'sec.officer@apexhealth.org',
    firstName: 'Marcus',
    lastName: 'Vance',
    role: 'admin',
    permissions: ['audit:view', 'workspace:manage'],
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SecurityFoundationService, AuditLogService],
    });
    service = TestBed.inject(SecurityFoundationService);
  });

  it('should be created with default security policy and seeded alerts', () => {
    expect(service).toBeTruthy();
    expect(service.defaultPolicy.passwordPolicy.minLength).toBe(10);
    expect(service.defaultPolicy.phiPrivacyShield.enableAutoRedaction).toBeTrue();
  });

  describe('1. Password Hashing & Cryptographic Verification', () => {
    it('should generate a 16-byte random hex salt', () => {
      const salt = service.generateSalt(16);
      expect(salt).toBeTruthy();
      expect(salt.length).toBe(32); // 16 bytes = 32 hex chars
    });

    it('should hash and verify passwords using cryptographic salts', async () => {
      const rawPassword = 'ClinicalSecure#2026';
      const result = await service.hashPassword(rawPassword);

      expect(result.hash).toBeTruthy();
      expect(result.salt).toBeTruthy();

      const isValid = await service.verifyPassword(rawPassword, result.hash, result.salt);
      expect(isValid).toBeTrue();

      const isInvalid = await service.verifyPassword('WrongPassword123!', result.hash, result.salt);
      expect(isInvalid).toBeFalse();
    });

    it('should validate password strength against enterprise healthcare policy', () => {
      const veryWeak = service.validatePasswordStrength('');
      expect(veryWeak.isValid).toBeFalse();

      const short = service.validatePasswordStrength('Abc1!');
      expect(short.isValid).toBeFalse();
      expect(short.issues.some((i) => i.includes('at least 10 characters'))).toBeTrue();

      const noSpecial = service.validatePasswordStrength('Healthcare2026');
      expect(noSpecial.isValid).toBeFalse();
      expect(noSpecial.issues.some((i) => i.includes('special character'))).toBeTrue();

      const compliant = service.validatePasswordStrength('ApexClinical#99214');
      expect(compliant.isValid).toBeTrue();
      expect(compliant.score).toBeGreaterThanOrEqual(75);
    });
  });

  describe('2. Session Management & Anti-CSRF Protection', () => {
    it('should create an authenticated session with anti-forgery CSRF token', () => {
      const session = service.createSession(mockUser, 'ws_test');

      expect(session.token).toMatch(/^ses_[a-z0-9]+$/);
      expect(session.csrfToken).toMatch(/^csrf_[a-z0-9]+$/);
      expect(session.userId).toBe(mockUser.id);
      expect(session.workspaceId).toBe('ws_test');
    });

    it('should validate active session and reject expired sessions', () => {
      const session = service.createSession(mockUser, 'ws_test');
      expect(service.validateSession(session.token)).toBeTrue();

      // Simulate expired session
      session.expiresAt = new Date(Date.now() - 1000).toISOString();
      expect(service.validateSession(session.token)).toBeFalse();
    });

    it('should reject idle sessions exceeding inactivity threshold', () => {
      const session = service.createSession(mockUser, 'ws_test');
      // Simulate 20 minutes of inactivity
      session.lastActivityAt = new Date(Date.now() - 20 * 60 * 1000).toISOString();

      expect(service.validateSession(session.token)).toBeFalse();
    });

    it('should verify CSRF tokens and reject mismatched tokens', () => {
      const session = service.createSession(mockUser, 'ws_test');

      const valid = service.verifyCsrfToken(session.csrfToken, session.token);
      expect(valid).toBeTrue();

      const invalid = service.verifyCsrfToken('forged_csrf_token', session.token);
      expect(invalid).toBeFalse();
    });
  });

  describe('3. PHI Privacy Shield (Zero-Leakage Enforcement)', () => {
    it('should recursively redact patient identifiers, MRNs, SSNs, and diagnoses from payloads', () => {
      const clinicalPayload = {
        patient: {
          name: 'Eleanor Vance',
          mrn: 'MRN-77821',
          ssn: '123-45-6789',
          dob: '1984-06-15',
        },
        encounter: {
          diagnosis: 'Acute Bronchitis',
          notes: 'Patient presented with dry cough and low-grade fever.',
        },
        meta: {
          department: 'Pulmonology',
          status: 'verified',
        },
      };

      const result = service.maskPhi(clinicalPayload);

      expect(result.phiDetected).toBeTrue();
      expect(result.maskedFields.length).toBeGreaterThanOrEqual(4);
      expect(result.cleanData.patient.name).toBe('[REDACTED_PATIENT]');
      expect(result.cleanData.patient.mrn).toBe('[REDACTED_MRN]');
      expect(result.cleanData.encounter.diagnosis).toBe('[REDACTED_DIAGNOSIS]');
      // Non-sensitive data remains untouched
      expect(result.cleanData.meta.department).toBe('Pulmonology');
      expect(result.cleanData.meta.status).toBe('verified');
    });

    it('should de-identify patient names and identifiers in AI prompts', () => {
      const rawPrompt = 'Generate discharge instructions for patient named John Smith with MRN-88122 and SSN 000-12-3456';
      const cleanPrompt = service.anonymizeForAiPrompt(rawPrompt);

      expect(cleanPrompt).not.toContain('John Smith');
      expect(cleanPrompt).not.toContain('MRN-88122');
      expect(cleanPrompt).not.toContain('000-12-3456');
      expect(cleanPrompt).toContain('[REDACTED_PATIENT]');
      expect(cleanPrompt).toContain('[REDACTED_MRN]');
      expect(cleanPrompt).toContain('[REDACTED_SSN]');
    });

    it('should sanitize error messages to prevent stack trace or patient data leakage', () => {
      const errorWithTrace = new Error('Database query failed at UserRepo.ts:45: TypeError: Cannot read null');
      const safeMessage = service.formatSafeErrorMessage(errorWithTrace);
      expect(safeMessage).toContain('A system processing error occurred');
      expect(safeMessage).not.toContain('at UserRepo.ts');

      const errorWithMrn = 'Record not found for MRN-998811';
      const safeMrnMsg = service.formatSafeErrorMessage(errorWithMrn);
      expect(safeMrnMsg).toContain('[REDACTED_MRN]');
    });

    it('should strip PHI keys from query parameters in safe URL builder', () => {
      const safeUrl = service.buildSafeUrl('/api/v1/documents', {
        format: 'pdf',
        version: '2',
        patientName: 'John Doe',
        mrn: 'MRN-1234',
      });

      expect(safeUrl).toContain('format=pdf');
      expect(safeUrl).toContain('version=2');
      expect(safeUrl).not.toContain('patientName');
      expect(safeUrl).not.toContain('John+Doe');
      expect(safeUrl).not.toContain('mrn');
    });
  });

  describe('4. Rate Limiting & Brute-Force Mitigation', () => {
    it('should throttle requests that exceed rate limit thresholds', () => {
      const key = 'test_client_key';
      for (let i = 0; i < 5; i++) {
        const check = service.checkRateLimit(key, 5, 10000);
        expect(check.allowed).toBeTrue();
      }

      const blocked = service.checkRateLimit(key, 5, 10000);
      expect(blocked.allowed).toBeFalse();
      expect(blocked.remaining).toBe(0);
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    });

    it('should lock out accounts after exceeding consecutive failed authentication attempts', () => {
      const userEmail = 'attacker@target.org';
      service.resetAuthAttempts(userEmail);

      for (let i = 0; i < 4; i++) {
        const attempt = service.recordFailedAuthAttempt(userEmail);
        expect(attempt.isLockedOut).toBeFalse();
      }

      const lockout = service.recordFailedAuthAttempt(userEmail);
      expect(lockout.isLockedOut).toBeTrue();
      expect(service.isLockedOut(userEmail)).toBeTrue();

      service.resetAuthAttempts(userEmail);
      expect(service.isLockedOut(userEmail)).toBeFalse();
    });
  });

  describe('5. Signed Document Access Tokens', () => {
    it('should generate verifiable, time-bound signed document access tokens', () => {
      const token = service.generateSignedDocumentAccessToken('doc_123', 'ws_cardio', 300, 'view');

      expect(token.tokenId).toMatch(/^dtok_[a-z0-9]+$/);
      expect(token.documentId).toBe('doc_123');
      expect(token.signature).toBeTruthy();

      const verification = service.verifySignedDocumentAccessToken(token);
      expect(verification.valid).toBeTrue();
    });

    it('should reject expired signed document access tokens', () => {
      const expiredToken = service.generateSignedDocumentAccessToken('doc_123', 'ws_cardio', -10, 'view');
      const verification = service.verifySignedDocumentAccessToken(expiredToken);

      expect(verification.valid).toBeFalse();
      expect(verification.reason).toContain('expired');
    });

    it('should reject tampered or forged signed document access tokens', () => {
      const token = service.generateSignedDocumentAccessToken('doc_123', 'ws_cardio', 300, 'view');
      const forged = { ...token, documentId: 'doc_other_patient_999' };

      const verification = service.verifySignedDocumentAccessToken(forged);
      expect(verification.valid).toBeFalse();
      expect(verification.reason).toContain('signature');
    });
  });

  describe('6. Security Headers Specification', () => {
    it('should provide recommended healthcare HTTP security headers', () => {
      const headers = service.getRecommendedSecurityHeaders();
      expect(headers['Content-Security-Policy']).toBeDefined();
      expect(headers['Strict-Transport-Security']).toContain('max-age=31536000');
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['X-Frame-Options']).toBe('DENY');
    });
  });
});
