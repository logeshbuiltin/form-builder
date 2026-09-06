import { TestBed } from '@angular/core/testing';
import { TenantWorkspaceService } from './tenant-workspace.service';

describe('TenantWorkspaceService (Phase 10: Multi-Tenancy)', () => {
  let service: TenantWorkspaceService;

  beforeEach(() => {
    localStorage.removeItem('form_builder_tenancy_v1');
    TestBed.configureTestingModule({
      providers: [TenantWorkspaceService],
    });
    service = TestBed.inject(TenantWorkspaceService);
  });

  afterEach(() => {
    localStorage.removeItem('form_builder_tenancy_v1');
  });

  it('should be created and load initial organizations and workspaces seed', () => {
    expect(service).toBeTruthy();

    const orgs = service.getOrganizations();
    expect(orgs.length).toBeGreaterThanOrEqual(3);
    const orgIds = orgs.map((o) => o.id);
    expect(orgIds).toContain('org_berlin_mitte');
    expect(orgIds).toContain('org_apex_dental');
    expect(orgIds).toContain('org_st_jude');

    const workspaces = service.getWorkspaces();
    expect(workspaces.length).toBeGreaterThanOrEqual(5);

    const activeWs = service.getActiveWorkspace();
    expect(activeWs).toBeDefined();
    expect(activeWs?.id).toBe('ws_default');
    expect(activeWs?.organizationId).toBe('org_berlin_mitte');
  });

  it('should filter workspaces by organizationId', () => {
    const berlinWorkspaces = service.getWorkspaces('org_berlin_mitte');
    expect(berlinWorkspaces.length).toBe(3);
    expect(berlinWorkspaces.every((w) => w.organizationId === 'org_berlin_mitte')).toBeTrue();

    const dentalWorkspaces = service.getWorkspaces('org_apex_dental');
    expect(dentalWorkspaces.length).toBe(1);
    expect(dentalWorkspaces[0].id).toBe('ws_dental_muc');
  });

  it('should switch active workspace and synchronize parent organization', (done) => {
    const success = service.switchWorkspace('ws_physio_reha');
    expect(success).toBeTrue();
    expect(service.getActiveWorkspaceId()).toBe('ws_physio_reha');

    service.activeWorkspace$.subscribe((ws) => {
      if (ws?.id === 'ws_physio_reha') {
        expect(ws.name).toContain('Physiotherapie');
        expect(service.getActiveOrganization()?.id).toBe('org_berlin_mitte');
        done();
      }
    });
  });

  it('should switch active organization and select its default workspace', () => {
    const success = service.switchOrganization('org_apex_dental');
    expect(success).toBeTrue();

    const activeOrg = service.getActiveOrganization();
    expect(activeOrg?.id).toBe('org_apex_dental');

    const activeWs = service.getActiveWorkspace();
    expect(activeWs?.id).toBe('ws_dental_muc');
  });

  it('should create a new organization with a default clinical workspace', () => {
    const newOrg = service.createOrganization({
      name: 'Charité Comprehensive Cancer Center',
      description: 'Onkologisches Spitzenzentrum',
    });

    expect(newOrg.id).toContain('org_');
    expect(newOrg.name).toBe('Charité Comprehensive Cancer Center');

    const activeOrg = service.getActiveOrganization();
    expect(activeOrg?.id).toBe(newOrg.id);

    const orgWorkspaces = service.getWorkspaces(newOrg.id);
    expect(orgWorkspaces.length).toBe(1);
    expect(orgWorkspaces[0].name).toBe('Default Clinical Workspace');
    expect(orgWorkspaces[0].isDefault).toBeTrue();
  });

  it('should create a new workspace under an existing organization', () => {
    const newWs = service.createWorkspace({
      organizationId: 'org_berlin_mitte',
      name: 'Kardiologie & Herzkatheterlabor',
      industry: 'healthcare',
      defaultLanguage: 'de',
      defaultCountry: 'DE',
    });

    expect(newWs.id).toContain('ws_');
    expect(newWs.organizationId).toBe('org_berlin_mitte');

    const allBerlin = service.getWorkspaces('org_berlin_mitte');
    expect(allBerlin.map((w) => w.id)).toContain(newWs.id);
  });

  it('should delete a workspace safely and switch active if needed', () => {
    const ws = service.createWorkspace({
      organizationId: 'org_berlin_mitte',
      name: 'Temporary Ward 4B',
    });

    service.switchWorkspace(ws.id);
    expect(service.getActiveWorkspaceId()).toBe(ws.id);

    const deleted = service.deleteWorkspace(ws.id);
    expect(deleted).toBeTrue();
    expect(service.getWorkspaceById(ws.id)).toBeUndefined();
    expect(service.getActiveWorkspaceId()).not.toBe(ws.id);
  });

  it('should retrieve workspace users and add new members with roles', () => {
    const users = service.getWorkspaceUsers('ws_default');
    expect(users.length).toBeGreaterThanOrEqual(2);
    expect(users.some((u) => u.firstName.includes('Stefan'))).toBeTrue();

    const added = service.addUserToWorkspace({
      workspaceId: 'ws_default',
      email: 'anna.schmidt@klinikum-berlin.de',
      firstName: 'Dr. Anna',
      lastName: 'Schmidt',
      role: 'healthcare_staff',
    });

    expect(added.id).toContain('usr_');
    expect(added.role).toBe('healthcare_staff');

    const updatedUsers = service.getWorkspaceUsers('ws_default');
    expect(updatedUsers.some((u) => u.email === 'anna.schmidt@klinikum-berlin.de')).toBeTrue();
  });

  it('should enforce data isolation via filterByActiveWorkspace', () => {
    service.switchWorkspace('ws_default');

    const mockDocs = [
      { id: 'doc_1', title: 'Doc Berlin Ambulanz', workspaceId: 'ws_default' },
      { id: 'doc_2', title: 'Doc Physio Reha', workspaceId: 'ws_physio_reha' },
      { id: 'doc_3', title: 'Doc Dental Munich', workspaceId: 'ws_dental_muc' },
      { id: 'doc_global', title: 'Global Standard Form', workspaceId: 'global' },
      { id: 'doc_no_ws', title: 'Legacy Unbound Form' },
    ];

    const isolatedDefault = service.filterByActiveWorkspace(mockDocs);
    const ids = isolatedDefault.map((d) => d.id);

    expect(ids).toContain('doc_1');
    expect(ids).toContain('doc_global');
    expect(ids).toContain('doc_no_ws');
    expect(ids).not.toContain('doc_2'); // Isolated!
    expect(ids).not.toContain('doc_3'); // Isolated!

    // Now switch to Physio
    service.switchWorkspace('ws_physio_reha');
    const isolatedPhysio = service.filterByActiveWorkspace(mockDocs);
    const physioIds = isolatedPhysio.map((d) => d.id);

    expect(physioIds).toContain('doc_2');
    expect(physioIds).not.toContain('doc_1');
    expect(physioIds).not.toContain('doc_3');
  });
});
