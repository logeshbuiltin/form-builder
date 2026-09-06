import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  User,
  UserRole,
  Permission,
  RoleDefinition,
  ALL_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  ROLE_DEFINITIONS,
} from '../domain/user.model';
import { TenantWorkspaceService } from './tenant-workspace.service';

@Injectable({
  providedIn: 'root',
})
export class RbacService {
  private readonly STORAGE_USER_KEY = 'form_builder_rbac_user_id';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  public currentRole$: Observable<UserRole | null> = this.currentUser$.pipe(
    map((user) => (this.simulatedRoleSubject.value ? this.simulatedRoleSubject.value : user?.role || null))
  );

  public currentPermissions$: Observable<Permission[]> = this.currentUser$.pipe(
    map(() => this.getCurrentPermissions())
  );

  // Simulation state for interactive UI testing
  private simulatedRoleSubject = new BehaviorSubject<UserRole | null>(null);
  public simulatedRole$: Observable<UserRole | null> = this.simulatedRoleSubject.asObservable();

  constructor(private tenantWorkspaceService: TenantWorkspaceService) {
    this.initCurrentUser();

    // Listen to workspace changes
    this.tenantWorkspaceService.activeWorkspace$.subscribe((activeWs) => {
      if (!activeWs) return;
      const current = this.currentUserSubject.value;
      if (current) {
        // If user belongs to the new workspace, retain them
        if (current.workspaceIds.includes(activeWs.id)) return;
      }
      // Otherwise select first user in the new workspace
      const wsUsers = this.tenantWorkspaceService.getWorkspaceUsers(activeWs.id);
      if (wsUsers.length > 0) {
        this.setCurrentUser(wsUsers[0]);
      }
    });
  }

  // =========================================================================
  // User & Role State Management
  // =========================================================================

  private initCurrentUser(): void {
    const users = this.tenantWorkspaceService.getUsers();
    if (users.length === 0) return;

    const savedUserId = localStorage.getItem(this.STORAGE_USER_KEY);
    if (savedUserId) {
      const matched = users.find((u) => u.id === savedUserId);
      if (matched) {
        this.currentUserSubject.next(matched);
        return;
      }
    }

    // Default to Dr. Stefan Berger (admin) or first user
    const defaultUser =
      users.find((u) => u.role === 'admin') ||
      users.find((u) => u.role === 'owner') ||
      users[0];

    if (defaultUser) {
      this.currentUserSubject.next(defaultUser);
    }
  }

  public getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  public getCurrentRole(): UserRole | null {
    if (this.simulatedRoleSubject.value) {
      return this.simulatedRoleSubject.value;
    }
    return this.currentUserSubject.value?.role || null;
  }

  public getCurrentPermissions(): Permission[] {
    const simulatedRole = this.simulatedRoleSubject.value;
    if (simulatedRole) {
      return [...(DEFAULT_ROLE_PERMISSIONS[simulatedRole] || [])];
    }
    return this.currentUserSubject.value?.permissions || [];
  }

  public setCurrentUser(user: User): void {
    if (!user) return;
    this.simulatedRoleSubject.next(null); // clear temporary simulation
    this.currentUserSubject.next(user);
    try {
      localStorage.setItem(this.STORAGE_USER_KEY, user.id);
    } catch (e) {
      console.warn('Could not persist RBAC user:', e);
    }
  }

  public switchUser(userId: string): boolean {
    const user = this.tenantWorkspaceService.getUserById(userId);
    if (!user) return false;
    this.setCurrentUser(user);
    return true;
  }

  /**
   * Temporarily simulate a different role without mutating persistent user records.
   * Useful for rapid UI testing and demonstrations.
   */
  public simulateRole(role: UserRole): void {
    this.simulatedRoleSubject.next(role);
    // trigger updates
    const cur = this.currentUserSubject.value;
    if (cur) {
      this.currentUserSubject.next({ ...cur });
    }
  }

  /**
   * Clears any active role simulation and restores the actual user's assigned role.
   */
  public resetSimulation(): void {
    this.simulatedRoleSubject.next(null);
    const cur = this.currentUserSubject.value;
    if (cur) {
      this.currentUserSubject.next({ ...cur });
    }
  }

  public isSimulating(): boolean {
    return this.simulatedRoleSubject.value !== null;
  }

  // =========================================================================
  // Permission Verification
  // =========================================================================

  public hasPermission(permission: Permission): boolean {
    const permissions = this.getCurrentPermissions();
    return permissions.includes(permission);
  }

  public hasAnyPermission(permissions: Permission[]): boolean {
    const current = this.getCurrentPermissions();
    return permissions.some((p) => current.includes(p));
  }

  public hasAllPermissions(permissions: Permission[]): boolean {
    const current = this.getCurrentPermissions();
    return permissions.every((p) => current.includes(p));
  }

  public hasRole(role: UserRole | UserRole[]): boolean {
    const currentRole = this.getCurrentRole();
    if (!currentRole) return false;
    if (Array.isArray(role)) {
      return role.includes(currentRole);
    }
    return currentRole === role;
  }

  // =========================================================================
  // Clinical & Document Domain-Specific Action Checks
  // =========================================================================

  public canViewTemplates(): boolean {
    return this.hasPermission('template:view');
  }

  public canCreateTemplate(): boolean {
    return this.hasPermission('template:create');
  }

  public canEditTemplate(): boolean {
    return this.hasPermission('template:edit');
  }

  public canPublishTemplate(): boolean {
    return this.hasPermission('template:publish');
  }

  public canDeleteTemplate(): boolean {
    return this.hasPermission('template:delete');
  }

  public canGenerateDocument(): boolean {
    return this.hasPermission('document:generate');
  }

  public canViewDocuments(): boolean {
    return this.hasPermission('document:view');
  }

  public canDeleteDocument(): boolean {
    return this.hasPermission('document:delete');
  }

  public canManageUsers(): boolean {
    return this.hasPermission('user:manage');
  }

  public canManageApiKeys(): boolean {
    return this.hasPermission('api_key:manage');
  }

  public canManageBrand(): boolean {
    return this.hasPermission('brand:manage');
  }

  public canManageWorkspaces(): boolean {
    return this.hasPermission('workspace:manage');
  }

  public canViewAuditLogs(): boolean {
    return this.hasPermission('audit:view');
  }

  // =========================================================================
  // Metadata & Definition Lookups
  // =========================================================================

  public getAllRoleDefinitions(): RoleDefinition[] {
    return [...ROLE_DEFINITIONS];
  }

  public getRoleDefinition(role: UserRole): RoleDefinition | undefined {
    return ROLE_DEFINITIONS.find((r) => r.name === role);
  }

  public getAllPermissions(): Permission[] {
    return [...ALL_PERMISSIONS];
  }

  public getDefaultPermissionsForRole(role: UserRole): Permission[] {
    return [...(DEFAULT_ROLE_PERMISSIONS[role] || [])];
  }

  public getAvailableUsers(): User[] {
    return this.tenantWorkspaceService.getUsers();
  }

  public getWorkspaceUsers(workspaceId?: string): User[] {
    const wsId = workspaceId || this.tenantWorkspaceService.getActiveWorkspaceId();
    return this.tenantWorkspaceService.getWorkspaceUsers(wsId);
  }

  public resetToDefaults(): void {
    this.simulatedRoleSubject.next(null);
    localStorage.removeItem(this.STORAGE_USER_KEY);
    this.initCurrentUser();
  }
}
