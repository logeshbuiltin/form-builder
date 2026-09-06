import { TestBed } from '@angular/core/testing';
import { TemplateVersionService } from './template-version.service';
import { TemplateStoreService } from '../../data/service/template-store.service';
import { RbacService } from './rbac.service';
import { TenantWorkspaceService } from './tenant-workspace.service';
import { ClinicalWorkflowService } from '../../data/service/clinical-workflow.service';
import { TemplateDefinition } from '../../data/model/template.model';

describe('TemplateVersionService (Phase 13: Versioning)', () => {
  let service: TemplateVersionService;
  let templateStore: TemplateStoreService;
  let rbacService: RbacService;

  const testTemplate: TemplateDefinition = {
    id: 'test_clinical_protocol',
    name: 'Standard Clinical Assessment Protocol',
    category: 'healthcare',
    status: 'published',
    version: 1,
    html: '<div><h1>Clinical Protocol v1</h1><p>Patient Name: {{patient.name}}</p></div>',
    css: 'h1 { color: #1e3a8a; }',
    dataSchema: { patient: { name: 'string' } },
    sampleData: { patient: { name: 'Jane Doe' } },
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        TemplateVersionService,
        TemplateStoreService,
        RbacService,
        TenantWorkspaceService,
        ClinicalWorkflowService,
      ],
    });
    service = TestBed.inject(TemplateVersionService);
    templateStore = TestBed.inject(TemplateStoreService);
    rbacService = TestBed.inject(RbacService);

    templateStore.save({ ...testTemplate });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created and auto-migrate legacy template to have v1 version', () => {
    expect(service).toBeTruthy();
    const versions = service.getVersions('test_clinical_protocol');
    expect(versions.length).toBe(1);
    expect(versions[0].versionNumber).toBe(1);
    expect(versions[0].status).toBe('published');
    expect(versions[0].html).toContain('Clinical Protocol v1');
  });

  it('should create a new draft version (v2) from current published version', () => {
    const draft = service.createDraftVersion(
      'test_clinical_protocol',
      'Added secondary symptoms section'
    );

    expect(draft).toBeDefined();
    expect(draft.versionNumber).toBe(2);
    expect(draft.status).toBe('draft');
    expect(draft.changeLog).toContain('Added secondary symptoms');

    const versions = service.getVersions('test_clinical_protocol');
    expect(versions.length).toBe(2);
    expect(versions[0].versionNumber).toBe(2); // Sorted descending
    expect(versions[1].versionNumber).toBe(1);
  });

  it('should transition draft to review status', () => {
    service.createDraftVersion('test_clinical_protocol', 'Work in progress');
    const inReview = service.submitForReview(
      'test_clinical_protocol',
      2,
      'Ready for Medical Director review'
    );

    expect(inReview.status).toBe('review');
    expect(inReview.reviewNotes).toBe('Ready for Medical Director review');

    const updated = service.getVersion('test_clinical_protocol', 2);
    expect(updated?.status).toBe('review');
  });

  it('should reject a review and return version to draft with feedback', () => {
    service.createDraftVersion('test_clinical_protocol', 'Work in progress');
    service.submitForReview('test_clinical_protocol', 2);

    const rejected = service.rejectReview(
      'test_clinical_protocol',
      2,
      'Missing ICD-10 code classification requirement'
    );

    expect(rejected.status).toBe('draft');
    expect(rejected.reviewNotes).toContain('Missing ICD-10 code');
  });

  it('should approve and publish a version when permitted, superseding prior published version', () => {
    service.createDraftVersion('test_clinical_protocol', 'Major update');
    service.submitForReview('test_clinical_protocol', 2);

    const published = service.approveAndPublish(
      'test_clinical_protocol',
      2,
      'Approved for hospital-wide clinical deployment'
    );

    expect(published.status).toBe('published');
    expect(published.publishedAt).toBeDefined();

    const parentTemplate = templateStore.getById('test_clinical_protocol');
    expect(parentTemplate?.version).toBe(2);
    expect(parentTemplate?.status).toBe('published');

    const v1 = service.getVersion('test_clinical_protocol', 1);
    expect(v1?.status).toBe('archived'); // Prior version superseded
  });

  it('should deny publishing when user lacks template:publish permission', () => {
    service.createDraftVersion('test_clinical_protocol', 'Draft update');
    service.submitForReview('test_clinical_protocol', 2);

    // Simulate healthcare_staff (who lacks template:publish)
    rbacService.simulateRole('healthcare_staff');

    expect(() => {
      service.approveAndPublish('test_clinical_protocol', 2);
    }).toThrowError(/template:publish/);
  });

  it('should roll back to an earlier historical version', () => {
    service.createDraftVersion('test_clinical_protocol', 'Experimental draft');
    const tpl = templateStore.getById('test_clinical_protocol')!;
    tpl.html = '<div><h1>Broken Experimental Layout</h1></div>';
    templateStore.save(tpl);

    const rolledBack = service.rollbackToVersion('test_clinical_protocol', 1);
    expect(rolledBack.versionNumber).toBe(1);

    const activeTemplate = templateStore.getById('test_clinical_protocol');
    expect(activeTemplate?.version).toBe(1);
    expect(activeTemplate?.html).toContain('Clinical Protocol v1');
  });

  it('should archive a specific version and archive an entire template', () => {
    service.createDraftVersion('test_clinical_protocol', 'Temporary version');
    const archivedVer = service.archiveVersion('test_clinical_protocol', 2);
    expect(archivedVer.status).toBe('archived');

    const archivedTpl = service.archiveTemplate('test_clinical_protocol');
    expect(archivedTpl.status).toBe('archived');
    const allVersions = service.getVersions('test_clinical_protocol');
    expect(allVersions.every((v) => v.status === 'archived')).toBeTrue();
  });

  it('should compare two versions and generate a structured diff summary', () => {
    service.createDraftVersion('test_clinical_protocol', 'Added allergies field');
    const v2Tpl = templateStore.getById('test_clinical_protocol')!;
    v2Tpl.html = '<div><h1>Clinical Protocol v1</h1><p>Patient Name: {{patient.name}}</p><p>Allergies: {{patient.allergies}}</p></div>';
    v2Tpl.dataSchema = { patient: { name: 'string', allergies: 'string' } };
    templateStore.save(v2Tpl);

    const diff = service.compareVersions('test_clinical_protocol', 1, 2);
    expect(diff.templateId).toBe('test_clinical_protocol');
    expect(diff.versionA).toBe(1);
    expect(diff.versionB).toBe(2);
    expect(diff.htmlDiff.hasChanges).toBeTrue();
    expect(diff.htmlDiff.addedLinesCount).toBeGreaterThanOrEqual(1);
    expect(diff.schemaDiff.hasChanges).toBeTrue();
  });
});
