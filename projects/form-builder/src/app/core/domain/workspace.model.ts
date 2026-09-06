/**
 * Core Domain Model: Workspace & Organization
 * Represents multi-tenant isolation boundaries.
 */

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  defaultBrandId?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface Workspace {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description?: string;
  industry?: string; // e.g. 'healthcare', 'legal', 'finance', 'general'
  defaultLanguage: string; // ISO 639-1 code, e.g. 'en', 'de'
  defaultCountry?: string; // ISO 3166-1 alpha-2, e.g. 'DE', 'US', 'MY'
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  settings?: WorkspaceSettings;
}

export interface WorkspaceSettings {
  allowPublicTemplates?: boolean;
  enforceBrandStyles?: boolean;
  defaultPageFormat?: 'A4' | 'Letter';
  retentionDays?: number;
  metadata?: Record<string, unknown>;
}
