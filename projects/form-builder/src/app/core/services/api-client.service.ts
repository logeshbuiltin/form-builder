import { Injectable } from '@angular/core';
import {
  ApiKey,
  ApiRequest,
  ApiResponse,
  ApiAuditLog,
  ApiEndpointDefinition,
  HttpMethod,
} from '../domain/api-client.model';
import { DocumentService } from './document.service';
import { PdfExportService, PdfExportOptions } from './pdf-export.service';
import { DataBindingEngine } from '../engine/data-binding-engine';
import { DOCUMENT_FORMATS } from '../../data/constant/document-formats.constant';
import { DocumentFormat } from '../../data/model/document-formats.model';
import { Document as DocumentInstance } from '../domain/document.model';
import { TenantWorkspaceService } from './tenant-workspace.service';
import { RbacService } from './rbac.service';

@Injectable({
  providedIn: 'root',
})
export class ApiClientService {
  private readonly API_KEYS_STORAGE_KEY = 'form_builder_api_keys_v1';
  private readonly AUDIT_LOGS_STORAGE_KEY = 'form_builder_api_audit_logs_v1';

  private apiKeys: ApiKey[] = [];
  private auditLogs: ApiAuditLog[] = [];
  private rateLimitTimestamps: Map<string, number[]> = new Map();

  constructor(
    private documentService: DocumentService,
    private pdfExportService: PdfExportService,
    private tenantWorkspaceService?: TenantWorkspaceService,
    private rbacService?: RbacService
  ) {
    this.loadApiKeys();
    this.loadAuditLogs();
  }

  // =========================================================================
  // API Key Management & Storage
  // =========================================================================

  public getApiKeys(): ApiKey[] {
    return [...this.apiKeys];
  }

  public getActiveApiKey(): ApiKey | undefined {
    return this.apiKeys.find((k) => k.status === 'active');
  }

