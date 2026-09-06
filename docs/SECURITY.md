# Healthcare Template Platform — Security Architecture & Foundation

> **Document Version**: 1.0.0  
> **Target Standard**: HIPAA Security Rule (§§ 164.308, 164.312), GDPR Article 32, OWASP ASVS Level 2  
> **Status**: Technical Foundation Implemented

---

## 1. Compliance Disclaimer & Governance Notice

> [!IMPORTANT]
> **COMPLIANCE DISCLAIMER**:  
> Implementing the technical security features documented in this specification does **not** automatically grant or guarantee compliance with GDPR, HIPAA, ISO 27001, SOC 2, or any other regulatory framework.  
> 
> True healthcare regulatory compliance requires a holistic combination of:
> 1. **Administrative Safeguards**: Formal risk assessments, workforce security training, sanctions policies, and security incident response protocols.
> 2. **Physical Safeguards**: Facility access controls, device/media controls, and workstation security policies.
> 3. **Organizational & Contractual Controls**: Business Associate Agreements (BAAs), Data Protection Impact Assessments (DPIAs), Standard Contractual Clauses (SCCs), and Data Processing Addendums (DPAs).
> 4. **Technical Infrastructure**: Hardened cloud host configurations, dedicated KMS key management, disaster recovery drills, and independent third-party penetration audits.

---

## 2. Threat Model & Trust Boundaries

The Healthcare Template Platform processes clinical document templates, medical narrative schemas, patient demographic placeholders, and generated clinical documentation.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        UNTRUSTED EXTERNAL ZONE                         │
│   Public Internet • Browser Clients • Third-Party EHR Integrations     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ TLS 1.3 / HTTPS
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        PERIMETER SECURITY ZONE                         │
│   Rate Limiter • CSRF Guard • Security Headers (CSP, HSTS) • WAF       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Authenticated & Scoped Request
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        APPLICATION CORE ZONE                           │
│   RBAC Engine • Tenant Boundary Isolation • Input Validator            │
│   PHI Privacy Shield • Document Signature Engine                       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Sanitized Non-PHI
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        PERSISTENCE & AUDIT ZONE                        │
│   Multi-Tenant Storage • Immutable Audit Ledger • Zero-PHI Records     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Core Security Pillars

### 3.1 Authentication & Password Security
- **Salted Key Derivation**: Passwords are never stored in plaintext. Password hashing uses iterated cryptographic SHA-256 with cryptographically generated 16-byte random salts (`crypto.getRandomValues`).
- **Complexity Policy**:
  - Minimum 10 characters length.
  - At least one uppercase letter (`A-Z`).
  - At least one lowercase letter (`a-z`).
  - At least one numerical digit (`0-9`).
  - At least one special symbol (`!@#$%^&*...`).
- **Brute-Force Lockout Defense**: Accounts are automatically locked out for 15 minutes following 5 consecutive failed authentication attempts.

### 3.2 Session Security & CSRF Defense
- **Session Tokens**: Cryptographically random 160-bit session identifiers (`ses_...`).
- **Inactivity Timeout**: Active sessions are automatically invalidated following 15 minutes of user inactivity to prevent unauthorized access on unattended clinical workstations.
- **Absolute Lifespan**: Maximum hard session lifespan capped at 60 minutes.
- **Anti-CSRF Tokens**: Every authenticated session issues a unique, unpredictable anti-forgery token (`csrf_...`) verified on state-mutating requests (POST, PUT, DELETE).

### 3.3 Zero-Leakage PHI Privacy Shield
Healthcare data regulations strictly prohibit leaking Protected Health Information (PHI) to secondary systems. The **PHI Privacy Shield** provides automated interception across six critical attack surfaces:

| Exposure Vector | Protection Mechanism |
| :--- | :--- |
| **`console.log`** | Intercepted via `safeConsoleLog`. All diagnostic outputs are scrubbed of patient names, MRNs, SSNs, and diagnoses before console emission. |
| **Frontend Errors** | `formatSafeErrorMessage` purges technical stack traces, database exceptions, and clinical payloads, presenting users with safe, non-identifiable alerts. |
| **Analytics & Telemetry** | Analytics events are strictly limited to non-PHI operational metadata (event counts, render durations, action enums). |
| **AI Prompts** | `anonymizeForAiPrompt` automatically de-identifies prompt inputs, scrubbing patient names, MRNs, dates, and phone numbers before dispatch to AI models. |
| **URLs & Query Params** | `buildSafeUrl` intercepts and rejects any query string attempting to carry sensitive keys (`mrn`, `patientName`, `dob`, `diagnosis`). |
| **Document Links** | Unprotected direct document links are forbidden; all file viewing and downloads require time-bound, cryptographically signed tokens. |

### 3.4 Rate Limiting & Denial-of-Service Defense
- **Sliding-Window Token Bucket**: API keys and client sessions are subject to a 60 requests/minute rate limit window.
- **Throttling Alerts**: Rate limit overages emit security alerts and return standard HTTP 429 response payloads with a `retryAfterSeconds` indicator.

### 3.5 Secure Document Access (Signed Expirable Tokens)
- Documents cannot be accessed by static ID or public URL.
- Access requires a **Signed Document Token** (`SignedDocumentToken`):
  - Contains `tokenId`, `documentId`, `workspaceId`, `expiresAt`, `purpose`, and cryptographic `signature`.
  - Enforces time-to-live (default 300 seconds).
  - Tampering with any payload attribute invalidates the signature and aborts document delivery.

### 3.6 Tenant Isolation & RBAC Boundaries
- Every template, document, brand, and API key belongs to a discrete `workspaceId` and `organizationId`.
- The `TenantWorkspaceService` enforces strict query boundaries to eliminate cross-tenant data leakage.
- RBAC permissions (`template:view`, `template:edit`, `document:generate`, `audit:view`, etc.) are checked both at the service layer and within UI action routers.

### 3.7 HTTP Security Headers Specification
Production deployments must serve the following HTTP headers:

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-ancestors 'none'; object-src 'none'; base-uri 'self';
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
Cross-Origin-Opener-Policy: same-origin
```

---

## 4. Security Incident Response & Audit Integration

All security events (rate limit breaches, brute-force lockouts, PHI leak attempts, CSRF mismatches, and session expirations) are recorded by the `SecurityFoundationService` and forwarded directly to the immutable **Phase 14 Audit Logging Ledger** for forensic governance.
