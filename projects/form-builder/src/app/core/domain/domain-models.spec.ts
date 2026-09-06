import {
  Template,
  TemplateVersion,
  Workspace,
  Organization,
  User,
  Document,
  Form,
  FormSubmission,
  DataSchema,
  Brand,
  Asset,
  AIRequest,
  AuditEvent
} from './index';

describe('Core Domain Models', () => {
  it('should instantiate a valid Organization and Workspace', () => {
    const org: Organization = {
      id: 'org_1',
      name: 'MediHealth Systems',
      slug: 'medihealth',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(org.id).toBe('org_1');

    const ws: Workspace = {
      id: 'ws_1',
      organizationId: org.id,
      name: 'Cardiology Clinic',
      slug: 'cardiology',
      industry: 'healthcare',
      defaultLanguage: 'en',
      defaultCountry: 'US',
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(ws.organizationId).toBe(org.id);
  });

  it('should instantiate a valid User with RBAC permissions', () => {
    const user: User = {
      id: 'usr_1',
      organizationId: 'org_1',
      workspaceIds: ['ws_1'],
      email: 'dr.muller@example.com',
      firstName: 'Hans',
      lastName: 'Müller',
      role: 'healthcare_staff',
      permissions: ['template:view', 'document:generate', 'document:view'],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(user.role).toBe('healthcare_staff');
    expect(user.permissions).toContain('document:generate');
  });

  it('should instantiate a generic Template with all Phase 1 attributes', () => {
    const template: Template = {
      id: 'tpl_101',
      name: 'Patient Intake Form',
      description: 'Standard adult intake form for outpatient clinic',
      category: 'Patient Forms',
      industry: 'healthcare',
      language: 'de',
      country: 'DE',
      version: 1,
      status: 'published',
      ownerId: 'usr_1',
      workspaceId: 'ws_1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      tags: ['intake', 'adult', 'outpatient', 'german'],
    };

    expect(template.id).toBe('tpl_101');
    expect(template.industry).toBe('healthcare');
    expect(template.language).toBe('de');
    expect(template.status).toBe('published');
    expect(template.tags).toHaveSize(4);
  });

  it('should instantiate a secure AuditEvent without sensitive clinical data', () => {
    const audit: AuditEvent = {
      id: 'aud_1',
      workspaceId: 'ws_1',
      actor: {
        id: 'usr_1',
        email: 'dr.muller@example.com',
        role: 'healthcare_staff',
      },
      action: 'document.generated',
      resourceType: 'document',
      resourceId: 'doc_555',
      timestamp: new Date().toISOString(),
      metadata: {
        format: 'pdf',
        pages: 2,
      },
    };

    expect(audit.action).toBe('document.generated');
    expect(audit.actor.email).toBe('dr.muller@example.com');
  });
});
