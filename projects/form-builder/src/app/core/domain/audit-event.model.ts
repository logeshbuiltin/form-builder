/**
 * Core Domain Model: AuditEvent
 * Comprehensive security and compliance audit logging.
 * IMPORTANT: NEVER logs sensitive health records, diagnoses, passwords, or full document bodies.
 */

export type AuditAction =
  | 'user.login'
  | 'user.logout'
  | 'template.created'
  | 'template.edited'
  | 'template.published'
  | 'template.archived'
  | 'template.deleted'
  | 'template_version.created'
  | 'template_version.rollback'
  | 'document.generated'
  | 'document.viewed'
  | 'document.deleted'
  | 'api_key.created'
  | 'api_key.revoked'
  | 'brand.created'
  | 'brand.updated'
  | 'brand.deleted'
  | 'permission.changed'
  | 'workspace.switched'
  | 'workspace.updated';

export type AuditResourceType =
  | 'template'
  | 'template_version'
  | 'document'
  | 'user'
  | 'workspace'
  | 'organization'
  | 'brand'
  | 'api_key'
  | 'permission'
  | 'form'
  | 'system';

export interface AuditActor {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditEvent {
  id: string;
  workspaceId: string;
  organizationId?: string;
  actor: AuditActor;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId: string;
  timestamp: string; // ISO 8601
  metadata?: Record<string, string | number | boolean | null>; // Strictly sanitized non-PHI metadata
}

export interface AuditFilterCriteria {
  workspaceId?: string;
  action?: AuditAction | 'all';
  resourceType?: AuditResourceType | 'all';
  actorId?: string;
  searchTerm?: string;
  fromDate?: string; // ISO 8601 or YYYY-MM-DD
  toDate?: string;   // ISO 8601 or YYYY-MM-DD
}

export interface AuditExportResult {
  filename: string;
  format: 'csv' | 'json';
  content: string;
  mimeType: string;
  count: number;
}

