/**
 * Core Domain Model: Brand
 * Manages organization & workspace visual identity for document styling.
 */

export interface BrandColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent?: string;
  border?: string;
  [key: string]: string | undefined;
}

export interface BrandTypography {
  fontFamily: string;
  headingFontFamily?: string;
  fontSizeBase?: string;
  lineHeight?: string;
}

export interface BrandAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface BrandContactInfo {
  phone?: string;
  email?: string;
  website?: string;
}

export interface BrandLegalInfo {
  taxId?: string;
  registrationNumber?: string;
  disclaimer?: string;
}

export interface Brand {
  id: string;
  organizationId: string;
  workspaceId?: string;
  name: string;
  tagline?: string;
  isDefault: boolean;
  logoUrl?: string;
  faviconUrl?: string;
  colors: BrandColors;
  typography: BrandTypography;
  headerStyle?: 'modern' | 'classic' | 'minimal' | 'custom';
  headerHtml?: string;
  footerStyle?: 'standard' | 'minimal' | 'legal' | 'custom';
  footerHtml?: string;
  address?: BrandAddress;
  contactInfo?: BrandContactInfo;
  legalInfo?: BrandLegalInfo;
  signatoryName?: string;
  signatoryTitle?: string;
  signatureUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BrandPreset {
  key: string;
  name: string;
  description: string;
  colors: BrandColors;
  typography: BrandTypography;
}

