/**
 * Core Domain Model: Template Intermediate Representation (IR)
 * Standardized, safe intermediate representation for AI-generated templates.
 * Enforces structured schema generation rather than arbitrary frontend code.
 */

export type TemplateIRFieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'signature'
  | 'token';

export interface TemplateFieldIR {
  id: string;
  label: string;
  type: TemplateIRFieldType;
  token?: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  defaultValue?: string;
  width?: 'full' | 'half' | 'third';
}

export type TemplateIRSectionLayout =
  | 'single'
  | 'two-column'
  | 'three-column'
  | 'grid'
  | 'table'
  | 'alert';

export interface TemplateTableColumnIR {
  key: string;
  label: string;
  width?: string;
}

export interface TemplateSectionIR {
  id: string;
  title: string;
  description?: string;
  layout: TemplateIRSectionLayout;
  alertType?: 'warning' | 'info' | 'critical';
  tableColumns?: TemplateTableColumnIR[];
  tableRows?: Record<string, string>[];
  fields: TemplateFieldIR[];
}

export interface TemplateBrandingIR {
  organizationName: string;
  subtitle?: string;
  primaryColor: string;
  fontFamily?: string;
  logoUrl?: string;
}

export interface TemplateIR {
  id: string;
  title: string;
  templateType: 'form' | 'document' | 'report';
  industry: string;
  category: string;
  language: 'English' | 'German' | string;
  country?: string;
  branding?: TemplateBrandingIR;
  sections: TemplateSectionIR[];
  footerText?: string;
  metadata?: Record<string, unknown>;
}
