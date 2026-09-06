/**
 * Core Domain Model: Template & TemplateVersion
 * Generic, versioned template definition decoupled from industry-specific constraints.
 */

import { DataSchema } from './schema.model';

export type TemplateStatus = 'draft' | 'review' | 'published' | 'archived';

export interface TemplateVersion {
  id: string;
  templateId: string;
  versionNumber: number;
  status: TemplateStatus;
  html: string;
  css: string;
  schemaId?: string;
  schema?: DataSchema;
  sampleData?: Record<string, unknown>;
  brandOverrideId?: string;
  changeLog?: string;
  createdBy: string;
  createdAt: string;
  publishedAt?: string;
}

export interface Template {
  id: string;                         // Template ID
  name: string;                       // Name
  description?: string;               // Description
  category: string;                   // Category (e.g. 'Patient Forms', 'Clinical Documents', 'Invoices')
  industry: string;                   // Industry (e.g. 'healthcare', 'dental', 'legal', 'finance')
  language: string;                   // Language (e.g. 'en', 'de')
  country?: string;                   // Country (e.g. 'US', 'DE', 'MY')
  version: number;                    // Latest version number
  status: TemplateStatus;             // Status ('draft' | 'review' | 'published' | 'archived')
  ownerId: string;                    // Owner
  workspaceId: string;                // Workspace
  createdAt: string;                  // Created date
  updatedAt: string;                  // Updated date
  publishedAt?: string;               // Published date
  tags: string[];                     // Tags

  // Version management & active content pointers
  currentVersionId?: string;
  versions?: TemplateVersion[];

  // Extensibility metadata (e.g. specialty, clinic department, billing code)
  metadata?: Record<string, unknown>;
}

export interface TemplateFilter {
  workspaceId?: string;
  category?: string;
  industry?: string;
  language?: string;
  country?: string;
  status?: TemplateStatus;
  tags?: string[];
  searchQuery?: string;
}
