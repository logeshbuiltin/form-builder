/**
 * Core Domain Model: Document & RenderedDocument
 * Generated documents bound to structured payload and specific template version.
 * Standardized document instance layer for healthcare and general document generation.
 */

export type DocumentStatus =
  | 'draft'
  | 'rendering'
  | 'rendered'
  | 'reviewed'
  | 'signed'
  | 'completed'
  | 'failed'
  | 'archived';

export interface DocumentAuditItem {
  id: string;
  timestamp: string;
  action: 'created' | 'updated' | 'rendered' | 'reviewed' | 'signed' | 'exported' | 'archived';
  actor: string;
  note?: string;
}

export interface Document {
  id: string;
  workspaceId: string;
  templateId: string;
  templateVersionId?: string;
  templateVersionNumber?: number;
  templateName?: string;
  category?: string;
  documentType?: string;
  title: string;
  status: DocumentStatus;
  payload: Record<string, unknown>; // Bound structured data
  renderedHtml?: string;
  rawTemplateHtml?: string;
  pdfAssetId?: string;
  pdfUrl?: string;
  brandId?: string;
  patientName?: string;
  patientMrn?: string;
  metadata?: Record<string, unknown>; // e.g. patientId, encounterId, externalRef
  auditTrail: DocumentAuditItem[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  signedAt?: string;
  signedBy?: string;
}

export interface DocumentRenderRequest {
  templateId: string;
  templateVersionId?: string;
  data: Record<string, unknown>;
  brandId?: string;
  format?: 'html' | 'pdf';
  options?: {
    pageSize?: 'A4' | 'Letter';
    orientation?: 'portrait' | 'landscape';
    includePageNumbers?: boolean;
    headerFooter?: boolean;
  };
}

export interface DocumentGenerationOptions {
  workspaceId?: string;
  actor?: string;
  locale?: string;
  currency?: string;
  dateFormat?: string;
  initialStatus?: DocumentStatus;
  brandId?: string;
}

export interface BatchDocumentGenerationRequest {
  templateId: string;
  templateName: string;
  templateHtml: string;
  records: Array<Record<string, unknown>>;
  titlePattern?: string; // e.g. "Assessment - {{patient.name}}"
  category?: string;
  documentType?: string;
}

export interface BatchDocumentGenerationResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  documents: Document[];
  errors: string[];
}
