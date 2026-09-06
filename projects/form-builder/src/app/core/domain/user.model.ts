/**
 * Core Domain Model: User, Role & Permissions
 * Generic RBAC supporting healthcare and enterprise access levels.
 */

export type UserRole =
  | 'owner'
  | 'admin'
  | 'template_designer'
  | 'healthcare_staff'
  | 'viewer'
  | 'api_client';

export type Permission =
  | 'template:view'
  | 'template:create'
  | 'template:edit'
  | 'template:publish'
  | 'template:delete'
  | 'document:generate'
  | 'document:view'
  | 'document:delete'
  | 'user:manage'
  | 'api_key:manage'
  | 'brand:manage'
  | 'workspace:manage'
  | 'audit:view';

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface User {
  id: string;
  organizationId: string;
  workspaceIds: string[];
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: Permission[];
  status: 'active' | 'inactive' | 'suspended';
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoleDefinition {
  name: UserRole;
  displayName: string;
  description: string;
  defaultPermissions: Permission[];
}

export const ALL_PERMISSIONS: Permission[] = [
  'template:view',
  'template:create',
  'template:edit',
  'template:publish',
  'template:delete',
  'document:generate',
  'document:view',
  'document:delete',
  'user:manage',
  'api_key:manage',
  'brand:manage',
  'workspace:manage',
  'audit:view',
];

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  owner: [
    'template:view',
    'template:create',
    'template:edit',
    'template:publish',
    'template:delete',
    'document:generate',
    'document:view',
    'document:delete',
    'user:manage',
    'api_key:manage',
    'brand:manage',
    'workspace:manage',
    'audit:view',
  ],
  admin: [
    'template:view',
    'template:create',
    'template:edit',
    'template:publish',
    'template:delete',
    'document:generate',
    'document:view',
    'document:delete',
    'user:manage',
    'api_key:manage',
    'brand:manage',
    'workspace:manage',
    'audit:view',
  ],
  template_designer: [
    'template:view',
    'template:create',
    'template:edit',
    'template:publish',
    'document:view',
    'brand:manage',
  ],
  healthcare_staff: [
    'template:view',
    'document:generate',
    'document:view',
  ],
  viewer: [
    'template:view',
    'document:view',
    'audit:view',
  ],
  api_client: [
    'template:view',
    'document:generate',
    'document:view',
  ],
};

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    name: 'owner',
    displayName: 'Organization Owner',
    description: 'Executive authority with full administrative access across all clinical departments, settings, and billing.',
    defaultPermissions: DEFAULT_ROLE_PERMISSIONS.owner,
  },
  {
    name: 'admin',
    displayName: 'Clinical Administrator',
    description: 'Department administrator managing workspaces, healthcare staff, API integrations, and template lifecycles.',
    defaultPermissions: DEFAULT_ROLE_PERMISSIONS.admin,
  },
  {
    name: 'template_designer',
    displayName: 'Template Designer',
    description: 'Clinical author creating, formatting, and publishing reusable medical document templates and brand assets.',
    defaultPermissions: DEFAULT_ROLE_PERMISSIONS.template_designer,
  },
  {
    name: 'healthcare_staff',
    displayName: 'Healthcare Staff (Doctor/Nurse/PT)',
    description: 'Physicians, nurses, and allied healthcare professionals generating and viewing patient records and forms.',
    defaultPermissions: DEFAULT_ROLE_PERMISSIONS.healthcare_staff,
  },
  {
    name: 'viewer',
    displayName: 'Medical Auditor / Viewer',
    description: 'Read-only access for medical coding auditors, compliance officers, and external inspectors.',
    defaultPermissions: DEFAULT_ROLE_PERMISSIONS.viewer,
  },
  {
    name: 'api_client',
    displayName: 'API / System Integration',
    description: 'Machine-to-machine service account for EHR/HIS automated document compilation and ingestion.',
    defaultPermissions: DEFAULT_ROLE_PERMISSIONS.api_client,
  },
];
