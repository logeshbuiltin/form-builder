/**
 * Core Domain Model: AIRequest
 * Tracks natural language template search and structured template generation.
 * Enforces privacy: never carries patient identifiable health information.
 */

export type AIRequestType = 'search' | 'generation' | 'assistant_edit' | 'translation';
export type AIRequestStatus = 'pending' | 'completed' | 'failed';

export interface AIExtractedAttributes {
  industry?: string;
  documentType?: string;
  language?: string;
  country?: string;
  audience?: string;
  keywords?: string[];
  [key: string]: unknown;
}

export interface AIRequest {
  id: string;
  workspaceId: string;
  userId: string;
  type: AIRequestType;
  inputPrompt: string;
  extractedAttributes?: AIExtractedAttributes;
  responseStructured?: Record<string, unknown>; // Clean IR specification, not arbitrary frontend code
  status: AIRequestStatus;
  tokensUsed?: number;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

export interface AISearchMatchAttributes {
  industry?: string;
  documentType?: string;
  country?: string;
  language?: string;
  audience?: string;
  keywords?: string[];
}

export interface AISearchResult {
  template: any; // DocumentFormat
  score: number; // 0 to 100
  matchReason: string;
  matchedAttributes: AISearchMatchAttributes;
}

export interface AISearchResponse {
  query: string;
  extractedAttributes: AIExtractedAttributes;
  results: AISearchResult[];
  searchMode: 'deterministic_metadata' | 'semantic_interpretation';
  totalFound: number;
}

