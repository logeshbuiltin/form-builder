import { TestBed } from '@angular/core/testing';
import { AuditLogService } from './audit-log.service';
import { TenantWorkspaceService } from './tenant-workspace.service';
import { RbacService } from './rbac.service';
import { AuditEvent } from '../domain/audit-event.model';

describe('AuditLogService (Phase 14 - Enterprise Audit Logging)', () => {
  let service: AuditLogService;
  let tenantService: TenantWorkspaceService;
  let rbacService: RbacService;

  beforeEach(() => {
    localStorage.removeItem('form_builder_audit_trail_v1');
    localStorage.removeItem('form_builder_rbac_user_id');
    TestBed.configureTestingModule({
      providers: [AuditLogService, TenantWorkspaceService, RbacService],
    });
    tenantService = TestBed.inject(TenantWorkspaceService);
    tenantService.resetToDefaults();
    rbacService = TestBed.inject(RbacService);
    rbacService.resetToDefaults();
    service = TestBed.inject(AuditLogService);
  });

  afterEach(() => {
    localStorage.removeItem('form_builder_audit_trail_v1');
    localStorage.removeItem('form_builder_rbac_user_id');
  });

  it('should be created and load demonstration seed events', () => {
    expect(service).toBeTruthy();
    const events = service.getEvents();
    expect(events.length).toBeGreaterThanOrEqual(6);
    expect(events.some((e) => e.action === 'user.login')).toBeTrue();
    expect(events.some((e) => e.action === 'template.published')).toBeTrue();
  });

  describe('Strict PHI & Credentials Sanitization', () => {
    it('should strictly strip prohibited medical, patient, and auth secret keys from metadata', () => {
      const sensitiveMetadata = {
        // Safe metadata
        templateVersion: '2.1.0',
        exportFormat: 'pdf',
        status: 'approved',
        pageCount: 4,
        // PROHIBITED PHI / Clinical Keys
        patientName: 'John Doe',
        patientId: 'MRN-998811',
        diagnosis: 'Acute Myocardial Infarction',
        diagnosesList: ['I21.9', 'I10'],
        medicalNotes: 'Patient exhibits severe chest pain radiating to left arm.',
        clinicalSummary: 'Administered 325mg Aspirin.',
        fullDocumentBody: '<h1>Confidential Patient Record</h1>',
        // PROHIBITED Secrets
        apiKeySecret: 'sec_live_98a7sd9f87asdf897asdf',
        passwordHash: 'argon2$hash$secret',
        authToken: 'eyJhbGciOi...',
        ssn: '000-12-3456',
        allergies: 'Penicillin, Peanuts',
        prescriptions: ['Atorvastatin 40mg'],
      };

      const sanitized = service.sanitizeMetadata(sensitiveMetadata);

      expect(sanitized).toBeDefined();
      // Safe fields must be retained
      expect(sanitized!['templateVersion']).toBe('2.1.0');
      expect(sanitized!['exportFormat']).toBe('pdf');
      expect(sanitized!['status']).toBe('approved');
      expect(sanitized!['pageCount']).toBe(4);

      // Prohibited PHI & credentials must NOT be present
      expect(sanitized!['patientName']).toBeUndefined();
      expect(sanitized!['patientId']).toBeUndefined();
      expect(sanitized!['diagnosis']).toBeUndefined();
      expect(sanitized!['diagnosesList']).toBeUndefined();
      expect(sanitized!['medicalNotes']).toBeUndefined();
      expect(sanitized!['clinicalSummary']).toBeUndefined();
      expect(sanitized!['fullDocumentBody']).toBeUndefined();
      expect(sanitized!['apiKeySecret']).toBeUndefined();
      expect(sanitized!['passwordHash']).toBeUndefined();
      expect(sanitized!['authToken']).toBeUndefined();
      expect(sanitized!['ssn']).toBeUndefined();
      expect(sanitized!['allergies']).toBeUndefined();
      expect(sanitized!['prescriptions']).toBeUndefined();
    });

    it('should return undefined if all metadata keys are sensitive or empty', () => {
      const allSensitive = {
        patient: 'Jane Doe',
        diagnosis: 'Flu',
        clinicalNote: 'Bed rest',
      };
      const sanitized = service.sanitizeMetadata(allSensitive);
      expect(sanitized).toBeUndefined();
    });

    it('should truncate excessively long string values', () => {
      const longString = 'A'.repeat(350);
      const sanitized = service.sanitizeMetadata({ summary: longString });
      expect(sanitized!['summary'] as string).toHaveSize(200);
      expect((sanitized!['summary'] as string).endsWith('...')).toBeTrue();
    });
  });

  describe('Event Recording & Persistence', () => {
    it('should record an event with active user actor and active workspace context', () => {
      const initialCount = service.getEvents().length;
      const event = service.recordEvent('template.created', 'template', 'tpl_discharge_summary', {
        templateTitle: 'Inpatient Discharge Summary',
        version: '1.0.0',
      });

      expect(event.id).toMatch(/^aud_\d+_[a-z0-9]+$/);
      expect(event.action).toBe('template.created');
      expect(event.resourceType).toBe('template');
      expect(event.resourceId).toBe('tpl_discharge_summary');
      expect(event.workspaceId).toBeDefined();
      expect(event.actor.role).toBeDefined();
      expect(event.timestamp).toBeDefined();
      expect(event.metadata?.['templateTitle']).toBe('Inpatient Discharge Summary');

      const currentEvents = service.getEvents();
      expect(currentEvents.length).toBe(initialCount + 1);
      expect(currentEvents[0].id).toBe(event.id);
    });

    it('should record an event with custom actor overrides', () => {
      const event = service.recordEvent(
        'api_key.revoked',
        'api_key',
        'key_old_gateway',
        { reason: 'compromised_rotation' },
        {
          id: 'usr_sec_officer',
          name: 'Security Bot',
          email: 'sec@apexhealth.org',
          role: 'hospital_admin',
        }
      );

      expect(event.actor.id).toBe('usr_sec_officer');
      expect(event.actor.name).toBe('Security Bot');
      expect(event.action).toBe('api_key.revoked');
    });

    it('should persist events to localStorage', () => {
      service.recordEvent('workspace.switched', 'workspace', 'ws-cardio');
      const raw = localStorage.getItem('form_builder_audit_trail_v1');
      expect(raw).toBeTruthy();
      const parsed: AuditEvent[] = JSON.parse(raw!);
      expect(parsed[0].action).toBe('workspace.switched');
    });
  });

  describe('Querying & Filtering', () => {
    it('should filter events by action', () => {
      const loginEvents = service.getEvents({ action: 'user.login' });
      expect(loginEvents.length).toBeGreaterThan(0);
      expect(loginEvents.every((e) => e.action === 'user.login')).toBeTrue();
    });

    it('should filter events by resource type', () => {
      const templateEvents = service.getEvents({ resourceType: 'template' });
      expect(templateEvents.length).toBeGreaterThan(0);
      expect(templateEvents.every((e) => e.resourceType === 'template')).toBeTrue();
    });

    it('should filter events by search term across actor, action, resource, and metadata', () => {
      const results = service.getEvents({ searchTerm: 'cardio' });
      expect(results.length).toBeGreaterThan(0);
      const matches = results.every(
        (e) =>
          e.resourceId.toLowerCase().includes('cardio') ||
          (e.metadata && JSON.stringify(e.metadata).toLowerCase().includes('cardio'))
      );
      expect(matches).toBeTrue();
    });

    it('should filter events by actor query', () => {
      const dorianEvents = service.getEvents({ actorId: 'dorian' });
      expect(dorianEvents.length).toBeGreaterThan(0);
      expect(dorianEvents.every((e) => e.actor.name?.includes('Dorian') || e.actor.email?.includes('dorian'))).toBeTrue();
    });

    it('should filter events by date range', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 86400000);
      const tomorrow = new Date(now.getTime() + 86400000);

      service.recordEvent('template.edited', 'template', 'tpl_date_test');

      const recent = service.getEvents({
        fromDate: yesterday.toISOString(),
        toDate: tomorrow.toISOString(),
      });

      expect(recent.some((e) => e.resourceId === 'tpl_date_test')).toBeTrue();
    });
  });

  describe('Governance Exports (CSV & JSON)', () => {
    it('should export audit trail as RFC 4180-compliant CSV without PHI', () => {
      const exportResult = service.exportAsCsv();
      expect(exportResult.format).toBe('csv');
      expect(exportResult.mimeType).toContain('text/csv');
      expect(exportResult.filename).toMatch(/^audit_trail_export_.*\.csv$/);
      expect(exportResult.count).toBeGreaterThan(0);

      const lines = exportResult.content.split('\r\n');
      expect(lines[0]).toBe(
        'Event ID,Timestamp,Action,Resource Type,Resource ID,Actor ID,Actor Name,Actor Email,Actor Role,IP Address,Workspace ID,Organization ID,Sanitized Metadata'
      );
      expect(lines.length).toBe(exportResult.count + 1);

      // Verify no prohibited secrets or PHI in raw CSV
      expect(exportResult.content.toLowerCase()).not.toContain('patient medical');
      expect(exportResult.content.toLowerCase()).not.toContain('apikeysecret');
      expect(exportResult.content.toLowerCase()).not.toContain('passwordhash');
    });

    it('should export audit trail as structured JSON with governance envelope', () => {
      const exportResult = service.exportAsJson({ action: 'template.created' });
      expect(exportResult.format).toBe('json');
      expect(exportResult.mimeType).toContain('application/json');
      expect(exportResult.filename).toMatch(/^audit_trail_export_.*\.json$/);

      const parsed = JSON.parse(exportResult.content);
      expect(parsed.exportMetadata).toBeDefined();
      expect(parsed.exportMetadata.complianceStandard).toContain('HIPAA');
      expect(parsed.exportMetadata.filterCriteria.action).toBe('template.created');
      expect(Array.isArray(parsed.events)).toBeTrue();
      expect(parsed.events.length).toBe(exportResult.count);
    });
  });
});
