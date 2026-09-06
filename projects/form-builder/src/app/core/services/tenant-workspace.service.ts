import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Organization, Workspace, WorkspaceSettings } from '../domain/workspace.model';
import { User, UserRole, DEFAULT_ROLE_PERMISSIONS } from '../domain/user.model';

export interface MultiTenantState {
  organizations: Organization[];
  workspaces: Workspace[];
  users: User[];
  activeOrganizationId: string;
  activeWorkspaceId: string;
}

@Injectable({
  providedIn: 'root',
})
export class TenantWorkspaceService {
  private readonly STORAGE_KEY = 'form_builder_tenancy_v1';

  private organizationsSubject = new BehaviorSubject<Organization[]>([]);
  public organizations$: Observable<Organization[]> = this.organizationsSubject.asObservable();

  private workspacesSubject = new BehaviorSubject<Workspace[]>([]);
  public workspaces$: Observable<Workspace[]> = this.workspacesSubject.asObservable();

  private activeOrganizationSubject = new BehaviorSubject<Organization | null>(null);
  public activeOrganization$: Observable<Organization | null> = this.activeOrganizationSubject.asObservable();

  private activeWorkspaceSubject = new BehaviorSubject<Workspace | null>(null);
  public activeWorkspace$: Observable<Workspace | null> = this.activeWorkspaceSubject.asObservable();

  private usersSubject = new BehaviorSubject<User[]>([]);
  public users$: Observable<User[]> = this.usersSubject.asObservable();

  constructor() {
    this.loadInitialState();
  }

  // =========================================================================
  // State Initialization & Seed Data
  // =========================================================================

  private loadInitialState(): void {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (raw) {
      try {
        const state: MultiTenantState = JSON.parse(raw);
        if (state.organizations && state.workspaces && state.organizations.length > 0) {
          this.applyState(state);
          return;
        }
      } catch (e) {
        console.warn('Failed to parse tenancy storage, resetting to default seed.', e);
      }
    }

    const defaultSeed = this.createDefaultSeed();
    this.applyState(defaultSeed);
    this.persistState();
  }

  private applyState(state: MultiTenantState): void {
    this.organizationsSubject.next(state.organizations);
    this.workspacesSubject.next(state.workspaces);
    this.usersSubject.next(state.users || []);

    const activeOrg =
      state.organizations.find((o) => o.id === state.activeOrganizationId) ||
      state.organizations[0] ||
      null;
    this.activeOrganizationSubject.next(activeOrg);

    const availableWs = state.workspaces.filter(
      (w) => !activeOrg || w.organizationId === activeOrg.id
    );
    const activeWs =
      availableWs.find((w) => w.id === state.activeWorkspaceId) ||
      availableWs[0] ||
      state.workspaces[0] ||
      null;
    this.activeWorkspaceSubject.next(activeWs);
  }

