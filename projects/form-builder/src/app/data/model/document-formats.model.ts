export type DocumentCategoryId = string;

export interface DocumentCategory {
  id: string;
  label: string;
  icon: string;
  industry?: string;
  badgeColor?: string;
}

export interface DocumentFieldToken {
  key: string;
  label: string;
  example: string;
}

export interface DocumentBlockDef {
  id: string;
  label: string;
  category: string;
  icon: string;
  content: string;
  media?: string;
}

export interface DocumentFormat {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  emoji: string;
  category: string;
  categoryLabel: string;
  documentTypeId?: string;
  industry?: string;
  description: string;
  features: string[];
  defaultHtml: string;
  defaultCss?: string;
  tokens: DocumentFieldToken[];
  previewSvg: string;
  blocks?: DocumentBlockDef[];
}
