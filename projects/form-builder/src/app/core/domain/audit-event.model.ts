/**
 * Core Domain Model: AuditEvent
 * Comprehensive security and compliance audit logging.
 * IMPORTANT: NEVER logs sensitive health records, diagnoses, passwords, or full document bodies.
 */

export type AuditAction =
  | 'user.login'
  | 'user.logout'
  | 'template.created'
  | 'template.updated'
  | 'template.published'
  | 'template.archived'
  | 'template.deleted'
  | 'template_version.created'
  | 'document.generated'
  | 'document.viewed'
  | 'document.deleted'
  | 'api_key.created'
  | 'api_key.revoked'
  | 'brand.updated'
  | 'permission.changed'
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
  | 'form';

export interface AuditActor {
  id: string;
  email?: string;
  role?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditEvent {
  id: string;
  workspaceId: string;
  actor: AuditActor;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId: string;
  timestamp: string; // ISO 8601
  metadata?: Record<string, string | number | boolean | null>; // Strictly sanitized non-PHI metadata
}
