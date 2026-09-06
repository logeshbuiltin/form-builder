import { UserRole, Permission } from './user.model';

/**
 * Core Domain Model: API Client, Keys & Versioned Endpoints (Phase 9)
 * Supports multi-tenant isolation, rate limiting, and privacy-safe audit logging.
 */

export interface ApiKey {
  id: string; // e.g. 'key_live_berlin_emr_01'
  name: string; // e.g. 'Berlin Hospital EMR Integration'
  keyPrefix: string; // e.g. 'sk_live_a1b2' (safe for display)
  secretKey: string; // full key, e.g. 'sk_live_a1b2c3d4e5f6g7h8i9j0'
  workspaceId: string; // Tenant workspace boundary
  role: UserRole;
  permissions: Permission[];
  rateLimitPerMinute: number; // e.g. 60 requests / min
  status: 'active' | 'revoked' | 'expired';
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface ApiRequest<T = any> {
  method: HttpMethod;
  endpoint: string; // e.g. '/api/v1/documents/render'
  headers?: Record<string, string>;
  params?: Record<string, string>;
  body?: T;
}

export interface ApiResponse<T = any> {
  status: number; // HTTP status code (200, 201, 400, 401, 403, 404, 429, 500)
  statusText: string;
  headers: Record<string, string>;
  data?: T;
  error?: ApiErrorPayload;
  durationMs: number;
  timestamp: string;
  requestId: string;
}

export interface ApiErrorPayload {
  code: string; // e.g. 'INVALID_API_KEY', 'RATE_LIMIT_EXCEEDED', 'VALIDATION_FAILED'
  message: string;
  details?: any;
}

export interface ApiAuditLog {
  id: string;
  timestamp: string;
  method: HttpMethod;
  endpoint: string;
  statusCode: number;
  durationMs: number;
  apiKeyId: string;
  workspaceId: string;
  clientIp: string;
  // STRICT COMPLIANCE: Zero PHI (no patient names, MRNs, notes, or diagnoses stored)
  hasSensitiveDataRedacted: boolean;
}

export interface ApiEndpointDefinition {
  id: string;
  method: HttpMethod;
  path: string;
  title: string;
  description: string;
  category: 'Documents' | 'Templates' | 'Export';
  requiresAuth: boolean;
  requiredPermission?: Permission;
  sampleBody?: any;
  sampleResponse?: any;
}
