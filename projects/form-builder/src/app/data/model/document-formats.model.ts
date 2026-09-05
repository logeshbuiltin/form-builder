export type DocumentCategoryId =
  | 'all'
  | 'finance'
  | 'corporate'
  | 'medical'
  | 'operations'
  | 'hospitality'
  | 'proposals';

export interface DocumentCategory {
  id: DocumentCategoryId;
  label: string;
  icon: string;
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
  category: DocumentCategoryId;
  categoryLabel: string;
  description: string;
  features: string[];
  defaultHtml: string;
  defaultCss?: string;
  tokens: DocumentFieldToken[];
  previewSvg: string;
  blocks?: DocumentBlockDef[];
}
