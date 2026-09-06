import { Injectable, Optional } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Brand, BrandColors, BrandPreset, BrandTypography } from '../domain/brand.model';
import { RbacService } from './rbac.service';
import { TenantWorkspaceService } from './tenant-workspace.service';
import { AuditLogService } from './audit-log.service';

const BRANDS_STORAGE_KEY = 'form_builder_brands_v1';
const ACTIVE_BRAND_ID_KEY = 'form_builder_active_brand_id_v1';

@Injectable({
  providedIn: 'root',
})
export class BrandService {
  private brands: Brand[] = [];
  private activeBrandSubject: BehaviorSubject<Brand>;
  public activeBrand$: Observable<Brand>;

  public readonly presets: BrandPreset[] = [
    {
      key: 'clinical_blue',
      name: 'St. Mary Clinical Blue',
      description: 'Trustworthy, crisp healthcare blue with high legibility and calm slate accents.',
      colors: {
        primary: '#0284c7',
        secondary: '#0369a1',
        background: '#ffffff',
        text: '#0f172a',
        accent: '#38bdf8',
        border: '#e2e8f0',
      },
      typography: {
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        headingFontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        fontSizeBase: '14px',
        lineHeight: '1.5',
      },
    },
    {
      key: 'nordic_emerald',
      name: 'Nordic Health Emerald',
      description: 'Healing, botanical green palette tailored for rehabilitation, wellness and therapy.',
      colors: {
        primary: '#059669',
        secondary: '#047857',
        background: '#ffffff',
        text: '#134e4a',
        accent: '#34d399',
        border: '#ccfbf1',
      },
      typography: {
        fontFamily: "'Roboto', sans-serif",
        headingFontFamily: "'Roboto', sans-serif",
        fontSizeBase: '14px',
        lineHeight: '1.6',
      },
    },
    {
      key: 'slate_minimal',
      name: 'CityCare Slate Minimal',
      description: 'Understated, modern hospital monochrome designed for clear formal documentation.',
      colors: {
        primary: '#334155',
        secondary: '#1e293b',
        background: '#ffffff',
        text: '#0f172a',
        accent: '#64748b',
        border: '#cbd5e1',
      },
      typography: {
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        headingFontFamily: "'Helvetica Neue', Arial, sans-serif",
        fontSizeBase: '13px',
        lineHeight: '1.5',
      },
    },
    {
      key: 'horizon_violet',
      name: 'Horizon Care Purple',
      description: 'Forward-looking digital health theme featuring vibrant violet & indigo tones.',
      colors: {
        primary: '#7c3aed',
        secondary: '#6d28d9',
        background: '#ffffff',
        text: '#1e1b4b',
        accent: '#a78bfa',
        border: '#ede9fe',
      },
      typography: {
        fontFamily: "'Outfit', 'Inter', sans-serif",
        headingFontFamily: "'Outfit', 'Inter', sans-serif",
        fontSizeBase: '14px',
        lineHeight: '1.5',
      },
    },
  ];

  constructor(
    private tenantWorkspaceService: TenantWorkspaceService,
    private rbacService: RbacService,
    @Optional() private auditLogService?: AuditLogService
  ) {
    this.initBrands();
    const active = this.determineInitialActiveBrand();
    this.activeBrandSubject = new BehaviorSubject<Brand>(active);
    this.activeBrand$ = this.activeBrandSubject.asObservable();
  }

  // =========================================================================
  // Brand Queries
  // =========================================================================

  getBrands(): Brand[] {
    return [...this.brands];
  }

  getBrandsByOrganization(orgId: string): Brand[] {
    return this.brands.filter((b) => b.organizationId === orgId);
  }

  getBrandById(id: string): Brand | undefined {
    return this.brands.find((b) => b.id === id);
  }

  getActiveBrand(): Brand {
    return this.activeBrandSubject.value;
  }

  getOrganizationDefaultBrand(orgId: string): Brand | undefined {
    return (
      this.brands.find((b) => b.organizationId === orgId && b.isDefault) ||
      this.brands.find((b) => b.organizationId === orgId) ||
      this.brands[0]
    );
  }

  // =========================================================================
  // Brand Mutators
  // =========================================================================

  setActiveBrand(id: string): boolean {
    const brand = this.getBrandById(id);
    if (!brand) {
      return false;
    }
    this.activeBrandSubject.next(brand);
    this.saveActiveBrandId(id);
    return true;
  }