  public createApiKey(
    name: string,
    workspaceId: string = 'ws_default',
    rateLimitPerMinute: number = 60
  ): ApiKey {
    if (this.rbacService && !this.rbacService.hasPermission('api_key:manage')) {
      throw new Error('Access Denied: Missing required permission api_key:manage');
    }
    const rawSecret = `sk_live_${this.generateRandomHex(16)}`;
    const newKey: ApiKey = {
      id: `key_${Date.now()}_${this.generateRandomHex(4)}`,
      name: name || 'API Client Integration',
      keyPrefix: rawSecret.substring(0, 14) + '...',
      secretKey: rawSecret,
      workspaceId: workspaceId || 'ws_default',
      role: 'api_client',
      permissions: [
        'document:generate',
        'document:view',
        'template:view',
      ],
      rateLimitPerMinute: rateLimitPerMinute || 60,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    this.apiKeys.unshift(newKey);
    this.saveApiKeys();
    return newKey;
  }

  public revokeApiKey(id: string): boolean {
    if (this.rbacService && !this.rbacService.hasPermission('api_key:manage')) {
      throw new Error('Access Denied: Missing required permission api_key:manage');
    }
    const key = this.apiKeys.find((k) => k.id === id);
    if (key) {
      key.status = 'revoked';
      this.saveApiKeys();
      return true;
    }
    return false;
  }

  public deleteApiKey(id: string): boolean {
    if (this.rbacService && !this.rbacService.hasPermission('api_key:manage')) {
      throw new Error('Access Denied: Missing required permission api_key:manage');
    }
    const initialLen = this.apiKeys.length;
    this.apiKeys = this.apiKeys.filter((k) => k.id !== id);
    if (this.apiKeys.length !== initialLen) {
      this.saveApiKeys();
      return true;
    }
    return false;
  }

  public resetToDefaultApiKeys(): void {
    this.seedDefaultApiKeys();
    this.saveApiKeys();
  }

  private loadApiKeys(): void {
    try {
      const stored = localStorage.getItem(this.API_KEYS_STORAGE_KEY);
      if (stored) {
        this.apiKeys = JSON.parse(stored);
      } else {
        this.seedDefaultApiKeys();
        this.saveApiKeys();
      }
    } catch (e) {
      console.warn('Could not read API keys from localStorage, seeding defaults:', e);
      this.seedDefaultApiKeys();
    }
  }

  private saveApiKeys(): void {
    try {
      localStorage.setItem(this.API_KEYS_STORAGE_KEY, JSON.stringify(this.apiKeys));
    } catch (e) {
      console.error('Failed to persist API keys to localStorage:', e);
    }
  }

  private seedDefaultApiKeys(): void {
    this.apiKeys = [
      {
        id: 'key_berlin_charite_01',
        name: 'Berlin Charité EMR Pipeline',
        keyPrefix: 'sk_live_charite...',
        secretKey: 'sk_live_charite_9918237461928374',
        workspaceId: 'ws_charite_berlin',
        role: 'api_client',
        permissions: ['document:generate', 'document:view', 'template:view'],
        rateLimitPerMinute: 120,
        status: 'active',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
      {
        id: 'key_munich_dental_02',
        name: 'Munich Dental Billing Service',
        keyPrefix: 'sk_live_munich...',
        secretKey: 'sk_live_munich_5521908472314567',
        workspaceId: 'ws_munich_dental',
        role: 'api_client',
        permissions: ['document:generate', 'document:view', 'template:view'],
        rateLimitPerMinute: 60,
        status: 'active',
        createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      },
      {
        id: 'key_test_sandbox_03',
        name: 'Developer Test Sandbox Key',
        keyPrefix: 'sk_test_demo...',
        secretKey: 'sk_test_demo_0000111122223333',
        workspaceId: 'ws_default',
        role: 'api_client',
        permissions: ['document:generate', 'document:view', 'template:view'],
        rateLimitPerMinute: 30,
        status: 'active',
        createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
      },
    ];
  }

  // =========================================================================
  // Privacy-Safe Audit Logging
  // =========================================================================

  public getAuditLogs(): ApiAuditLog[] {
    return [...this.auditLogs];
  }

  public clearAuditLogs(): void {
    this.auditLogs = [];
    try {
      localStorage.removeItem(this.AUDIT_LOGS_STORAGE_KEY);
    } catch (e) {}
  }

  private loadAuditLogs(): void {
    try {
      const stored = localStorage.getItem(this.AUDIT_LOGS_STORAGE_KEY);
      if (stored) {
        this.auditLogs = JSON.parse(stored);
      }
    } catch (e) {
      this.auditLogs = [];
    }
  }

  private recordAuditLog(
    method: HttpMethod,
    endpoint: string,
    statusCode: number,
    durationMs: number,
    apiKeyId: string,
    workspaceId: string
  ): void {
    const log: ApiAuditLog = {
      id: `log_${Date.now()}_${this.generateRandomHex(4)}`,
      timestamp: new Date().toISOString(),
      method,
      endpoint,
      statusCode,
      durationMs,
      apiKeyId: apiKeyId || 'anonymous',
      workspaceId: workspaceId || 'unknown',
      clientIp: '127.0.0.1 (Loopback/Local)',
      hasSensitiveDataRedacted: true, // Guarantees zero patient PHI in log
    };

    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 100) {
      this.auditLogs = this.auditLogs.slice(0, 100);
    }

    try {
      localStorage.setItem(this.AUDIT_LOGS_STORAGE_KEY, JSON.stringify(this.auditLogs));
    } catch (e) {}
  }

  // =========================================================================
  // Versioned HTTP Dispatcher (/api/v1)
  // =========================================================================

  /**
   * Dispatches a versioned API request, executing authentication, rate limiting,
   * tenant workspace matching, input validation, and business logic execution.
   */
  public async dispatch<T = any>(request: ApiRequest): Promise<ApiResponse<T>> {
    const startTime = performance.now();
    const requestId = `req_${Date.now()}_${this.generateRandomHex(6)}`;

    // Normalize headers
    const headers = request.headers || {};
    const apiKeyHeader =
      headers['X-API-Key'] ||
      headers['x-api-key'] ||
      (headers['Authorization']?.startsWith('Bearer ')
        ? headers['Authorization'].replace('Bearer ', '')
        : '');

    const workspaceHeader =
      headers['X-Workspace-Id'] ||
      headers['x-workspace-id'] ||
      this.tenantWorkspaceService?.getActiveWorkspaceId() ||
      'ws_default';

    // 1. Authentication Check
    const matchingKey = this.apiKeys.find(
      (k) => k.secretKey === apiKeyHeader || (k.id === apiKeyHeader && k.status === 'active')
    );

    if (!matchingKey) {
      const durationMs = Math.round(performance.now() - startTime);
      this.recordAuditLog(request.method, request.endpoint, 401, durationMs, 'none', workspaceHeader);
      return {
        status: 401,
        statusText: 'Unauthorized',
        headers: { 'Content-Type': 'application/json' },
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid API key in X-API-Key or Authorization header.',
        },
        durationMs,
        timestamp: new Date().toISOString(),
        requestId,
      };
    }

    if (matchingKey.status !== 'active') {
      const durationMs = Math.round(performance.now() - startTime);
      this.recordAuditLog(request.method, request.endpoint, 403, durationMs, matchingKey.id, matchingKey.workspaceId);
      return {
        status: 403,
        statusText: 'Forbidden',
        headers: { 'Content-Type': 'application/json' },
        error: {
          code: 'KEY_REVOKED',
          message: 'The provided API key has been revoked or expired.',
        },
        durationMs,
        timestamp: new Date().toISOString(),
        requestId,
      };
    }

    // Update key activity
    matchingKey.lastUsedAt = new Date().toISOString();
    this.saveApiKeys();

    // 2. Sliding-Window Rate Limiting
    const now = Date.now();
    const keyTimestamps = this.rateLimitTimestamps.get(matchingKey.id) || [];
    const validTimestamps = keyTimestamps.filter((t) => now - t < 60000);

    if (validTimestamps.length >= matchingKey.rateLimitPerMinute) {
      const durationMs = Math.round(performance.now() - startTime);
      this.recordAuditLog(request.method, request.endpoint, 429, durationMs, matchingKey.id, matchingKey.workspaceId);
      return {
        status: 429,
        statusText: 'Too Many Requests',
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
          'X-RateLimit-Limit': String(matchingKey.rateLimitPerMinute),
          'X-RateLimit-Remaining': '0',
        },
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Rate limit of ${matchingKey.rateLimitPerMinute} requests per minute exceeded.`,
        },
        durationMs,
        timestamp: new Date().toISOString(),
        requestId,
      };
    }

    validTimestamps.push(now);
    this.rateLimitTimestamps.set(matchingKey.id, validTimestamps);
    const remainingRate = Math.max(0, matchingKey.rateLimitPerMinute - validTimestamps.length);

    // 3. Route & Dispatch Request
    const cleanEndpoint = request.endpoint.split('?')[0].replace(/\/$/, '');
    let response: { status: number; statusText: string; data?: any; error?: any };

    try {
      response = await this.handleRoute(request.method, cleanEndpoint, request, matchingKey);
    } catch (e: any) {
      response = {
        status: 500,
        statusText: 'Internal Server Error',
        error: {
          code: 'INTERNAL_ERROR',
          message: e?.message || 'An unexpected error occurred executing the API request.',
        },
      };
    }

    const durationMs = Math.round(performance.now() - startTime);
    this.recordAuditLog(
      request.method,
      request.endpoint,
      response.status,
      durationMs,
      matchingKey.id,
      matchingKey.workspaceId
    );

    return {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': String(matchingKey.rateLimitPerMinute),
        'X-RateLimit-Remaining': String(remainingRate),
        'X-Workspace-Id': matchingKey.workspaceId,
        'X-Response-Time': `${durationMs}ms`,
      },
      data: response.data,
      error: response.error,
      durationMs,
      timestamp: new Date().toISOString(),
      requestId,
    };
  }

  private async handleRoute(
    method: HttpMethod,
    endpoint: string,
    request: ApiRequest,
    key: ApiKey
  ): Promise<{ status: number; statusText: string; data?: any; error?: any }> {
    const body = request.body || {};

    // -----------------------------------------------------------------------
    // POST /api/v1/documents/render (Stateless Preview Render)
    // -----------------------------------------------------------------------
    if (method === 'POST' && endpoint === '/api/v1/documents/render') {
      let templateHtml = body.templateHtml;
      if (!templateHtml && body.templateId) {
        const found = DOCUMENT_FORMATS.find((f) => f.id === body.templateId);
        if (found) {
          templateHtml = found.defaultHtml;
        }
      }

      if (!templateHtml) {
        return {
          status: 400,
          statusText: 'Bad Request',
          error: {
            code: 'MISSING_TEMPLATE',
            message: 'Provide either "templateHtml" or a valid "templateId".',
          },
        };
      }

      const payload = body.data || body.payload || {};
      const renderedHtml = DataBindingEngine.render(templateHtml, payload);
      const varMatches = Array.from(templateHtml.matchAll(/\{\{([a-zA-Z0-9_.]+)\}\}/g));
      const missingVars = Array.from(new Set(
        varMatches
          .map((m: any) => m[1])
          .filter((v: string) => !v.startsWith('#') && !v.startsWith('/') && !v.startsWith('else'))
          .filter((v: string) => {
            const parts = v.split('.');
            let curr: any = payload;
            for (const p of parts) {
              if (curr == null || typeof curr !== 'object' || !(p in curr)) return true;
              curr = curr[p];
            }
            return curr == null || curr === '';
          })
      ));

      return {
        status: 200,
        statusText: 'OK',
        data: {
          renderedHtml,
          isValid: missingVars.length === 0,
          missingVariables: missingVars,
          characterCount: renderedHtml.length,
          generatedAt: new Date().toISOString(),
        },
      };
    }

    // -----------------------------------------------------------------------
    // POST /api/v1/documents (Generate & Save Document Instance)
    // -----------------------------------------------------------------------
    if (method === 'POST' && endpoint === '/api/v1/documents') {
      if (!body.title) {
        return {
          status: 400,
          statusText: 'Bad Request',
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Field "title" is required.',
          },
        };
      }

      let templateHtml = body.templateHtml;
      let templateName = body.templateName || 'API Generated Document';
      let templateId = body.templateId || 'tmpl_custom';

      if (!templateHtml && body.templateId) {
        const found = DOCUMENT_FORMATS.find((f) => f.id === body.templateId);
        if (found) {
          templateHtml = found.defaultHtml;
          templateName = found.name;
        }
      }

      if (!templateHtml) {
        return {
          status: 400,
          statusText: 'Bad Request',
          error: {
            code: 'MISSING_TEMPLATE',
            message: 'A valid "templateId" or "templateHtml" is required to generate a document.',
          },
        };
      }

      const payload = body.data || body.payload || {};
      const newDoc = this.documentService.generateAndSaveDocument({
        title: body.title,
        templateId,
        templateName,
        templateHtml,
        payload,
        category: body.category || 'clinical_documents',
        options: {
          actor: `API (${key.name})`,
        },
      });

      return {
        status: 201,
        statusText: 'Created',
        data: {
          document: newDoc,
          message: `Document "${newDoc.title}" generated successfully in workspace ${key.workspaceId}.`,
        },
      };
    }

    // -----------------------------------------------------------------------
    // GET /api/v1/documents/:id (Fetch Document Instance)
    // -----------------------------------------------------------------------
    if (method === 'GET' && endpoint.startsWith('/api/v1/documents/')) {
      const parts = endpoint.split('/');
      const docId = parts[parts.length - 1];
      const doc = this.documentService.getDocumentById(docId);

      if (!doc) {
        return {
          status: 404,
          statusText: 'Not Found',
          error: {
            code: 'DOCUMENT_NOT_FOUND',
            message: `Document with ID "${docId}" does not exist.`,
          },
        };
      }

      return {
        status: 200,
        statusText: 'OK',
        data: { document: doc },
      };
    }

    // -----------------------------------------------------------------------
    // POST /api/v1/documents/:id/export (Export Document to Print HTML)
    // -----------------------------------------------------------------------
    if (method === 'POST' && endpoint.includes('/export')) {
      const parts = endpoint.split('/');
      const docId = parts[parts.indexOf('documents') + 1];
      const doc = this.documentService.getDocumentById(docId);

      if (!doc) {
        return {
          status: 404,
          statusText: 'Not Found',
          error: {
            code: 'DOCUMENT_NOT_FOUND',
            message: `Document with ID "${docId}" does not exist for export.`,
          },
        };
      }

      const exportOpts: PdfExportOptions = {
        pageSize: body.pageSize || 'A4',
        orientation: body.orientation || 'portrait',
        margins: body.margins || 'normal',
        watermark: body.watermark || 'none',
        customWatermarkText: body.customWatermarkText,
        documentTitle: doc.title,
        includeVerificationQr: body.includeVerificationQr !== false,
        verificationCode: `VERIFIED-${doc.id}`,
        includeBarcode: body.includeBarcode !== false,
        barcodeValue: doc.patientMrn || 'MRN-2026',
      };

      const printHtml = this.pdfExportService.buildPrintHtml(doc.renderedHtml, exportOpts);

      return {
        status: 200,
        statusText: 'OK',
        data: {
          documentId: doc.id,
          title: doc.title,
          options: exportOpts,
          printHtml,
          downloadFileName: `${doc.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.html`,
        },
      };
    }

    // -----------------------------------------------------------------------
    // GET /api/v1/templates (List Workspace Templates)
    // -----------------------------------------------------------------------
    if (method === 'GET' && endpoint === '/api/v1/templates') {
      const queryParams = request.params || {};
      let formats = [...DOCUMENT_FORMATS];

      if (queryParams['category']) {
        formats = formats.filter(
          (f) => f.category.toLowerCase() === queryParams['category'].toLowerCase()
        );
      }

      const templatesList = formats.map((f) => ({
        id: f.id,
        name: f.name,
        category: f.category,
        description: f.description,
        icon: f.icon || 'fa fa-file-text-o',
        hasSamplePayload: true,
        workspaceId: key.workspaceId,
      }));

      return {
        status: 200,
        statusText: 'OK',
        data: {
          templates: templatesList,
          totalCount: templatesList.length,
          workspaceId: key.workspaceId,
        },
      };
    }

    // -----------------------------------------------------------------------
    // GET /api/v1/templates/:id (Get Template Definition)
    // -----------------------------------------------------------------------
    if (method === 'GET' && endpoint.startsWith('/api/v1/templates/')) {
      const parts = endpoint.split('/');
      const templateId = parts[parts.length - 1];
      const found = DOCUMENT_FORMATS.find((f) => f.id === templateId);

      if (!found) {
        return {
          status: 404,
          statusText: 'Not Found',
          error: {
            code: 'TEMPLATE_NOT_FOUND',
            message: `Template with ID "${templateId}" was not found.`,
          },
        };
      }

      return {
        status: 200,
        statusText: 'OK',
        data: {
          template: {
            id: found.id,
            name: found.name,
            category: found.category,
            description: found.description,
            defaultHtml: found.defaultHtml,
            tokens: found.tokens || [],
            workspaceId: key.workspaceId,
          },
        },
      };
    }

    // -----------------------------------------------------------------------
    // POST /api/v1/templates (Register/Create Template)
    // -----------------------------------------------------------------------
    if (method === 'POST' && endpoint === '/api/v1/templates') {
      if (!body.name || !body.html) {
        return {
          status: 400,
          statusText: 'Bad Request',
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Both "name" and "html" are required to register a template.',
          },
        };
      }

      const newTmpl: DocumentFormat = {
        id: `tmpl_${Date.now()}_${this.generateRandomHex(4)}`,
        name: body.name,
        shortName: (body.name as string).substring(0, 8),
        icon: body.icon || 'fa fa-file-text-o',
        emoji: body.emoji || '📄',
        category: body.category || 'clinical_documents',
        categoryLabel: body.categoryLabel || 'Clinical Documents',
        description: body.description || 'API registered template',
        features: body.features || ['API Registered'],
        defaultHtml: body.html,
        tokens: (body.variables || ['patient.name', 'date']).map((v: string) => ({
          key: v,
          label: v,
          example: 'Sample',
        })),
        previewSvg: '',
      };

      DOCUMENT_FORMATS.unshift(newTmpl);

      return {
        status: 201,
        statusText: 'Created',
        data: {
          template: newTmpl,
          message: `Template "${newTmpl.name}" registered successfully.`,
        },
      };
    }

    // -----------------------------------------------------------------------
    // POST /api/v1/templates/:id/publish (Publish Template Version)
    // -----------------------------------------------------------------------
    if (method === 'POST' && endpoint.includes('/publish')) {
      const parts = endpoint.split('/');
      const templateId = parts[parts.indexOf('templates') + 1];
      const found = DOCUMENT_FORMATS.find((f) => f.id === templateId);

      if (!found) {
        return {
          status: 404,
          statusText: 'Not Found',
          error: {
            code: 'TEMPLATE_NOT_FOUND',
            message: `Template with ID "${templateId}" not found to publish.`,
          },
        };
      }

      return {
        status: 200,
        statusText: 'OK',
        data: {
          templateId: found.id,
          name: found.name,
          status: 'published',
          publishedAt: new Date().toISOString(),
          version: '1.0.0',
        },
      };
    }

    // Fallthrough: Endpoint Not Found
    return {
      status: 404,
      statusText: 'Not Found',
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: `Endpoint "${method} ${endpoint}" does not exist on /api/v1.`,
      },
    };
  }

  // =========================================================================
  // Endpoint Registry & Definitions
  // =========================================================================

  public getEndpointDefinitions(): ApiEndpointDefinition[] {
    return [
      {
        id: 'render_document',
        method: 'POST',
        path: '/api/v1/documents/render',
        title: 'Stateless Document Render',
        description:
          'Renders structured data into a template without persisting a document instance. Returns compiled HTML and missing variables.',
        category: 'Documents',
        requiresAuth: true,
        sampleBody: {
          templateId: 'physio_assessment',
          data: {
            patient: {
              name: 'Maximilian Krause',
              dob: '1984-06-18',
              mrn: 'MRN-DE-98214',
            },
            doctor: { name: 'Dr. Stefan Berger' },
            pain_score: '7/10',
            symptoms: 'Lumbalgie & HWS-Syndrom',
            treatment_goals: 'Schmerzreduktion & Wiederherstellung der Mobilität',
          },
        },
      },
      {
        id: 'generate_document',
        method: 'POST',
        path: '/api/v1/documents',
        title: 'Generate & Store Document',
        description:
          'Generates a new validated document instance, compiles dynamic bindings, and stores it in the workspace Document Hub.',
        category: 'Documents',
        requiresAuth: true,
        sampleBody: {
          title: 'Physiotherapie Erstbefund - Maximilian Krause',
          templateId: 'physio_assessment',
          patientName: 'Maximilian Krause',
          patientMrn: 'MRN-DE-98214',
          category: 'physiotherapy',
          data: {
            patient: {
              name: 'Maximilian Krause',
              dob: '1984-06-18',
              mrn: 'MRN-DE-98214',
            },
            doctor: { name: 'Dr. Stefan Berger' },
            pain_score: '7/10',
            symptoms: 'Lumbalgie',
          },
        },
      },
      {
        id: 'get_document',
        method: 'GET',
        path: '/api/v1/documents/{id}',
        title: 'Get Document Instance',
        description: 'Retrieves a single generated document instance by unique ID, including clinical audit log.',
        category: 'Documents',
        requiresAuth: true,
      },
      {
        id: 'export_document',
        method: 'POST',
        path: '/api/v1/documents/{id}/export',
        title: 'Export Document to PDF / Print HTML',
        description:
          'Generates a print-optimized document bundle with @page rules, vector barcodes, 2D QR codes, and watermarks.',
        category: 'Export',
        requiresAuth: true,
        sampleBody: {
          pageSize: 'A4',
          orientation: 'portrait',
          margins: 'normal',
          watermark: 'confidential',
          includeVerificationQr: true,
          includeBarcode: true,
        },
      },
      {
        id: 'list_templates',
        method: 'GET',
        path: '/api/v1/templates',
        title: 'List Workspace Templates',
        description: 'Lists all document and form templates available in the workspace with taxonomy filtering.',
        category: 'Templates',
        requiresAuth: true,
      },
      {
        id: 'get_template',
        method: 'GET',
        path: '/api/v1/templates/{id}',
        title: 'Get Template Definition',
        description: 'Retrieves full template HTML, variable schema, and metadata by template ID.',
        category: 'Templates',
        requiresAuth: true,
      },
      {
        id: 'create_template',
        method: 'POST',
        path: '/api/v1/templates',
        title: 'Register New Template',
        description: 'Uploads and registers a new document template into the workspace catalog.',
        category: 'Templates',
        requiresAuth: true,
        sampleBody: {
          name: 'Cardiology Follow-up Letter',
          category: 'clinical_documents',
          description: 'Specialist cardiologist patient letter with medication grid',
          html: '<div class="cardio-letter"><h1>Kardiologischer Verlaufsbericht</h1><p>Patient: {{patient.name}}</p></div>',
          variables: ['patient.name', 'cardio.findings', 'doctor.name'],
        },
      },
      {
        id: 'publish_template',
        method: 'POST',
        path: '/api/v1/templates/{id}/publish',
        title: 'Publish Template Version',
        description: 'Marks a template version as published and ready for production document generation.',
        category: 'Templates',
        requiresAuth: true,
      },
    ];
  }

  // =========================================================================
  // Code Snippet Generators (cURL, JavaScript, Python)
  // =========================================================================

  public generateCurlSnippet(
    endpoint: ApiEndpointDefinition,
    body?: any,
    apiKey?: string,
    workspaceId?: string
  ): string {
    const key = apiKey || 'sk_live_your_api_key_here';
    const ws = workspaceId || 'ws_default';
    const url = `https://api.healthcare-studio.local${endpoint.path}`;

    if (endpoint.method === 'GET') {
      return `curl -X GET "${url}" \\
  -H "X-API-Key: ${key}" \\
  -H "X-Workspace-Id: ${ws}" \\
  -H "Accept: application/json"`;
    }

    const jsonBody = JSON.stringify(body || endpoint.sampleBody || {}, null, 2);
    return `curl -X ${endpoint.method} "${url}" \\
  -H "X-API-Key: ${key}" \\
  -H "X-Workspace-Id: ${ws}" \\
  -H "Content-Type: application/json" \\
  -d '${jsonBody}'`;
  }

  public generateFetchSnippet(
    endpoint: ApiEndpointDefinition,
    body?: any,
    apiKey?: string,
    workspaceId?: string
  ): string {
    const key = apiKey || 'sk_live_your_api_key_here';
    const ws = workspaceId || 'ws_default';
    const url = `https://api.healthcare-studio.local${endpoint.path}`;

    if (endpoint.method === 'GET') {
      return `const response = await fetch("${url}", {
  method: "GET",
  headers: {
    "X-API-Key": "${key}",
    "X-Workspace-Id": "${ws}",
    "Accept": "application/json"
  }
});
const result = await response.json();
console.log(result);`;
    }

    const jsonBody = JSON.stringify(body || endpoint.sampleBody || {}, null, 2);
    return `const response = await fetch("${url}", {
  method: "${endpoint.method}",
  headers: {
    "X-API-Key": "${key}",
    "X-Workspace-Id": "${ws}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify(${jsonBody})
});
const result = await response.json();
console.log(result);`;
  }

  public generatePythonSnippet(
    endpoint: ApiEndpointDefinition,
    body?: any,
    apiKey?: string,
    workspaceId?: string
  ): string {
    const key = apiKey || 'sk_live_your_api_key_here';
    const ws = workspaceId || 'ws_default';
    const url = `https://api.healthcare-studio.local${endpoint.path}`;

    if (endpoint.method === 'GET') {
      return `import requests

url = "${url}"
headers = {
    "X-API-Key": "${key}",
    "X-Workspace-Id": "${ws}",
    "Accept": "application/json"
}

response = requests.get(url, headers=headers)
print(response.json())`;
    }

    const jsonBody = JSON.stringify(body || endpoint.sampleBody || {}, null, 4);
    return `import requests

url = "${url}"
headers = {
    "X-API-Key": "${key}",
    "X-Workspace-Id": "${ws}",
    "Content-Type": "application/json"
}
payload = ${jsonBody}

response = requests.post(url, headers=headers, json=payload)
print(response.json())`;
  }

  private generateRandomHex(length: number): string {
    let result = '';
    const chars = '0123456789abcdef';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
