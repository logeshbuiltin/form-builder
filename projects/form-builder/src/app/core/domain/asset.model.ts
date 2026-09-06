/**
 * Core Domain Model: Asset
 * Manages images, logos, signatures, and document attachments.
 */

export type AssetType = 'image' | 'logo' | 'signature' | 'pdf' | 'font' | 'css' | 'document' | 'other';

export interface Asset {
  id: string;
  organizationId: string;
  workspaceId?: string;
  name: string;
  type: AssetType;
  mimeType: string;
  sizeBytes: number;
  url: string;
  tags?: string[];
  uploadedBy: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}
