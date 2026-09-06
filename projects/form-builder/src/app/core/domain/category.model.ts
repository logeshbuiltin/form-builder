/**
 * Core Domain Model: Template & Document Categories
 * Configurable, industry-independent category taxonomy system.
 */

export interface DocumentTypeDefinition {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  industry?: string;
  tags: string[];
  isBuiltIn?: boolean;
  defaultSchema?: Record<string, unknown>;
}

export interface CategoryDefinition {
  id: string;
  name: string;
  description?: string;
  industry: string;       // e.g. 'healthcare', 'dental', 'physiotherapy', 'general'
  icon: string;           // e.g. 'fa fa-user-plus', 'fa fa-stethoscope'
  badgeColor?: string;    // e.g. '#2563eb'
  isBuiltIn: boolean;
  sortOrder: number;
  documentTypes: DocumentTypeDefinition[];
}

export interface CategoryFilterOptions {
  industry?: string;
  searchQuery?: string;
}
