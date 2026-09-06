import { TestBed } from '@angular/core/testing';
import { BrandService } from './brand.service';
import { RbacService } from './rbac.service';
import { TenantWorkspaceService } from './tenant-workspace.service';

describe('BrandService (Phase 12: Brand Management)', () => {
  let service: BrandService;
  let rbacService: RbacService;
  let tenantWorkspaceService: TenantWorkspaceService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [BrandService, RbacService, TenantWorkspaceService],
    });
    service = TestBed.inject(BrandService);
    rbacService = TestBed.inject(RbacService);
    tenantWorkspaceService = TestBed.inject(TenantWorkspaceService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created and initialize with seed brands', () => {
    expect(service).toBeTruthy();
    const brands = service.getBrands();
    expect(brands.length).toBeGreaterThanOrEqual(3);
    expect(service.getActiveBrand()).toBeDefined();
    expect(service.getActiveBrand().name).toBe('St. Jude Health System');
  });

  it('should provide predefined brand presets', () => {
    expect(service.presets.length).toBeGreaterThanOrEqual(4);
    const clinicalBlue = service.presets.find((p) => p.key === 'clinical_blue');
    expect(clinicalBlue).toBeDefined();
    expect(clinicalBlue?.colors.primary).toBe('#0284c7');
  });

  it('should filter brands by organization ID', () => {
    const stJudeBrands = service.getBrandsByOrganization('org_general_health');
    expect(stJudeBrands.length).toBeGreaterThanOrEqual(2);
    expect(stJudeBrands.every((b) => b.organizationId === 'org_general_health')).toBeTrue();

    const chariteBrands = service.getBrandsByOrganization('org_charite_berlin');
    expect(chariteBrands.length).toBe(1);
    expect(chariteBrands[0].name).toContain('Charité');
  });

  it('should switch active brand profile', () => {
    const chariteBrand = service.getBrandsByOrganization('org_charite_berlin')[0];
    const switched = service.setActiveBrand(chariteBrand.id);

    expect(switched).toBeTrue();
    expect(service.getActiveBrand().id).toBe(chariteBrand.id);
    expect(service.getActiveBrand().name).toContain('Charité');
  });

  it('should create a new brand profile when user has brand:manage permission', () => {
    const activeUser = rbacService.getCurrentUser();
    expect(rbacService.hasPermission('brand:manage')).toBeTrue();

    const created = service.createBrand({
      name: 'North End Community Health Clinic',
      tagline: 'Healthcare close to home',
      colors: {
        primary: '#0e7490',
        secondary: '#155e75',
        background: '#ffffff',
        text: '#083344',
        accent: '#06b6d4',
        border: '#cffafe',
      },
      address: {
        street: '42 Commercial St',
        city: 'Boston',
        state: 'MA',
        postalCode: '02109',
        country: 'USA',
      },
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe('North End Community Health Clinic');
    expect(service.getBrandById(created.id)).toBeDefined();
  });

  it('should block brand creation and throw error if brand:manage permission is denied', () => {
    rbacService.simulateRole('viewer'); // Viewer lacks brand:manage
    expect(rbacService.hasPermission('brand:manage')).toBeFalse();

    expect(() => {
      service.createBrand({ name: 'Unauthorized Brand' });
    }).toThrowError(/Access Denied/);

    rbacService.resetSimulation();
  });

  it('should update an existing brand and notify subscribers', (done) => {
    const active = service.getActiveBrand();
    const updated = service.updateBrand(active.id, {
      tagline: 'Updated Healthcare Excellence',
      colors: { ...active.colors, primary: '#1d4ed8' },
    });

    expect(updated).toBeDefined();
    expect(updated?.tagline).toBe('Updated Healthcare Excellence');
    expect(updated?.colors.primary).toBe('#1d4ed8');

    service.activeBrand$.subscribe((b) => {
      if (b.id === active.id) {
        expect(b.tagline).toBe('Updated Healthcare Excellence');
        done();
      }
    });
  });

  it('should delete a brand profile if permitted and not the last remaining brand', () => {
    const created = service.createBrand({ name: 'Temporary Clinic' });
    const countBefore = service.getBrands().length;

    const deleted = service.deleteBrand(created.id);
    expect(deleted).toBeTrue();
    expect(service.getBrands().length).toBe(countBefore - 1);
    expect(service.getBrandById(created.id)).toBeUndefined();
  });

  it('should generate valid CSS variables for document styling', () => {
    const brand = service.getActiveBrand();
    const css = service.generateBrandCss(brand);

    expect(css).toContain(`--brand-primary: ${brand.colors.primary}`);
    expect(css).toContain(`--brand-secondary: ${brand.colors.secondary}`);
    expect(css).toContain(`--brand-font: ${brand.typography.fontFamily}`);
    expect(css).toContain('.doc-header');
    expect(css).toContain('.doc-footer');
  });

  it('should generate letterhead header HTML across modern, classic, and minimal styles', () => {
    const brand = service.getActiveBrand();

    const modern = service.generateHeaderHtml(brand, 'modern');
    expect(modern).toContain(brand.name);
    expect(modern).toContain(brand.colors.primary);

    const classic = service.generateHeaderHtml(brand, 'classic');
    expect(classic).toContain(brand.name);
    expect(classic).toContain('text-align:center');

    const minimal = service.generateHeaderHtml(brand, 'minimal');
    expect(minimal).toContain(brand.name);
    expect(minimal).toContain('{{document.title}}');
  });

  it('should interpolate brand tokens into document content', () => {
    const brand = service.getActiveBrand();
    const templateContent = `
      <h1>{{brand.name}}</h1>
      <p>Contact: {{brand.phone}} · {{brand.email}}</p>
      <span>Color: {{brand.primaryColor}}</span>
    `;

    const rendered = service.interpolateBrandTokens(templateContent, brand);

    expect(rendered).toContain(`<h1>${brand.name}</h1>`);
    expect(rendered).toContain(brand.contactInfo?.phone || '');
    expect(rendered).toContain(brand.contactInfo?.email || '');
    expect(rendered).toContain(brand.colors.primary);
  });
});
