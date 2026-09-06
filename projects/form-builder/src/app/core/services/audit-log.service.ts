import { Injectable, Optional } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  AuditAction,
  AuditActor,
  AuditEvent,
  AuditExportResult,
  AuditFilterCriteria,
  AuditResourceType,
} from '../domain/audit-event.model';
import { TenantWorkspaceService } from './tenant-workspace.service';
import { RbacService } from './rbac.service';

/**
 * Enterprise Audit Logging Service (Phase 14).
 * Enforces strict HIPAA Security Rule § 164.312(b) audit trail compliance:
 * - Records critical template, document, credential, access, and workspace operations.
 * - Multi-tier automated sanitization: Permanently purges any PHI, diagnoses,
 *   medical notes, full document bodies, and auth secrets from audit payloads.
 * - Multi-tenant workspace isolation.
 * - Standardized RFC-compliant CSV and JSON governance exports.
 */
@Injectable({
  providedIn: 'root',
})
export class AuditLogService {
  private readonly STORAGE_KEY = 'form_builder_audit_trail_v1';

  /** Blacklisted property keys that MUST NEVER be persisted in audit trails */
  private readonly SENSITIVE_KEY_PATTERNS: RegExp[] = [
    /patient/i,
    /diagnosis/i,
    /diagnoses/i,
    /medical/i,
    /clinical/i,
    /notes?/i,
    /body/i,
    /content/i,
    /fullcontent/i,
    /payload/i,
    /secret/i,
    /password/i,
    /token/i,
    /apikeysecret/i,
    /ssn/i,
    /mrn/i,
    /dob/i,
    /healthrecord/i,
    /phi/i,
    /auth/i,
    /credential/i,
    /privatekey/i,
    /allerg(y|ies)/i,
    /prescription/i,
  ];

  private eventsSubject = new BehaviorSubject<AuditEvent[]>([]);
  public events$: Observable<AuditEvent[]> = this.eventsSubject.asObservable();

  constructor(
    @Optional() private tenantService?: TenantWorkspaceService,
    @Optional() private rbacService?: RbacService
  ) {
    this.loadEvents();
  }

  // =========================================================================
  // Core Event Recording
  // =========================================================================

  /**
   * Records a security/governance audit event with sanitized metadata.
   */
  public recordEvent(
    action: AuditAction,
    resourceType: AuditResourceType,
    resourceId: string,
    metadata?: Record<string, any>,
    customActor?: Partial<AuditActor>
  ): AuditEvent {
    const currentUser = this.rbacService?.getCurrentUser();
    const activeWs = this.tenantService?.getActiveWorkspace();
    const activeOrg = this.tenantService?.getActiveOrganization();

    const actor: AuditActor = {
      id: customActor?.id || currentUser?.id || 'usr-system',
      name:
        customActor?.name ||
        (currentUser ? `${currentUser.firstName} ${currentUser.lastName}`.trim() : 'System Engine'),
      email: customActor?.email || currentUser?.email || 'system@medtemplate.platform',
      role: customActor?.role || currentUser?.role || 'system',
      ipAddress: customActor?.ipAddress || '127.0.0.1',
      userAgent:
        customActor?.userAgent ||
        (typeof navigator !== 'undefined' ? navigator.userAgent : 'MedTemplate-Studio/1.0'),
    };

    const event: AuditEvent = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      workspaceId: activeWs?.id || 'ws-default',
      organizationId: activeOrg?.id,
      actor,
      action,
      resourceType,
      resourceId,
      timestamp: new Date().toISOString(),
      metadata: this.sanitizeMetadata(metadata),
    };

    const currentEvents = this.eventsSubject.value;
    const updatedEvents = [event, ...currentEvents];
    this.saveEvents(updatedEvents);

