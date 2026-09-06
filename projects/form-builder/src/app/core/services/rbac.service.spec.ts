import { TestBed } from '@angular/core/testing';
import { RbacService } from './rbac.service';
import { TenantWorkspaceService } from './tenant-workspace.service';
import { User, UserRole } from '../domain/user.model';

describe('RbacService', () => {
  let service: RbacService;
  let tenantService: TenantWorkspaceService;

  beforeEach(() => {
    localStorage.removeItem('form_builder_rbac_user_id');
    TestBed.configureTestingModule({
      providers: [RbacService, TenantWorkspaceService],
    });
    tenantService = TestBed.inject(TenantWorkspaceService);
    tenantService.resetToDefaults();
    service = TestBed.inject(RbacService);
    service.resetToDefaults();
  });

  afterEach(() => {
    localStorage.removeItem('form_builder_rbac_user_id');
  });

  it('should be created and initialize an active user', () => {
    expect(service).toBeTruthy();
    const currentUser = service.getCurrentUser();
    expect(currentUser).toBeTruthy();
    expect(currentUser?.role).toBe('admin');
  });

  it('should correctly check permissions for current user', () => {
    expect(service.hasPermission('template:view')).toBeTrue();
    expect(service.hasPermission('template:create')).toBeTrue();
    expect(service.hasPermission('document:generate')).toBeTrue();
    expect(service.hasPermission('workspace:manage')).toBeTrue();
  });

  it('should support switching to a different user', () => {
    const success = service.switchUser('usr_claudia_richter');
    expect(success).toBeTrue();
    expect(service.getCurrentUser()?.firstName).toContain('Claudia');
    expect(service.getCurrentRole()).toBe('healthcare_staff');

    // Healthcare staff can generate documents but CANNOT edit templates or manage workspaces
    expect(service.canGenerateDocument()).toBeTrue();
    expect(service.canViewDocuments()).toBeTrue();
    expect(service.canViewTemplates()).toBeTrue();
    expect(service.canEditTemplate()).toBeFalse();
    expect(service.canCreateTemplate()).toBeFalse();
    expect(service.canDeleteTemplate()).toBeFalse();
    expect(service.canManageWorkspaces()).toBeFalse();
    expect(service.canManageApiKeys()).toBeFalse();
  });

  it('should return false when switching to non-existent user', () => {
    const success = service.switchUser('non_existent_user_id');
    expect(success).toBeFalse();
  });

  it('should support role simulation for quick testing without altering user record', () => {
    const originalUser = service.getCurrentUser();
    expect(service.getCurrentRole()).toBe('admin');

    // Simulate viewer role
    service.simulateRole('viewer');
    expect(service.isSimulating()).toBeTrue();
    expect(service.getCurrentRole()).toBe('viewer');
    expect(service.canViewTemplates()).toBeTrue();
    expect(service.canViewDocuments()).toBeTrue();
    expect(service.canGenerateDocument()).toBeFalse();
    expect(service.canEditTemplate()).toBeFalse();
    expect(service.canDeleteTemplate()).toBeFalse();
    expect(service.canManageWorkspaces()).toBeFalse();

    // Reset simulation
    service.resetSimulation();
    expect(service.isSimulating()).toBeFalse();
    expect(service.getCurrentRole()).toBe('admin');
    expect(service.canGenerateDocument()).toBeTrue();
    expect(service.getCurrentUser()?.id).toBe(originalUser?.id);
  });

  it('should enforce role permission matrix correctly across all 6 roles', () => {
    // 1. Owner
    service.simulateRole('owner');
    expect(service.hasPermission('template:delete')).toBeTrue();
    expect(service.hasPermission('document:delete')).toBeTrue();
    expect(service.hasPermission('user:manage')).toBeTrue();
    expect(service.hasPermission('workspace:manage')).toBeTrue();
    expect(service.hasPermission('brand:manage')).toBeTrue();

    // 2. Admin
    service.simulateRole('admin');
    expect(service.hasPermission('template:create')).toBeTrue();
    expect(service.hasPermission('template:publish')).toBeTrue();
    expect(service.hasPermission('template:delete')).toBeTrue();
    expect(service.hasPermission('document:generate')).toBeTrue();
    expect(service.hasPermission('workspace:manage')).toBeTrue();

    // 3. Template Designer
    service.simulateRole('template_designer');
    expect(service.hasPermission('template:view')).toBeTrue();
    expect(service.hasPermission('template:create')).toBeTrue();
    expect(service.hasPermission('template:edit')).toBeTrue();
    expect(service.hasPermission('template:publish')).toBeTrue();
    expect(service.hasPermission('brand:manage')).toBeTrue();
    // Cannot delete templates or manage administrative objects
    expect(service.hasPermission('template:delete')).toBeFalse();
    expect(service.hasPermission('document:generate')).toBeFalse();
    expect(service.hasPermission('workspace:manage')).toBeFalse();
    expect(service.hasPermission('user:manage')).toBeFalse();

    // 4. Healthcare Staff
    service.simulateRole('healthcare_staff');
    expect(service.hasPermission('template:view')).toBeTrue();
    expect(service.hasPermission('document:generate')).toBeTrue();
    expect(service.hasPermission('document:view')).toBeTrue();
    expect(service.hasPermission('template:create')).toBeFalse();
    expect(service.hasPermission('template:edit')).toBeFalse();
    expect(service.hasPermission('template:publish')).toBeFalse();

    // 5. Viewer
    service.simulateRole('viewer');
    expect(service.hasPermission('template:view')).toBeTrue();
    expect(service.hasPermission('document:view')).toBeTrue();
    expect(service.hasPermission('document:generate')).toBeFalse();
    expect(service.hasPermission('template:edit')).toBeFalse();

    // 6. API Client
    service.simulateRole('api_client');
    expect(service.hasPermission('template:view')).toBeTrue();
    expect(service.hasPermission('document:generate')).toBeTrue();
    expect(service.hasPermission('document:view')).toBeTrue();
    expect(service.hasPermission('template:create')).toBeFalse();
    expect(service.hasPermission('api_key:manage')).toBeFalse();
  });

  it('should test hasAnyPermission and hasAllPermissions helpers', () => {
    service.simulateRole('template_designer');

    expect(
      service.hasAnyPermission(['template:delete', 'template:create'])
    ).toBeTrue();
    expect(
      service.hasAnyPermission(['template:delete', 'workspace:manage'])
    ).toBeFalse();

    expect(
      service.hasAllPermissions(['template:view', 'template:edit'])
    ).toBeTrue();
    expect(
      service.hasAllPermissions(['template:view', 'template:delete'])
    ).toBeFalse();
  });

  it('should return role definitions and all permissions', () => {
    const definitions = service.getAllRoleDefinitions();
    expect(definitions.length).toBe(6);
    expect(definitions.some((d) => d.name === 'healthcare_staff')).toBeTrue();

    const perms = service.getAllPermissions();
    expect(perms.length).toBe(13);
    expect(perms).toContain('document:generate');
  });
});
