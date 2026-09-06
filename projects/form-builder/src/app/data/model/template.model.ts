export * from '../../core/domain/template.model';
import { TemplateStatus as CoreTemplateStatus } from '../../core/domain/template.model';

export type TemplateStatus = CoreTemplateStatus;

/**
 * A portable, domain-neutral document definition, fully compatible with existing UI
 * and aligning with the Core Domain Model.
 */
export interface TemplateDefinition {
  id: string;
  name: string;
  description?: string;
  category: string;
  industry?: string;
  language?: string;
  country?: string;
  status: TemplateStatus;
  version: number;
  design?: unknown;
  html: string;
  css: string;
  dataSchema?: Record<string, unknown>;
  sampleData?: Record<string, unknown>;
  ownerId?: string;
  workspaceId?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  metadata?: Record<string, unknown>;
}
