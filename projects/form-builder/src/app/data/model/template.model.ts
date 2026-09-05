export type TemplateStatus = 'draft' | 'published';

/** A portable, domain-neutral document definition. */
export interface TemplateDefinition {
  id: string;
  name: string;
  category: string;
  status: TemplateStatus;
  version: number;
  design: unknown;
  html: string;
  css: string;
  dataSchema: Record<string, unknown>;
  sampleData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
