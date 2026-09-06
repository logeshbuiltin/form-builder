import { TestBed } from '@angular/core/testing';
import { ApiClientService } from './api-client.service';
import { DocumentService } from './document.service';
import { PdfExportService } from './pdf-export.service';

import { TenantWorkspaceService } from './tenant-workspace.service';
import { RbacService } from './rbac.service';

describe('ApiClientService', () => {
  let service: ApiClientService;
  let documentService: DocumentService;
  let rbacService: RbacService;

  beforeEach(() => {
    localStorage.removeItem('form_builder_api_keys_v1');
    localStorage.removeItem('form_builder_api_audit_logs_v1');
    localStorage.removeItem('form_builder_rbac_user_id');
    TestBed.configureTestingModule({
      providers: [ApiClientService, DocumentService, PdfExportService, TenantWorkspaceService, RbacService],
    });
    rbacService = TestBed.inject(RbacService);
    rbacService.resetToDefaults();
    service = TestBed.inject(ApiClientService);
    documentService = TestBed.inject(DocumentService);
  });

  afterEach(() => {
    localStorage.removeItem('form_builder_api_keys_v1');
    localStorage.removeItem('form_builder_api_audit_logs_v1');
    localStorage.removeItem('form_builder_rbac_user_id');
  });

  it('should be created and seed default API keys', () => {
    expect(service).toBeTruthy();
    const keys = service.getApiKeys();
    expect(keys.length).toBeGreaterThanOrEqual(3);
    const berlinKey = keys.find((k) => k.id === 'key_berlin_charite_01');
    expect(berlinKey).toBeDefined();
    expect(berlinKey?.status).toBe('active');
    expect(berlinKey?.workspaceId).toBe('ws_charite_berlin');
  });

  describe('API Key Management', () => {
    it('should generate a new active API key with secret and rate limit', () => {
      const created = service.createApiKey('Hamburg Clinic Integration', 'ws_hamburg', 90);
      expect(created.id).toContain('key_');
      expect(created.secretKey).toContain('sk_live_');
      expect(created.name).toBe('Hamburg Clinic Integration');
      expect(created.workspaceId).toBe('ws_hamburg');
      expect(created.rateLimitPerMinute).toBe(90);
      expect(created.status).toBe('active');

      const allKeys = service.getApiKeys();
      expect(allKeys.some((k) => k.id === created.id)).toBeTrue();
    });

    it('should revoke and delete an API key', () => {
      const key = service.createApiKey('Temporary Key');
      expect(service.revokeApiKey(key.id)).toBeTrue();

      const revoked = service.getApiKeys().find((k) => k.id === key.id);
      expect(revoked?.status).toBe('revoked');

      expect(service.deleteApiKey(key.id)).toBeTrue();
      expect(service.getApiKeys().some((k) => k.id === key.id)).toBeFalse();
    });

    it('should throw error when managing API keys without api_key:manage permission', () => {
      rbacService.simulateRole('healthcare_staff'); // lacks api_key:manage
      expect(() => {
        service.createApiKey('Unauthorized Key');
      }).toThrowError(/Missing required permission api_key:manage/);
    });
  });

  describe('Authentication & Security', () => {
    it('should return 401 Unauthorized when API key is missing or invalid', async () => {
      const response = await service.dispatch({
        method: 'POST',
        endpoint: '/api/v1/documents/render',
        headers: {}, // No API key
        body: { templateHtml: '<p>Hi</p>', data: {} },
      });

      expect(response.status).toBe(401);
      expect(response.error?.code).toBe('UNAUTHORIZED');
    });

    it('should return 403 Forbidden when using a revoked API key', async () => {
      const key = service.createApiKey('Revoked Integration');
      service.revokeApiKey(key.id);

      const response = await service.dispatch({
        method: 'GET',
        endpoint: '/api/v1/templates',
        headers: { 'X-API-Key': key.secretKey },
      });

      expect(response.status).toBe(403);
      expect(response.error?.code).toBe('KEY_REVOKED');
    });

    it('should authenticate with Bearer token in Authorization header', async () => {
      const key = service.getActiveApiKey()!;
      const response = await service.dispatch({
        method: 'GET',
        endpoint: '/api/v1/templates',
        headers: { Authorization: `Bearer ${key.secretKey}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.templates).toBeDefined();
    });
  });

  describe('Sliding-Window Rate Limiting', () => {
    it('should enforce rate limits when requests exceed configured threshold', async () => {
      // Create a key with a strict limit of 3 requests / minute
      const limitedKey = service.createApiKey('Throttled Test Key', 'ws_test', 3);

      // Requests 1, 2, 3 should succeed
      for (let i = 0; i < 3; i++) {
        const res = await service.dispatch({
          method: 'GET',
          endpoint: '/api/v1/templates',
          headers: { 'X-API-Key': limitedKey.secretKey },
        });
        expect(res.status).toBe(200);
      }

      // Request 4 should be rejected with 429
      const throttledRes = await service.dispatch({
        method: 'GET',
        endpoint: '/api/v1/templates',
        headers: { 'X-API-Key': limitedKey.secretKey },
      });

      expect(throttledRes.status).toBe(429);
      expect(throttledRes.error?.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(throttledRes.headers['Retry-After']).toBe('60');
    });
  });

  describe('Core API Endpoints (/api/v1)', () => {
    let activeKey: string;

    beforeEach(() => {
      activeKey = service.getActiveApiKey()!.secretKey;
    });

    it('POST /api/v1/documents/render: should perform stateless template rendering', async () => {
      const response = await service.dispatch({
        method: 'POST',
        endpoint: '/api/v1/documents/render',
        headers: { 'X-API-Key': activeKey },
        body: {
          templateHtml: '<div class="report">Patient: {{patient.name}} (DOB: {{patient.dob}})</div>',
          data: { patient: { name: 'Erika Musterfrau', dob: '1980-05-12' } },
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.renderedHtml).toContain('Patient: Erika Musterfrau (DOB: 1980-05-12)');
      expect(response.data.isValid).toBeTrue();
    });

    it('POST /api/v1/documents: should generate and store document instance', async () => {
      const response = await service.dispatch({
        method: 'POST',
        endpoint: '/api/v1/documents',
        headers: { 'X-API-Key': activeKey },
        body: {
          title: 'Physiotherapie Erstbefund - Max Mustermann',
          templateId: 'physio_assessment',
          patientName: 'Max Mustermann',
          patientMrn: 'MRN-API-101',
          data: { patient: { name: 'Max Mustermann', mrn: 'MRN-API-101' } },
        },
      });

      expect(response.status).toBe(201);
      expect(response.data.document).toBeDefined();
      expect(response.data.document.title).toBe('Physiotherapie Erstbefund - Max Mustermann');

      // Verify document was stored in DocumentService
      const doc = documentService.getDocumentById(response.data.document.id);
      expect(doc).toBeDefined();
      expect(doc?.patientMrn).toBe('MRN-API-101');
    });

    it('GET /api/v1/documents/:id: should retrieve stored document instance', async () => {
      // First generate a document
      const genRes = await service.dispatch({
        method: 'POST',
        endpoint: '/api/v1/documents',
        headers: { 'X-API-Key': activeKey },
        body: {
          title: 'Lookup Test Document',
          templateId: 'physio_assessment',
          data: { patient: { name: 'Johann Becker' } },
        },
      });

      const docId = genRes.data.document.id;

      // Now query by ID
      const fetchRes = await service.dispatch({
        method: 'GET',
        endpoint: `/api/v1/documents/${docId}`,
        headers: { 'X-API-Key': activeKey },
      });

      expect(fetchRes.status).toBe(200);
      expect(fetchRes.data.document.id).toBe(docId);
      expect(fetchRes.data.document.title).toBe('Lookup Test Document');
    });

    it('POST /api/v1/documents/:id/export: should compile document to print-ready HTML', async () => {
      const genRes = await service.dispatch({
        method: 'POST',
        endpoint: '/api/v1/documents',
        headers: { 'X-API-Key': activeKey },
        body: {
          title: 'Export Test Document',
          templateId: 'physio_assessment',
          patientMrn: 'MRN-EXP-999',
          data: { patient: { name: 'Greta Lehmann', mrn: 'MRN-EXP-999' } },
        },
      });

      const docId = genRes.data.document.id;

      const exportRes = await service.dispatch({
        method: 'POST',
        endpoint: `/api/v1/documents/${docId}/export`,
        headers: { 'X-API-Key': activeKey },
        body: {
          pageSize: 'Letter',
          orientation: 'landscape',
          watermark: 'confidential',
        },
      });

      expect(exportRes.status).toBe(200);
      expect(exportRes.data.printHtml).toContain('Letter landscape');
      expect(exportRes.data.printHtml).toContain('CONFIDENTIAL / VERTRAULICH');
    });

    it('GET /api/v1/templates: should list templates with optional category filter', async () => {
      const response = await service.dispatch({
        method: 'GET',
        endpoint: '/api/v1/templates',
        headers: { 'X-API-Key': activeKey },
      });

      expect(response.status).toBe(200);
      expect(response.data.templates.length).toBeGreaterThanOrEqual(10);
    });

    it('POST /api/v1/templates: should register a new template and allow publishing', async () => {
      const createRes = await service.dispatch({
        method: 'POST',
        endpoint: '/api/v1/templates',
        headers: { 'X-API-Key': activeKey },
        body: {
          name: 'Custom Orthopedic Intake',
          category: 'clinical_documents',
          html: '<div>Orthopedic Intake: {{patient.name}}</div>',
        },
      });

      expect(createRes.status).toBe(201);
      const tmplId = createRes.data.template.id;

      const publishRes = await service.dispatch({
        method: 'POST',
        endpoint: `/api/v1/templates/${tmplId}/publish`,
        headers: { 'X-API-Key': activeKey },
      });

      expect(publishRes.status).toBe(200);
      expect(publishRes.data.status).toBe('published');
    });
  });

  describe('Privacy-Safe Audit Logging', () => {
    it('should log API requests without storing sensitive patient PHI', async () => {
      const key = service.getActiveApiKey()!;
      await service.dispatch({
        method: 'POST',
        endpoint: '/api/v1/documents',
        headers: { 'X-API-Key': key.secretKey },
        body: {
          title: 'Sensitive Medical Chart',
          templateId: 'physio_assessment',
          data: {
            patient: { name: 'Private Patient', diagnosis: 'Severe Lumbar Disc Herniation' },
          },
        },
      });

      const logs = service.getAuditLogs();
      expect(logs.length).toBeGreaterThan(0);
      const latest = logs[0];
      expect(latest.endpoint).toBe('/api/v1/documents');
      expect(latest.statusCode).toBe(201);
      expect(latest.hasSensitiveDataRedacted).toBeTrue();

      // Ensure patient name and diagnosis are NOT in the audit log structure
      const serializedLog = JSON.stringify(latest);
      expect(serializedLog).not.toContain('Private Patient');
      expect(serializedLog).not.toContain('Severe Lumbar Disc Herniation');
    });
  });

  describe('Code Snippet Generation', () => {
    it('should generate valid cURL, fetch, and Python snippets', () => {
      const endpoint = service.getEndpointDefinitions()[0];
      const curl = service.generateCurlSnippet(endpoint, { foo: 'bar' }, 'sk_live_123', 'ws_berlin');
      expect(curl).toContain('curl -X POST');
      expect(curl).toContain('X-API-Key: sk_live_123');
      expect(curl).toContain('X-Workspace-Id: ws_berlin');

      const fetchSnippet = service.generateFetchSnippet(endpoint, { foo: 'bar' }, 'sk_live_123');
      expect(fetchSnippet).toContain('await fetch(');
      expect(fetchSnippet).toContain('"X-API-Key": "sk_live_123"');

      const python = service.generatePythonSnippet(endpoint, { foo: 'bar' }, 'sk_live_123');
      expect(python).toContain('import requests');
      expect(python).toContain('"X-API-Key": "sk_live_123"');
    });
  });
});