  private persistState(): void {
    const state: MultiTenantState = {
      organizations: this.organizationsSubject.value,
      workspaces: this.workspacesSubject.value,
      users: this.usersSubject.value,
      activeOrganizationId: this.activeOrganizationSubject.value?.id || '',
      activeWorkspaceId: this.activeWorkspaceSubject.value?.id || '',
    };
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Could not persist tenancy state to localStorage:', e);
    }
  }

  private createDefaultSeed(): MultiTenantState {
    const orgBerlin: Organization = {
      id: 'org_berlin_mitte',
      name: 'Klinikum Berlin-Mitte',
      slug: 'klinikum-berlin',
      description: 'Universitätsklinik & Maximalversorger (Campus Mitte)',
      createdAt: '2026-01-10T08:00:00.000Z',
      updatedAt: '2026-01-10T08:00:00.000Z',
      metadata: { city: 'Berlin', country: 'DE', beds: 1200 },
    };

    const orgDental: Organization = {
      id: 'org_apex_dental',
      name: 'Apex Dental Care Group',
      slug: 'apex-dental',
      description: 'Zentren für Zahnmedizin, Implantologie & Kieferorthopädie',
      createdAt: '2026-02-15T09:00:00.000Z',
      updatedAt: '2026-02-15T09:00:00.000Z',
      metadata: { city: 'München', country: 'DE', locations: 4 },
    };

    const orgStJude: Organization = {
      id: 'org_st_jude',
      name: 'St. Jude Medical Health System',
      slug: 'st-jude-health',
      description: 'Integrated Healthcare Provider & Academic Medical Center',
      createdAt: '2026-03-01T10:00:00.000Z',
      updatedAt: '2026-03-01T10:00:00.000Z',
      metadata: { city: 'Chicago', country: 'US' },
    };

    // Workspaces
    const wsDefault: Workspace = {
      id: 'ws_default',
      organizationId: orgBerlin.id,
      name: 'Ambulanz & Allgemeinmedizin',
      slug: 'ambulanz-allgemein',
      description: 'Allgemeinmedizinische Patientenaufnahme, Konsultationen & Notfallambulanz',
      industry: 'healthcare',
      defaultLanguage: 'de',
      defaultCountry: 'DE',
      isDefault: true,
      createdAt: '2026-01-10T08:30:00.000Z',
      updatedAt: '2026-01-10T08:30:00.000Z',
      settings: {
        defaultPageFormat: 'A4',
        allowPublicTemplates: true,
        enforceBrandStyles: true,
      },
    };

    const wsPhysio: Workspace = {
      id: 'ws_physio_reha',
      organizationId: orgBerlin.id,
      name: 'Physiotherapie & Reha-Zentrum',
      slug: 'physio-reha',
      description: 'Physiotherapeutische Erstbefunde, Schmerzskalen, ROM & Trainingspläne',
      industry: 'physiotherapy',
      defaultLanguage: 'de',
      defaultCountry: 'DE',
      isDefault: false,
      createdAt: '2026-01-15T11:00:00.000Z',
      updatedAt: '2026-01-15T11:00:00.000Z',
      settings: {
        defaultPageFormat: 'A4',
        allowPublicTemplates: true,
      },
    };

    const wsLab: Workspace = {
      id: 'ws_diagnostik_labor',
      organizationId: orgBerlin.id,
      name: 'Zentrallabor & Diagnostik',
      slug: 'diagnostik-labor',
      description: 'Klinisch-chemische Laborbefunde, Blutanalysen & Pathologieberichte',
      industry: 'laboratory',
      defaultLanguage: 'de',
      defaultCountry: 'DE',
      isDefault: false,
      createdAt: '2026-01-20T14:00:00.000Z',
      updatedAt: '2026-01-20T14:00:00.000Z',
      settings: {
        defaultPageFormat: 'A4',
      },
    };

    const wsDentalMunich: Workspace = {
      id: 'ws_dental_muc',
      organizationId: orgDental.id,
      name: 'Zahnklinik München Promenade',
      slug: 'dental-muc',
      description: 'Befundung, Zahnschemata, Parodontalstatus & Heil- und Kostenpläne',
      industry: 'dental',
      defaultLanguage: 'de',
      defaultCountry: 'DE',
      isDefault: true,
      createdAt: '2026-02-15T09:30:00.000Z',
      updatedAt: '2026-02-15T09:30:00.000Z',
      settings: {
        defaultPageFormat: 'A4',
      },
    };

    const wsInpatientUS: Workspace = {
      id: 'ws_inpatient_us',
      organizationId: orgStJude.id,
      name: 'Inpatient Clinical Services',
      slug: 'inpatient-clinical',
      description: 'Hospital admissions, operative notes, discharge summaries & orders',
      industry: 'healthcare',
      defaultLanguage: 'en',
      defaultCountry: 'US',
      isDefault: true,
      createdAt: '2026-03-01T10:30:00.000Z',
      updatedAt: '2026-03-01T10:30:00.000Z',
      settings: {
        defaultPageFormat: 'Letter',
      },
    };

    // Seed Users covering all 6 roles
    const users: User[] = [
      {
        id: 'usr_stefan_berger',
        organizationId: orgBerlin.id,
        workspaceIds: [wsDefault.id, wsPhysio.id, wsLab.id],
        email: 's.berger@klinikum-berlin.de',
        firstName: 'Dr. Stefan',
        lastName: 'Berger',
        role: 'admin',
        permissions: [...DEFAULT_ROLE_PERMISSIONS.admin],
        status: 'active',
        createdAt: '2026-01-10T08:00:00.000Z',
        updatedAt: '2026-01-10T08:00:00.000Z',
      },
      {
        id: 'usr_claudia_richter',
        organizationId: orgBerlin.id,
        workspaceIds: [wsDefault.id, wsPhysio.id],
        email: 'c.richter@klinikum-berlin.de',
        firstName: 'Claudia',
        lastName: 'Richter (PT)',
        role: 'healthcare_staff',
        permissions: [...DEFAULT_ROLE_PERMISSIONS.healthcare_staff],
        status: 'active',
        createdAt: '2026-01-15T09:00:00.000Z',
        updatedAt: '2026-01-15T09:00:00.000Z',
      },
      {
        id: 'usr_elena_rostova',
        organizationId: orgBerlin.id,
        workspaceIds: [wsDefault.id, wsPhysio.id, wsLab.id],
        email: 'e.rostova@klinikum-berlin.de',
        firstName: 'Elena',
        lastName: 'Rostova',
        role: 'template_designer',
        permissions: [...DEFAULT_ROLE_PERMISSIONS.template_designer],
        status: 'active',
        createdAt: '2026-01-18T10:00:00.000Z',
        updatedAt: '2026-01-18T10:00:00.000Z',
      },
      {
        id: 'usr_felix_auditor',
        organizationId: orgBerlin.id,
        workspaceIds: [wsDefault.id],
        email: 'f.neumann@med-audit.org',
        firstName: 'Felix',
        lastName: 'Neumann (Auditor)',
        role: 'viewer',
        permissions: [...DEFAULT_ROLE_PERMISSIONS.viewer],
        status: 'active',
        createdAt: '2026-01-20T11:00:00.000Z',
        updatedAt: '2026-01-20T11:00:00.000Z',
      },
      {
        id: 'usr_ehr_api_bot',
        organizationId: orgBerlin.id,
        workspaceIds: [wsDefault.id, wsPhysio.id, wsLab.id],
        email: 'ehr-bridge@klinikum-berlin.de',
        firstName: 'EHR Bridge',
        lastName: 'Service Bot',
        role: 'api_client',
        permissions: [...DEFAULT_ROLE_PERMISSIONS.api_client],
        status: 'active',
        createdAt: '2026-01-22T14:00:00.000Z',
        updatedAt: '2026-01-22T14:00:00.000Z',
      },
      {
        id: 'usr_markus_vogt',
        organizationId: orgDental.id,
        workspaceIds: [wsDentalMunich.id],
        email: 'm.vogt@apex-dental.de',
        firstName: 'Dr. med. dent. Markus',
        lastName: 'Vogt',
        role: 'owner',
        permissions: [...DEFAULT_ROLE_PERMISSIONS.owner],
        status: 'active',
        createdAt: '2026-02-15T09:00:00.000Z',
        updatedAt: '2026-02-15T09:00:00.000Z',
      },
      {
        id: 'usr_sarah_jenkins',
        organizationId: orgStJude.id,
        workspaceIds: [wsInpatientUS.id],
        email: 'sjenkins@stjude-health.org',
        firstName: 'Dr. Sarah',
        lastName: 'Jenkins, MD',
        role: 'admin',
        permissions: [...DEFAULT_ROLE_PERMISSIONS.admin],
        status: 'active',
        createdAt: '2026-03-01T10:00:00.000Z',
        updatedAt: '2026-03-01T10:00:00.000Z',
      },
    ];

    return {
      organizations: [orgBerlin, orgDental, orgStJude],
      workspaces: [wsDefault, wsPhysio, wsLab, wsDentalMunich, wsInpatientUS],
      users,
      activeOrganizationId: orgBerlin.id,
      activeWorkspaceId: wsDefault.id,
    };
  }

  // =========================================================================
  // Getters & Lookups
  // =========================================================================

  public getOrganizations(): Organization[] {
    return [...this.organizationsSubject.value];
  }

  public getOrganizationById(id: string): Organization | undefined {
    return this.organizationsSubject.value.find((o) => o.id === id);
  }

  public getWorkspaces(organizationId?: string): Workspace[] {
    const list = this.workspacesSubject.value;
    if (organizationId) {
      return list.filter((w) => w.organizationId === organizationId);
    }
    return [...list];
  }

  public getWorkspaceById(id: string): Workspace | undefined {
    return this.workspacesSubject.value.find((w) => w.id === id);
  }

  public getActiveOrganization(): Organization | null {
    return this.activeOrganizationSubject.value;
  }

  public getActiveWorkspace(): Workspace | null {
    return this.activeWorkspaceSubject.value;
  }

  public getActiveWorkspaceId(): string {
    return this.activeWorkspaceSubject.value?.id || 'ws_default';
  }

  // =========================================================================
  // Workspace & Organization Switching
  // =========================================================================

  public switchWorkspace(workspaceId: string): boolean {
    const targetWs = this.workspacesSubject.value.find((w) => w.id === workspaceId);
    if (!targetWs) return false;

    this.activeWorkspaceSubject.next(targetWs);

    // If workspace belongs to a different organization, switch active organization as well
    if (this.activeOrganizationSubject.value?.id !== targetWs.organizationId) {
      const parentOrg = this.organizationsSubject.value.find(
        (o) => o.id === targetWs.organizationId
      );
      if (parentOrg) {
        this.activeOrganizationSubject.next(parentOrg);
      }
    }

    this.persistState();
    return true;
  }

  public switchOrganization(organizationId: string): boolean {
    const targetOrg = this.organizationsSubject.value.find((o) => o.id === organizationId);
    if (!targetOrg) return false;

    this.activeOrganizationSubject.next(targetOrg);

    // Switch to first workspace in this organization
    const orgWorkspaces = this.workspacesSubject.value.filter(
      (w) => w.organizationId === targetOrg.id
    );
    const defaultOrFirst = orgWorkspaces.find((w) => w.isDefault) || orgWorkspaces[0];

    if (defaultOrFirst) {
      this.activeWorkspaceSubject.next(defaultOrFirst);
    }

    this.persistState();
    return true;
  }

  // =========================================================================
  // Mutation: Create Organization & Workspace
  // =========================================================================

  public createOrganization(params: {
    name: string;
    slug?: string;
    description?: string;
  }): Organization {
    const orgId = `org_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const slug =
      params.slug ||
      params.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const newOrg: Organization = {
      id: orgId,
      name: params.name.trim(),
      slug,
      description: params.description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const currentOrgs = this.organizationsSubject.value;
    const updatedOrgs = [...currentOrgs, newOrg];
    this.organizationsSubject.next(updatedOrgs);

    // Also automatically provision a default workspace for this organization
    this.createWorkspace({
      organizationId: newOrg.id,
      name: 'Default Clinical Workspace',
      description: `Primary workspace for ${newOrg.name}`,
      isDefault: true,
      defaultLanguage: 'de',
      defaultCountry: 'DE',
      industry: 'healthcare',
    });

    this.switchOrganization(newOrg.id);
    return newOrg;
  }

  public createWorkspace(params: {
    organizationId: string;
    name: string;
    slug?: string;
    description?: string;
    industry?: string;
    defaultLanguage?: string;
    defaultCountry?: string;
    isDefault?: boolean;
    settings?: WorkspaceSettings;
  }): Workspace {
    const wsId = `ws_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const slug =
      params.slug ||
      params.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const newWs: Workspace = {
      id: wsId,
      organizationId: params.organizationId,
      name: params.name.trim(),
      slug,
      description: params.description || '',
      industry: params.industry || 'healthcare',
      defaultLanguage: params.defaultLanguage || 'de',
      defaultCountry: params.defaultCountry || 'DE',
      isDefault: params.isDefault || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: params.settings || { defaultPageFormat: 'A4', allowPublicTemplates: true },
    };

    const currentWorkspaces = this.workspacesSubject.value;
    const updatedWorkspaces = [...currentWorkspaces, newWs];
    this.workspacesSubject.next(updatedWorkspaces);
    this.persistState();

    return newWs;
  }

  public deleteWorkspace(workspaceId: string): boolean {
    const current = this.workspacesSubject.value;
    const target = current.find((w) => w.id === workspaceId);
    if (!target) return false;

    // Do not allow deleting the last remaining workspace
    if (current.length <= 1) return false;

    const remaining = current.filter((w) => w.id !== workspaceId);
    this.workspacesSubject.next(remaining);

    // If active workspace was deleted, switch to another workspace
    if (this.activeWorkspaceSubject.value?.id === workspaceId) {
      const nextWs = remaining.find((w) => w.organizationId === target.organizationId) || remaining[0];
      this.activeWorkspaceSubject.next(nextWs);
      const nextOrg = this.organizationsSubject.value.find((o) => o.id === nextWs.organizationId);
      if (nextOrg) this.activeOrganizationSubject.next(nextOrg);
    }

    this.persistState();
    return true;
  }

  // =========================================================================
  // Users & Roles per Workspace
  // =========================================================================

  public getUsers(): User[] {
    return [...this.usersSubject.value];
  }

  public getUserById(id: string): User | undefined {
    return this.usersSubject.value.find((u) => u.id === id);
  }

  public getWorkspaceUsers(workspaceId: string): User[] {
    return this.usersSubject.value.filter((u) => u.workspaceIds.includes(workspaceId));
  }

  public addUserToWorkspace(params: {
    workspaceId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  }): User {
    const ws = this.getWorkspaceById(params.workspaceId);
    const orgId = ws ? ws.organizationId : this.activeOrganizationSubject.value?.id || 'org_default';

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      organizationId: orgId,
      workspaceIds: [params.workspaceId],
      email: params.email.trim(),
      firstName: params.firstName.trim(),
      lastName: params.lastName.trim(),
      role: params.role,
      permissions: [...(DEFAULT_ROLE_PERMISSIONS[params.role] || ['template:view', 'document:view'])],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const currentUsers = this.usersSubject.value;
    this.usersSubject.next([...currentUsers, newUser]);
    this.persistState();
    return newUser;
  }

  // =========================================================================
  // Data Isolation & Query Filtering Helpers
  // =========================================================================

  /**
   * Filters any items array by active workspace ID.
   * If allowGlobalSystem is true, items with empty workspaceId or 'system' are also included.
   */
  public filterByActiveWorkspace<T extends { workspaceId?: string }>(
    items: T[],
    allowGlobalSystem: boolean = true
  ): T[] {
    const activeWsId = this.getActiveWorkspaceId();
    return items.filter((item) => {
      if (!item.workspaceId) {
        return allowGlobalSystem;
      }
      if (item.workspaceId === 'system' || item.workspaceId === 'global') {
        return allowGlobalSystem;
      }
      if (
        item.workspaceId === activeWsId ||
        (activeWsId === 'ws_default' && item.workspaceId === 'ws-default') ||
        (activeWsId === 'ws-default' && item.workspaceId === 'ws_default')
      ) {
        return true;
      }
      return false;
    });
  }

  /**
   * Resets tenancy state back to factory default seeds.
   */
  public resetToDefaults(): void {
    const defaultSeed = this.createDefaultSeed();
    this.applyState(defaultSeed);
    this.persistState();
  }
}