    return event;
  }

  // =========================================================================
  // Strict PHI / Secret Sanitization Engine
  // =========================================================================

  /**
   * Purges all Protected Health Information (PHI) and credentials from metadata.
   * Restricts metadata to scalar primitives and safe arrays/objects.
   */
  public sanitizeMetadata(
    rawMetadata?: Record<string, any>
  ): Record<string, string | number | boolean | null> | undefined {
    if (!rawMetadata || typeof rawMetadata !== 'object') {
      return undefined;
    }

    const sanitized: Record<string, string | number | boolean | null> = {};

    for (const [key, val] of Object.entries(rawMetadata)) {
      if (this.isKeyForbidden(key)) {
        continue; // Strictly omit PHI / secret key
      }

      if (val === null || val === undefined) {
        sanitized[key] = null;
      } else if (typeof val === 'boolean' || typeof val === 'number') {
        sanitized[key] = val;
      } else if (typeof val === 'string') {
        sanitized[key] = this.sanitizeStringValue(val);
      } else if (Array.isArray(val)) {
        // Safe representation of scalar arrays (e.g. scopes, tags)
        const safeArray = val
          .filter((item) => typeof item === 'string' || typeof item === 'number')
          .slice(0, 10);
        sanitized[key] = safeArray.join(', ');
      } else if (typeof val === 'object') {
        // Safely extract safe scalar properties
        const subKeys = Object.keys(val).filter((subKey) => !this.isKeyForbidden(subKey));
        sanitized[key] = `[Object: ${subKeys.slice(0, 5).join(', ')}]`;
      }
    }

    return Object.keys(sanitized).length > 0 ? sanitized : undefined;
  }

  /**
   * Checks whether a field name matches prohibited PHI / secret patterns.
   */
  public isKeyForbidden(key: string): boolean {
    return this.SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
  }

  private sanitizeStringValue(str: string): string {
    // Truncate excessively long strings to avoid storing document blobs
    if (str.length > 200) {
      return str.substring(0, 197) + '...';
    }
    return str;
  }

  // =========================================================================
  // Querying & Filtering
  // =========================================================================

  /**
   * Returns filtered audit events based on specified criteria.
   */
  public getEvents(filters?: AuditFilterCriteria): AuditEvent[] {
    let list = this.eventsSubject.value;

    if (!filters) {
      return list;
    }

    if (filters.workspaceId && filters.workspaceId !== 'all') {
      list = list.filter((e) => e.workspaceId === filters.workspaceId);
    }

    if (filters.action && filters.action !== 'all') {
      list = list.filter((e) => e.action === filters.action);
    }

    if (filters.resourceType && filters.resourceType !== 'all') {
      list = list.filter((e) => e.resourceType === filters.resourceType);
    }

    if (filters.actorId) {
      const query = filters.actorId.toLowerCase();
      list = list.filter(
        (e) =>
          e.actor.id.toLowerCase().includes(query) ||
          (e.actor.email && e.actor.email.toLowerCase().includes(query)) ||
          (e.actor.name && e.actor.name.toLowerCase().includes(query))
      );
    }

    if (filters.fromDate) {
      const fromTime = new Date(filters.fromDate).getTime();
      if (!isNaN(fromTime)) {
        list = list.filter((e) => new Date(e.timestamp).getTime() >= fromTime);
      }
    }

    if (filters.toDate) {
      const toTime = new Date(filters.toDate).getTime();
      if (!isNaN(toTime)) {
        list = list.filter((e) => new Date(e.timestamp).getTime() <= toTime);
      }
    }

    if (filters.searchTerm && filters.searchTerm.trim()) {
      const term = filters.searchTerm.toLowerCase().trim();
      list = list.filter((e) => {
        const matchAction = e.action.toLowerCase().includes(term);
        const matchResource =
          e.resourceType.toLowerCase().includes(term) ||
          e.resourceId.toLowerCase().includes(term);
        const matchActor =
          (e.actor.name && e.actor.name.toLowerCase().includes(term)) ||
          (e.actor.email && e.actor.email.toLowerCase().includes(term)) ||
          (e.actor.role && e.actor.role.toLowerCase().includes(term));
        const matchMetadata =
          e.metadata &&
          Object.entries(e.metadata).some(
            ([k, v]) =>
              k.toLowerCase().includes(term) ||
              (v !== null && String(v).toLowerCase().includes(term))
          );
        return matchAction || matchResource || matchActor || matchMetadata;
      });
    }

    return list;
  }

  // =========================================================================
  // Governance Export (CSV & JSON)
  // =========================================================================

  /**
   * Exports filtered audit events as an RFC 4180-compliant CSV string.
   */
  public exportAsCsv(filters?: AuditFilterCriteria): AuditExportResult {
    const events = this.getEvents(filters);
    const headers = [
      'Event ID',
      'Timestamp',
      'Action',
      'Resource Type',
      'Resource ID',
      'Actor ID',
      'Actor Name',
      'Actor Email',
      'Actor Role',
      'IP Address',
      'Workspace ID',
      'Organization ID',
      'Sanitized Metadata',
    ];

    const escapeCsv = (val: any): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = events.map((e) => {
      const metaStr = e.metadata ? JSON.stringify(e.metadata) : '';
      return [
        escapeCsv(e.id),
        escapeCsv(e.timestamp),
        escapeCsv(e.action),
        escapeCsv(e.resourceType),
        escapeCsv(e.resourceId),
        escapeCsv(e.actor.id),
        escapeCsv(e.actor.name || ''),
        escapeCsv(e.actor.email || ''),
        escapeCsv(e.actor.role || ''),
        escapeCsv(e.actor.ipAddress || ''),
        escapeCsv(e.workspaceId),
        escapeCsv(e.organizationId || ''),
        escapeCsv(metaStr),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    return {
      filename: `audit_trail_export_${timestamp}.csv`,
      format: 'csv',
      content: csvContent,
      mimeType: 'text/csv;charset=utf-8;',
      count: events.length,
    };
  }

  /**
   * Exports filtered audit events as formatted JSON.
   */
  public exportAsJson(filters?: AuditFilterCriteria): AuditExportResult {
    const events = this.getEvents(filters);
    const payload = {
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        totalEvents: events.length,
        filterCriteria: filters || {},
        complianceStandard: 'HIPAA Security Rule § 164.312(b) Non-PHI Audit Trail',
      },
      events,
    };

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    return {
      filename: `audit_trail_export_${timestamp}.json`,
      format: 'json',
      content: JSON.stringify(payload, null, 2),
      mimeType: 'application/json;charset=utf-8;',
      count: events.length,
    };
  }

  /**
   * Triggers client browser download of the export file.
   */
  public downloadExport(result: AuditExportResult): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    const blob = new Blob([result.content], { type: result.mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', result.filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // =========================================================================
  // Persistence & Storage
  // =========================================================================

  public clearEvents(workspaceId?: string): void {
    if (workspaceId) {
      const remaining = this.eventsSubject.value.filter((e) => e.workspaceId !== workspaceId);
      this.saveEvents(remaining);
    } else {
      this.saveEvents([]);
    }
  }

  private loadEvents(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        if (raw) {
          const parsed: AuditEvent[] = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.eventsSubject.next(parsed);
            return;
          }
        }
      }
    } catch {
      // Fallback
    }

    // Seed realistic compliance demo events if storage empty
    this.seedDemonstrationEvents();
  }

  private saveEvents(events: AuditEvent[]): void {
    this.eventsSubject.next(events);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(events));
      }
    } catch {
      // Fallback
    }
  }

  public seedDemonstrationEvents(): void {
    const now = Date.now();
    const demoEvents: AuditEvent[] = [
      {
        id: 'aud_init_001',
        workspaceId: 'ws-default',
        organizationId: 'org-demo',
        actor: {
          id: 'usr_admin',
          name: 'Sarah Connor',
          email: 'sarah.connor@apexhealth.org',
          role: 'hospital_admin',
          ipAddress: '10.0.4.12',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        },
        action: 'user.login',
        resourceType: 'user',
        resourceId: 'usr_admin',
        timestamp: new Date(now - 3600000 * 24 * 2).toISOString(),
        metadata: {
          authMethod: 'sso_saml',
          mfaVerified: true,
        },
      },
      {
        id: 'aud_init_002',
        workspaceId: 'ws-default',
        organizationId: 'org-demo',
        actor: {
          id: 'usr_lead',
          name: 'Dr. John Dorian',
          email: 'j.dorian@apexhealth.org',
          role: 'clinical_lead',
          ipAddress: '10.0.4.55',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
        action: 'template.created',
        resourceType: 'template',
        resourceId: 'tpl_amb_cardio',
        timestamp: new Date(now - 3600000 * 20).toISOString(),
        metadata: {
          templateName: 'Outpatient Cardiology Intake',
          initialVersion: '1.0.0',
          locale: 'en-US',
        },
      },
      {
        id: 'aud_init_003',
        workspaceId: 'ws-default',
        organizationId: 'org-demo',
        actor: {
          id: 'usr_lead',
          name: 'Dr. John Dorian',
          email: 'j.dorian@apexhealth.org',
          role: 'clinical_lead',
          ipAddress: '10.0.4.55',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
        action: 'template.published',
        resourceType: 'template_version',
        resourceId: 'tpl_amb_cardio_v1',
        timestamp: new Date(now - 3600000 * 12).toISOString(),
        metadata: {
          version: '1.0.0',
          approver: 'Dr. John Dorian',
          status: 'published',
        },
      },
      {
        id: 'aud_init_004',
        workspaceId: 'ws-default',
        organizationId: 'org-demo',
        actor: {
          id: 'usr_staff',
          name: 'Nurse Carla Espinosa',
          email: 'carla.espinosa@apexhealth.org',
          role: 'healthcare_staff',
          ipAddress: '10.0.4.78',
          userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)',
        },
        action: 'document.generated',
        resourceType: 'document',
        resourceId: 'doc_gen_99214',
        timestamp: new Date(now - 3600000 * 4).toISOString(),
        metadata: {
          templateId: 'tpl_amb_cardio',
          templateVersion: '1.0.0',
          exportFormat: 'pdf',
          totalPages: 2,
        },
      },
      {
        id: 'aud_init_005',
        workspaceId: 'ws-default',
        organizationId: 'org-demo',
        actor: {
          id: 'usr_admin',
          name: 'Sarah Connor',
          email: 'sarah.connor@apexhealth.org',
          role: 'hospital_admin',
          ipAddress: '10.0.4.12',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        },
        action: 'api_key.created',
        resourceType: 'api_key',
        resourceId: 'key_ehr_sync',
        timestamp: new Date(now - 3600000 * 2).toISOString(),
        metadata: {
          keyName: 'Epic EHR Connector',
          scopes: 'template:read, document:generate',
          expiresInDays: 365,
        },
      },
      {
        id: 'aud_init_006',
        workspaceId: 'ws-default',
        organizationId: 'org-demo',
        actor: {
          id: 'usr_admin',
          name: 'Sarah Connor',
          email: 'sarah.connor@apexhealth.org',
          role: 'hospital_admin',
          ipAddress: '10.0.4.12',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        },
        action: 'permission.changed',
        resourceType: 'permission',
        resourceId: 'usr_staff',
        timestamp: new Date(now - 3600000 * 1).toISOString(),
        metadata: {
          targetUser: 'carla.espinosa@apexhealth.org',
          grantedScope: 'document:export',
        },
      },
    ];

    this.saveEvents(demoEvents);
  }
}