  createBrand(brandData: Partial<Brand>): Brand {
    if (!this.rbacService.hasPermission('brand:manage')) {
      throw new Error('Access Denied: Missing permission brand:manage');
    }

    const activeOrg = this.tenantWorkspaceService.getActiveOrganization();
    const activeWs = this.tenantWorkspaceService.getActiveWorkspace();
    const orgId = brandData.organizationId || activeOrg?.id || 'org_general_health';

    // If marked as default, unset other defaults in the same organization
    if (brandData.isDefault) {
      this.brands.forEach((b) => {
        if (b.organizationId === orgId) {
          b.isDefault = false;
        }
      });
    }

    const id = brandData.id || `brand_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newBrand: Brand = {
      id,
      organizationId: orgId,
      workspaceId: brandData.workspaceId || activeWs?.id,
      name: brandData.name || 'New Brand Profile',
      tagline: brandData.tagline || 'Excellence in Patient Care',
      isDefault: brandData.isDefault || false,
      logoUrl: brandData.logoUrl || '',
      faviconUrl: brandData.faviconUrl || '',
      colors: {
        primary: brandData.colors?.primary || '#0284c7',
        secondary: brandData.colors?.secondary || '#0369a1',
        background: brandData.colors?.background || '#ffffff',
        text: brandData.colors?.text || '#0f172a',
        accent: brandData.colors?.accent || '#38bdf8',
        border: brandData.colors?.border || '#e2e8f0',
      },
      typography: {
        fontFamily: brandData.typography?.fontFamily || "'Inter', sans-serif",
        headingFontFamily: brandData.typography?.headingFontFamily || "'Inter', sans-serif",
        fontSizeBase: brandData.typography?.fontSizeBase || '14px',
        lineHeight: brandData.typography?.lineHeight || '1.5',
      },
      headerStyle: brandData.headerStyle || 'modern',
      headerHtml: brandData.headerHtml,
      footerStyle: brandData.footerStyle || 'standard',
      footerHtml: brandData.footerHtml,
      address: {
        street: brandData.address?.street || '',
        city: brandData.address?.city || '',
        state: brandData.address?.state || '',
        postalCode: brandData.address?.postalCode || '',
        country: brandData.address?.country || 'USA',
      },
      contactInfo: {
        phone: brandData.contactInfo?.phone || '',
        email: brandData.contactInfo?.email || '',
        website: brandData.contactInfo?.website || '',
      },
      legalInfo: {
        taxId: brandData.legalInfo?.taxId || '',
        registrationNumber: brandData.legalInfo?.registrationNumber || '',
        disclaimer: brandData.legalInfo?.disclaimer || 'Confidential medical documentation.',
      },
      signatoryName: brandData.signatoryName || '',
      signatoryTitle: brandData.signatoryTitle || '',
      signatureUrl: brandData.signatureUrl || '',
      createdAt: now,
      updatedAt: now,
    };

    this.brands.push(newBrand);
    this.saveBrandsToStorage();

    try {
      this.auditLogService?.recordEvent('brand.created', 'brand', newBrand.id, {
        brandName: newBrand.name,
        organizationId: newBrand.organizationId,
        isDefault: newBrand.isDefault,
      });
    } catch {
      // Safe fallback
    }

    return newBrand;
  }

  updateBrand(id: string, updates: Partial<Brand>): Brand | undefined {
    if (!this.rbacService.hasPermission('brand:manage')) {
      throw new Error('Access Denied: Missing permission brand:manage');
    }

    const index = this.brands.findIndex((b) => b.id === id);
    if (index === -1) {
      return undefined;
    }

    const existing = this.brands[index];

    // If setting default, unset others in the same org
    if (updates.isDefault) {
      this.brands.forEach((b) => {
        if (b.organizationId === existing.organizationId && b.id !== id) {
          b.isDefault = false;
        }
      });
    }

    const updated: Brand = {
      ...existing,
      ...updates,
      colors: { ...existing.colors, ...(updates.colors || {}) },
      typography: { ...existing.typography, ...(updates.typography || {}) },
      address: { ...existing.address, ...(updates.address || {}) },
      contactInfo: { ...existing.contactInfo, ...(updates.contactInfo || {}) },
      legalInfo: { ...existing.legalInfo, ...(updates.legalInfo || {}) },
      updatedAt: new Date().toISOString(),
    };

    this.brands[index] = updated;
    this.saveBrandsToStorage();

    if (this.activeBrandSubject.value.id === id) {
      this.activeBrandSubject.next(updated);
    }

    try {
      this.auditLogService?.recordEvent('brand.updated', 'brand', id, {
        brandName: updated.name,
      });
    } catch {
      // Safe fallback
    }

    return updated;
  }

  deleteBrand(id: string): boolean {
    if (!this.rbacService.hasPermission('brand:manage')) {
      throw new Error('Access Denied: Missing permission brand:manage');
    }

    const index = this.brands.findIndex((b) => b.id === id);
    if (index === -1) {
      return false;
    }

    // Do not delete if it is the only brand
    if (this.brands.length <= 1) {
      return false;
    }

    const deletedBrand = this.brands[index];
    this.brands.splice(index, 1);
    this.saveBrandsToStorage();

    if (this.activeBrandSubject.value.id === id) {
      this.activeBrandSubject.next(this.brands[0]);
      this.saveActiveBrandId(this.brands[0].id);
    }

    try {
      this.auditLogService?.recordEvent('brand.deleted', 'brand', id, {
        brandName: deletedBrand.name,
      });
    } catch {
      // Safe fallback
    }

    return true;
  }

  setOrganizationDefaultBrand(orgId: string, brandId: string): boolean {
    if (!this.rbacService.hasPermission('brand:manage')) {
      throw new Error('Access Denied: Missing permission brand:manage');
    }

    const target = this.getBrandById(brandId);
    if (!target || target.organizationId !== orgId) {
      return false;
    }

    this.brands.forEach((b) => {
      if (b.organizationId === orgId) {
        b.isDefault = b.id === brandId;
      }
    });

    this.saveBrandsToStorage();
    return true;
  }

  // =========================================================================
  // CSS Generation & Letterhead Markup
  // =========================================================================

  generateBrandCss(brand: Brand): string {
    const c = brand.colors;
    const t = brand.typography;
    return `
:root {
  --brand-primary: ${c.primary};
  --brand-secondary: ${c.secondary};
  --brand-background: ${c.background};
  --brand-text: ${c.text};
  --brand-accent: ${c.accent || c.primary};
  --brand-border: ${c.border || '#e2e8f0'};
  --brand-font: ${t.fontFamily};
  --brand-heading-font: ${t.headingFontFamily || t.fontFamily};
  --brand-font-size: ${t.fontSizeBase || '14px'};
}

body {
  font-family: var(--brand-font) !important;
  font-size: var(--brand-font-size) !important;
  color: var(--brand-text) !important;
  background-color: var(--brand-background) !important;
  line-height: ${t.lineHeight || '1.5'};
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--brand-heading-font) !important;
  color: var(--brand-secondary) !important;
}

.doc-header {
  border-bottom: 2px solid var(--brand-primary) !important;
}

.doc-accent {
  color: var(--brand-primary) !important;
}

.doc-badge-primary {
  background-color: var(--brand-primary) !important;
  color: #ffffff !important;
}

.doc-footer {
  border-top: 1px solid var(--brand-border) !important;
  color: #64748b !important;
}
`;
  }

  generateHeaderHtml(brand: Brand, layoutMode: 'modern' | 'classic' | 'minimal' = 'modern'): string {
    const c = brand.colors;
    const addr = brand.address ? `${brand.address.street}, ${brand.address.city}, ${brand.address.state} ${brand.address.postalCode}`.replace(/^, |, $/g, '') : '';
    const phone = brand.contactInfo?.phone ? ` · Tel: ${brand.contactInfo.phone}` : '';
    const email = brand.contactInfo?.email ? ` · ${brand.contactInfo.email}` : '';

    if (layoutMode === 'minimal') {
      return `<header class="doc-header" style="display:flex; justify-content:space-between; align-items:center; padding-bottom:12px; margin-bottom:20px; border-bottom:1px solid ${c.primary}; font-family:${brand.typography.fontFamily};">
  <div>
    <h2 style="margin:0; font-size:16px; font-weight:700; color:${c.secondary};">${brand.name}</h2>
    <p style="margin:2px 0 0 0; font-size:11px; color:#64748b;">${brand.tagline || ''}</p>
  </div>
  <div style="text-align:right; font-size:11px; color:#64748b;">
    <span>{{document.title}}</span> · <span>{{document.date}}</span>
  </div>
</header>`;
    }

    if (layoutMode === 'classic') {
      return `<header class="doc-header" style="text-align:center; padding-bottom:16px; margin-bottom:24px; border-bottom:2px double ${c.primary}; font-family:${brand.typography.fontFamily};">
  <div style="margin-bottom:8px;">
    ${brand.logoUrl ? `<img src="${brand.logoUrl}" alt="${brand.name}" style="max-height:45px;" />` : `<div style="display:inline-block; width:36px; height:36px; border-radius:50%; background:${c.primary}; color:#fff; font-size:20px; font-weight:bold; line-height:36px; text-align:center;">+</div>`}
  </div>
  <h1 style="margin:0; font-size:20px; font-weight:800; color:${c.secondary}; letter-spacing:-0.02em;">${brand.name}</h1>
  ${brand.tagline ? `<p style="margin:2px 0 4px; font-size:12px; color:#64748b; font-style:italic;">${brand.tagline}</p>` : ''}
  <p style="margin:0; font-size:11px; color:#475569;">${addr}${phone}${email}</p>
</header>`;
    }

    // Default 'modern' bar
    return `<header class="doc-header" style="display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:16px; margin-bottom:24px; border-bottom:2px solid ${c.primary}; font-family:${brand.typography.fontFamily};">
  <div style="display:flex; align-items:center; gap:14px;">
    ${brand.logoUrl ? `<img src="${brand.logoUrl}" alt="${brand.name}" style="max-height:48px; border-radius:6px;" />` : `
    <div style="width:44px; height:44px; border-radius:8px; background:linear-gradient(135deg, ${c.primary} 0%, ${c.secondary} 100%); display:flex; align-items:center; justify-content:center; color:#ffffff; font-size:20px; font-weight:bold;">
      +
    </div>`}
    <div>
      <h2 style="margin:0; font-size:17px; font-weight:800; color:${c.secondary};">${brand.name}</h2>
      <p style="margin:2px 0 0 0; font-size:11px; color:#64748b;">${addr}${phone}</p>
    </div>
  </div>
  <div style="text-align:right;">
    <span style="display:inline-block; padding:4px 10px; background:${c.border || '#f1f5f9'}; color:${c.primary}; font-size:11px; font-weight:700; border-radius:5px; text-transform:uppercase; letter-spacing:0.04em;">{{document.title}}</span>
    <p style="margin:4px 0 0 0; font-size:11px; color:#94a3b8;">{{document.date}}</p>
  </div>
</header>`;
  }

  generateFooterHtml(brand: Brand, layoutMode: 'standard' | 'minimal' | 'legal' = 'standard'): string {
    const c = brand.colors;
    const disclaimer = brand.legalInfo?.disclaimer || 'Confidential medical documentation. Unauthorized distribution strictly prohibited.';
    const taxId = brand.legalInfo?.taxId ? `Tax ID: ${brand.legalInfo.taxId}` : '';
    const regNo = brand.legalInfo?.registrationNumber ? `Reg: ${brand.legalInfo.registrationNumber}` : '';
    const legalDetails = [taxId, regNo].filter(Boolean).join(' · ');

    if (layoutMode === 'minimal') {
      return `<footer class="doc-footer" style="padding-top:12px; margin-top:32px; border-top:1px solid ${c.border || '#e2e8f0'}; display:flex; justify-content:space-between; font-size:10px; color:#94a3b8; font-family:${brand.typography.fontFamily};">
  <span>${brand.name}</span>
  <span>Page 1 of 1</span>
</footer>`;
    }

    if (layoutMode === 'legal') {
      return `<footer class="doc-footer" style="padding-top:14px; margin-top:32px; border-top:1px solid ${c.primary}; font-size:10px; color:#64748b; font-family:${brand.typography.fontFamily};">
  <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
    <strong style="color:${c.secondary};">${brand.name}</strong>
    <span>${legalDetails}</span>
  </div>
  <p style="margin:0; line-height:1.4; color:#94a3b8;">${disclaimer}</p>
  <div style="margin-top:6px; display:flex; justify-content:space-between; font-size:9px; color:#cbd5e1;">
    <span>Electronic Verification Sealed</span>
    <span>Page 1 of 1</span>
  </div>
</footer>`;
    }

    // Default 'standard'
    return `<footer class="doc-footer" style="padding-top:14px; margin-top:36px; border-top:1px solid ${c.border || '#e2e8f0'}; display:flex; justify-content:space-between; align-items:flex-end; font-size:11px; color:#64748b; font-family:${brand.typography.fontFamily};">
  <div style="max-width:70%;">
    <p style="margin:0; font-weight:600; color:${c.secondary};">${brand.name} · ${brand.contactInfo?.website || ''}</p>
    <p style="margin:2px 0 0 0; font-size:10px; color:#94a3b8;">${disclaimer}</p>
  </div>
  <div style="text-align:right;">
    ${brand.signatoryName ? `<p style="margin:0; font-size:10px; font-weight:600;">Authorized: ${brand.signatoryName} (${brand.signatoryTitle || 'Director'})</p>` : ''}
    <p style="margin:2px 0 0 0; font-size:10px; color:#94a3b8;">Page 1 of 1</p>
  </div>
</footer>`;
  }

  // =========================================================================
  // Brand Token Interpolation
  // =========================================================================

  interpolateBrandTokens(content: string, overrideBrand?: Brand): string {
    if (!content) return '';
    const brand = overrideBrand || this.getActiveBrand();
    if (!brand) return content;

    const fullAddress = [
      brand.address?.street,
      brand.address?.city,
      brand.address?.state,
      brand.address?.postalCode,
      brand.address?.country,
    ].filter(Boolean).join(', ');

    const tokenMap: Record<string, string> = {
      'brand.name': brand.name || '',
      'brand.clinicName': brand.name || '',
      'brand.tagline': brand.tagline || '',
      'brand.logo': brand.logoUrl || '',
      'brand.primaryColor': brand.colors.primary,
      'brand.secondaryColor': brand.colors.secondary,
      'brand.textColor': brand.colors.text,
      'brand.bgColor': brand.colors.background,
      'brand.fontFamily': brand.typography.fontFamily,
      'brand.phone': brand.contactInfo?.phone || '',
      'brand.email': brand.contactInfo?.email || '',
      'brand.website': brand.contactInfo?.website || '',
      'brand.address': fullAddress,
      'brand.street': brand.address?.street || '',
      'brand.city': brand.address?.city || '',
      'brand.state': brand.address?.state || '',
      'brand.postalCode': brand.address?.postalCode || '',
      'brand.country': brand.address?.country || '',
      'brand.taxId': brand.legalInfo?.taxId || '',
      'brand.registrationNumber': brand.legalInfo?.registrationNumber || '',
      'brand.disclaimer': brand.legalInfo?.disclaimer || '',
      'brand.signatoryName': brand.signatoryName || '',
      'brand.signatoryTitle': brand.signatoryTitle || '',
      'brand.header': this.generateHeaderHtml(brand, (brand.headerStyle as any) || 'modern'),
      'brand.footer': this.generateFooterHtml(brand, (brand.footerStyle as any) || 'standard'),
    };

    return content.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (match, key) => {
      if (tokenMap[key] !== undefined) {
        return tokenMap[key];
      }
      return match;
    });
  }

  // =========================================================================
  // Private Storage & Initialization Helpers
  // =========================================================================

  private initBrands(): void {
    const loaded = this.loadBrandsFromStorage();
    if (loaded && loaded.length > 0) {
      this.brands = loaded;
    } else {
      this.brands = this.getSeedBrands();
      this.saveBrandsToStorage();
    }
  }

  private determineInitialActiveBrand(): Brand {
    const activeId = this.loadActiveBrandId();
    if (activeId) {
      const found = this.getBrandById(activeId);
      if (found) return found;
    }
    const activeOrg = this.tenantWorkspaceService.getActiveOrganization();
    if (activeOrg) {
      const orgDefault = this.getOrganizationDefaultBrand(activeOrg.id);
      if (orgDefault) return orgDefault;
    }
    return this.brands[0];
  }

  private getSeedBrands(): Brand[] {
    const now = new Date().toISOString();
    return [
      {
        id: 'brand_st_jude_default',
        organizationId: 'org_general_health',
        name: 'St. Jude Health System',
        tagline: 'Compassionate Care, Advanced Medical Science',
        isDefault: true,
        logoUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=120&auto=format&fit=crop&q=60',
        colors: {
          primary: '#0284c7',
          secondary: '#0369a1',
          background: '#ffffff',
          text: '#0f172a',
          accent: '#38bdf8',
          border: '#e2e8f0',
        },
        typography: {
          fontFamily: "'Inter', sans-serif",
          headingFontFamily: "'Inter', sans-serif",
          fontSizeBase: '14px',
          lineHeight: '1.5',
        },
        headerStyle: 'modern',
        footerStyle: 'standard',
        address: {
          street: '100 Medical Center Blvd',
          city: 'Boston',
          state: 'MA',
          postalCode: '02115',
          country: 'USA',
        },
        contactInfo: {
          phone: '+1 (617) 555-0144',
          email: 'records@stjudehealth.org',
          website: 'https://www.stjudehealth.org',
        },
        legalInfo: {
          taxId: 'US-EIN-9482710',
          registrationNumber: 'MA-MED-84920',
          disclaimer: 'Confidential medical record. Protected under HIPAA and applicable health information confidentiality laws.',
        },
        signatoryName: 'Dr. Sarah Jenkins, MD',
        signatoryTitle: 'Chief Medical Officer',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'brand_st_jude_rehab',
        organizationId: 'org_general_health',
        name: 'St. Jude Physical Therapy & Rehab',
        tagline: 'Restoring Mobility and Quality of Life',
        isDefault: false,
        colors: {
          primary: '#059669',
          secondary: '#047857',
          background: '#ffffff',
          text: '#134e4a',
          accent: '#34d399',
          border: '#ccfbf1',
        },
        typography: {
          fontFamily: "'Roboto', sans-serif",
          headingFontFamily: "'Roboto', sans-serif",
          fontSizeBase: '14px',
          lineHeight: '1.6',
        },
        headerStyle: 'modern',
        footerStyle: 'standard',
        address: {
          street: '140 Rehabilitation Way, Suite 200',
          city: 'Boston',
          state: 'MA',
          postalCode: '02118',
          country: 'USA',
        },
        contactInfo: {
          phone: '+1 (617) 555-0188',
          email: 'physio@stjudehealth.org',
          website: 'https://pt.stjudehealth.org',
        },
        legalInfo: {
          taxId: 'US-EIN-9482710',
          registrationNumber: 'MA-PT-39102',
          disclaimer: 'Medical Rehabilitation Assessment. For physician and authorized therapist use.',
        },
        signatoryName: 'Markus Vance, DPT',
        signatoryTitle: 'Lead Clinical Physiotherapist',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'brand_charite_default',
        organizationId: 'org_charite_berlin',
        name: 'Charité Universitätsmedizin Berlin',
        tagline: 'Forschung, Lehre, Heilen, Helfen',
        isDefault: true,
        colors: {
          primary: '#004b87',
          secondary: '#002855',
          background: '#ffffff',
          text: '#1e293b',
          accent: '#0072ce',
          border: '#e2e8f0',
        },
        typography: {
          fontFamily: "'Inter', sans-serif",
          headingFontFamily: "'Inter', sans-serif",
          fontSizeBase: '13px',
          lineHeight: '1.5',
        },
        headerStyle: 'classic',
        footerStyle: 'legal',
        address: {
          street: 'Charitéplatz 1',
          city: 'Berlin',
          state: 'Berlin',
          postalCode: '10117',
          country: 'Germany',
        },
        contactInfo: {
          phone: '+49 30 450-50',
          email: 'patientenservice@charite.de',
          website: 'https://www.charite.de',
        },
        legalInfo: {
          taxId: 'DE 228847620',
          registrationNumber: 'HRB 102948 B',
          disclaimer: 'Ärztliches Dokument unterliegt der ärztlichen Schweigepflicht gem. § 203 StGB und der DSGVO.',
        },
        signatoryName: 'Prof. Dr. med. Christian Drosten',
        signatoryTitle: 'Institutsleiter & Facharzt',
        createdAt: now,
        updatedAt: now,
      },
    ];
  }

  private loadBrandsFromStorage(): Brand[] | null {
    try {
      const raw = localStorage.getItem(BRANDS_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('BrandService: failed to read brands from storage', e);
    }
    return null;
  }

  private saveBrandsToStorage(): void {
    try {
      localStorage.setItem(BRANDS_STORAGE_KEY, JSON.stringify(this.brands));
    } catch (e) {
      console.warn('BrandService: failed to save brands to storage', e);
    }
  }

  private loadActiveBrandId(): string | null {
    try {
      return localStorage.getItem(ACTIVE_BRAND_ID_KEY);
    } catch {
      return null;
    }
  }

  private saveActiveBrandId(id: string): void {
    try {
      localStorage.setItem(ACTIVE_BRAND_ID_KEY, id);
    } catch {
      // ignore
    }
  }
}
