import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { FormBuilderComponent } from './form-builder.component';
import { SettingsData } from '../../../data/settings-data';
import { SystemMasterData } from '../../../data/model/system-master-data';
import { UserProfileService } from '../../../data/service/user-profile.service';

import { CategoryService } from '../../../core/services/category.service';
import { BrandService } from '../../../core/services/brand.service';

describe('FormBuilderComponent', () => {
  let component: FormBuilderComponent;
  let fixture: ComponentFixture<FormBuilderComponent>;
  let categoryService: CategoryService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        FormsModule,
        ReactiveFormsModule,
        TranslateModule.forRoot(),
      ],
      declarations: [FormBuilderComponent],
      providers: [
        MessageService,
        SettingsData,
        SystemMasterData,
        UserProfileService,
        CategoryService,
        BrandService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormBuilderComponent);
    component = fixture.componentInstance;
    categoryService = TestBed.inject(CategoryService);
    categoryService.resetToDefaults();
    component.documentService.resetToDefaults();
    component.tenantWorkspaceService.resetToDefaults();
    component.rbacService.resetToDefaults();
  });

  it('should instantiate FormBuilderComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should load configured Phase 4 categories on initialization', () => {
    component.loadConfiguredCategories();
    expect(component.configuredCategories.length).toBe(6);
    const catIds = component.configuredCategories.map((c) => c.id);
    expect(catIds).toContain('patient_forms');
    expect(catIds).toContain('clinical_documents');
    expect(catIds).toContain('dental');
    expect(catIds).toContain('physiotherapy');
    expect(catIds).toContain('laboratory');
    expect(catIds).toContain('administrative');
  });

  it('should filter templates when category is selected', () => {
    component.loadConfiguredCategories();
    component.selectCategory('patient_forms');
    expect(component.selectedDocumentCategory).toBe('patient_forms');

    // Filtered formats should match patient_forms
    expect(component.filteredDocumentFormats.length).toBeGreaterThan(0);
    for (const fmt of component.filteredDocumentFormats) {
      expect(categoryService.isFormatMatchingCategory(fmt.category, 'patient_forms')).toBeTrue();
    }
  });

  it('should filter templates by search query', () => {
    component.loadConfiguredCategories();
    component.selectedDocumentCategory = 'all';
    component.templateSearchQuery = 'Dental';
    component.filterTemplates();

    expect(component.filteredDocumentFormats.length).toBeGreaterThan(0);
    for (const fmt of component.filteredDocumentFormats) {
      const match = fmt.name.toLowerCase().includes('dental') || fmt.description.toLowerCase().includes('dental');
      expect(match).toBeTrue();
    }
  });

  it('should create and delete a custom category', () => {
    component.loadConfiguredCategories();
    component.initCategoryForms();
    component.categoryForm.setValue({
      id: 'telehealth',
      name: 'Telehealth Consultations',
      description: 'Virtual and remote video consultations',
      industry: 'healthcare',
      icon: 'fa fa-video-camera',
      badgeColor: '#06b6d4',
    });

    component.saveCategoryFromModal();
    const found = component.configuredCategories.find((c) => c.id === 'telehealth');
    expect(found).toBeDefined();
    expect(found?.name).toBe('Telehealth Consultations');

    if (found) {
      component.deleteCategoryFromModal(found);
      expect(component.configuredCategories.find((c) => c.id === 'telehealth')).toBeUndefined();
    }
  });

  describe('Phase 5: AI Template Search Integration', () => {
    it('should perform natural language AI search and populate response with ranked recommendations', () => {
      component.aiSearchQuery = 'I need a German physiotherapy initial assessment form for adults.';
      component.onAISearch();

      expect(component.pDialogAISearchResults).toBeTrue();
      expect(component.aiSearchResponse).toBeTruthy();
      expect(component.aiSearchResponse?.totalFound).toBeGreaterThan(0);
      expect(component.hasExtractedAttributes()).toBeTrue();

      const top = component.aiSearchResponse?.results[0];
      expect(top?.template.id).toBe('physio_assessment');
      expect(top?.matchReason).toContain('Physiotherapy');
    });

    it('should load template and close AI search results modal when useAISearchTemplate is called', () => {
      component.aiSearchQuery = 'Dental exam and treatment plan';
      component.onAISearch();

      expect(component.pDialogAISearchResults).toBeTrue();
      const topTemplate = component.aiSearchResponse!.results[0].template;

      spyOn(component, 'loadDocumentTemplate');
      component.useAISearchTemplate(topTemplate, 'replace');

      expect(component.loadDocumentTemplate).toHaveBeenCalledWith(topTemplate, 'replace');
      expect(component.pDialogAISearchResults).toBeFalse();
      expect(component.aiSearchQuery).toBe('');
    });
  });

  describe('Phase 6: AI Template Generation via Structured IR', () => {
    it('should open Create with AI dialog and generate IR for default or custom prompt', () => {
      component.openCreateWithAIDialog('Create a German physiotherapy patient intake form.');

      expect(component.pDialogCreateWithAI).toBeTrue();
      expect(component.aiGenPrompt).toBe('Create a German physiotherapy patient intake form.');
      expect(component.generatedIR).toBeTruthy();
      expect(component.generatedIR?.language).toBe('German');
      expect(component.compiledPreviewHtml).toContain('Physiotherapie');
      expect(component.irJsonView).toContain('ai_physio_intake_');
    });

    it('should generate structured IR conforming to Master Plan benchmark query', () => {
      component.aiGenPrompt = 'Create a German physiotherapy patient intake form.';
      component.generateWithAI();

      expect(component.generatedIR).not.toBeNull();
      const ir = component.generatedIR!;
      expect(ir.title).toContain('Physiotherapie');
      expect(ir.sections.length).toBeGreaterThanOrEqual(4);

      // Verify intermediate representation contains required medical structures
      const sectionTitles = ir.sections.map((s) => s.title);
      expect(sectionTitles.some((t) => t.includes('Patientendaten'))).toBeTrue();
      expect(sectionTitles.some((t) => t.includes('Anamnese') || t.includes('Befund'))).toBeTrue();

      // Verify compiled HTML contains variables and layout
      expect(component.compiledPreviewHtml).toContain('{{patient.name}}');
      expect(component.compiledPreviewHtml).toContain('Unterschrift');
    });

    it('should update prompt, domain, and language when preset is selected', () => {
      component.setAIGenPromptPreset('Pediatric dental examination and treatment plan');

      expect(component.aiGenLanguage).toBe('English');
      expect(component.aiGenIndustry).toBe('Dental');
      expect(component.generatedIR?.title).toContain('Dental');
      expect(component.compiledPreviewHtml).toContain('DENTAL CLINIC');
    });

    it('should apply generated IR template to canvas with extracted data schema', () => {
      component.aiGenPrompt = 'Create a German physiotherapy patient intake form.';
      component.generateWithAI();

      spyOn(component, 'loadDocumentTemplate');
      component.applyGeneratedTemplate('replace');

      expect(component.loadDocumentTemplate).toHaveBeenCalled();
      const loadedDoc = (component.loadDocumentTemplate as jasmine.Spy).calls.mostRecent().args[0];
      expect(loadedDoc.name).toContain('Physiotherapie');
      expect(loadedDoc.defaultHtml).toContain('{{patient.name}}');
      expect(component.pDialogCreateWithAI).toBeFalse();
    });
  });

  describe('Phase 7: Document Instance Layer & Generation Pipeline', () => {
    it('should open Document Instances Hub and populate seeded documents', () => {
      component.openDocumentInstancesDialog();

      expect(component.pDialogDocumentInstances).toBeTrue();
      expect(component.documentsList.length).toBeGreaterThanOrEqual(4);
      expect(component.getDocumentCountByStatus('signed')).toBeGreaterThan(0);
    });

    it('should filter documents by search query and status', () => {
      component.openDocumentInstancesDialog();

      // Filter by status
      component.docStatusFilter = 'reviewed';
      let filtered = component.getFilteredDocuments();
      expect(filtered.every((d) => d.status === 'reviewed')).toBeTrue();

      // Filter by patient search
      component.docStatusFilter = 'all';
      component.docSearchQuery = 'Sophie Weber';
      filtered = component.getFilteredDocuments();
      expect(filtered.length).toBe(1);
      expect(filtered[0].patientName).toBe('Sophie Weber');
    });

    it('should open Generate Document dialog and live-render preview from payload', () => {
      const format = component.documentFormats[0];
      component.openGenerateDocumentDialog(format);

      expect(component.pDialogGenerateDocument).toBeTrue();
      expect(component.docGenTitle).toContain(format.name);
      expect(component.docGenPayloadText).toBeTruthy();
      expect(component.docGenPreviewHtml).toBeTruthy();
    });

    it('should generate and store new document instance from data pipeline', () => {
      component.docGenTitle = 'Test Clinic Discharge - John Doe';
      component.docGenTemplateHtml = '<div class="test">Discharge for {{patient.name}}</div>';
      component.docGenPayloadText = JSON.stringify({ patient: { name: 'John Doe' } });
      component.docGenTemplateId = 'tmpl_test_discharge';

      component.generateAndSaveDocumentInstance();

      expect(component.pDialogGenerateDocument).toBeFalse();
      const docs = component.documentService.getDocuments();
      const generated = docs.find((d) => d.title === 'Test Clinic Discharge - John Doe');
      expect(generated).toBeDefined();
      expect(generated?.renderedHtml).toContain('Discharge for John Doe');
    });

    it('should load document instance onto editor canvas', () => {
      component.openDocumentInstancesDialog();
      const targetDoc = component.documentsList[0];

      const mockEditor = { setComponents: jasmine.createSpy('setComponents') };
      (component as any).grapeEditorService.editor = mockEditor;
      component.openDocumentInCanvas(targetDoc);

      expect(mockEditor.setComponents).toHaveBeenCalledWith(targetDoc.renderedHtml);
      expect(component.activeFormatName).toBe(targetDoc.title);
      expect(component.pDialogDocumentInstances).toBeFalse();
    });

    it('should transition document status and remove document on delete', () => {
      component.openDocumentInstancesDialog();
      const targetDoc = component.documentsList[0];

      // Change status to signed
      component.changeDocumentStatus(targetDoc, 'signed');
      let updated = component.documentService.getDocumentById(targetDoc.id);
      expect(updated?.status).toBe('signed');
      expect(updated?.signedBy).toBe('Dr. Clinician');

      // Delete document
      const initialCount = component.documentsList.length;
      component.deleteDocumentInstance(targetDoc);
      expect(component.documentsList.length).toBe(initialCount - 1);
    });
  });

  describe('Phase 8: Export & Document Generation / PDF Pipeline', () => {
    it('should open PDF export dialog and populate preview HTML', () => {
      const mockHtml = '<div class="intake-form"><h1>Patient Aufnahme</h1></div>';
      component.openPdfExportDialog(mockHtml, 'Patient Aufnahme Form');

      expect(component.pDialogPdfExport).toBeTrue();
      expect(component.pdfTargetContentHtml).toBe(mockHtml);
      expect(component.pdfExportOptions.documentTitle).toBe('Patient Aufnahme Form');
      expect(component.pdfPreviewHtml).toContain('Patient Aufnahme');
      expect(component.pdfPreviewHtml).toContain('@page');
    });

    it('should update preview HTML when export options change', () => {
      component.openPdfExportDialog('<p>Report details</p>', 'Clinical Summary');
      expect(component.pdfPreviewHtml).not.toContain('CONFIDENTIAL / VERTRAULICH');

      component.pdfExportOptions.watermark = 'confidential';
      component.pdfExportOptions.pageSize = 'Letter';
      component.pdfExportOptions.orientation = 'landscape';
      component.updatePdfPreview();

      expect(component.pdfPreviewHtml).toContain('CONFIDENTIAL / VERTRAULICH');
      expect(component.pdfPreviewHtml).toContain('Letter landscape');
    });

    it('should invoke triggerPrint and show toast notification on executePrint', () => {
      const printSpy = spyOn(component.pdfExportService, 'triggerPrint');
      component.openPdfExportDialog('<p>Print Body</p>', 'Doctor Note');
      component.executePrint();

      expect(printSpy).toHaveBeenCalledWith(
        '<p>Print Body</p>',
        component.pdfExportOptions
      );
    });

    it('should invoke exportStandalonePrintHtml on downloadPrintableHtml', () => {
      const exportSpy = spyOn(component.pdfExportService, 'exportStandalonePrintHtml');
      component.openPdfExportDialog('<p>Download HTML Content</p>', 'Discharge Packet');
      component.downloadPrintableHtml();

      expect(exportSpy).toHaveBeenCalledWith(
        '<p>Download HTML Content</p>',
        component.pdfExportOptions,
        'Discharge Packet'
      );
    });

    it('should open PDF export dialog from an existing document instance', () => {
      component.openDocumentInstancesDialog();
      const doc = component.documentsList[0];
      component.openPdfExportDialog(doc.renderedHtml, doc.title, doc);

      expect(component.pDialogPdfExport).toBeTrue();
      expect(component.pdfExportSourceDoc).toBe(doc);
      expect(component.pdfExportOptions.documentTitle).toBe(doc.title);
      expect(component.pdfPreviewHtml).toContain(doc.patientName || '');
    });
  });

  describe('Phase 9: API-First Architecture & Developer Portal', () => {
    beforeEach(() => {
      localStorage.removeItem('form_builder_api_keys_v1');
      localStorage.removeItem('form_builder_api_audit_logs_v1');
    });

    afterEach(() => {
      localStorage.removeItem('form_builder_api_keys_v1');
      localStorage.removeItem('form_builder_api_audit_logs_v1');
    });

    it('should open API portal dialog and initialize endpoints and default selection', () => {
      component.openApiPortal();

      expect(component.pDialogApiPortal).toBeTrue();
      expect(component.apiActiveTab).toBe('console');
      expect(component.apiEndpoints.length).toBe(8);
      expect(component.selectedApiEndpoint).toBeDefined();
      expect(component.selectedApiEndpoint?.path).toBe('/api/v1/documents/render');
      expect(component.apiRequestBodyText).toContain('physio_assessment');
      expect(component.selectedApiKey).toBeDefined();
    });

    it('should select endpoint and populate request body and code snippet', () => {
      component.openApiPortal();
      const listEndpoint = component.apiEndpoints.find((e) => e.path === '/api/v1/templates');
      expect(listEndpoint).toBeDefined();

      component.selectApiEndpoint(listEndpoint!);
      expect(component.selectedApiEndpoint).toBe(listEndpoint);
      expect(component.apiRequestBodyText).toBe('{}');
      expect(component.generatedCodeSnippet).toContain('/api/v1/templates');
    });

    it('should switch code snippet language and re-generate snippet', () => {
      component.openApiPortal();
      component.setApiSnippetLang('python');
      expect(component.apiSnippetLang).toBe('python');
      expect(component.generatedCodeSnippet).toContain('import requests');

      component.setApiSnippetLang('javascript');
      expect(component.apiSnippetLang).toBe('javascript');
      expect(component.generatedCodeSnippet).toContain('fetch(');
    });

    it('should execute API console request and display response', async () => {
      component.openApiPortal();
      await component.executeApiConsoleRequest();

      expect(component.apiResponseResult).toBeDefined();
      expect(component.apiResponseResult?.status).toBe(200);
      expect(component.apiResponseResult?.data.renderedHtml).toBeDefined();
      expect(component.apiResponseResult?.data.characterCount).toBeGreaterThan(0);
    });

    it('should manage API keys: create, select, revoke, and delete', () => {
      component.openApiPortal();
      component.openCreateApiKeyModal();
      expect(component.pDialogCreateApiKey).toBeTrue();

      component.newApiKeyName = 'Test Mobile App Integration';
      component.newApiKeyRateLimit = 150;
      component.submitCreateApiKey();

      expect(component.pDialogCreateApiKey).toBeFalse();
      expect(component.selectedApiKey?.name).toBe('Test Mobile App Integration');
      expect(component.selectedApiKey?.rateLimitPerMinute).toBe(150);

      const createdKey = component.selectedApiKey!;
      component.revokeApiKey(createdKey);
      expect(createdKey.status).toBe('revoked');

      component.deleteApiKey(createdKey);
      const keys = component.apiClientService.getApiKeys();
      expect(keys.find((k) => k.id === createdKey.id)).toBeUndefined();
    });
  });

  describe('Phase 10: Multi-Tenancy & Workspace Switcher', () => {
    beforeEach(() => {
      localStorage.removeItem('form_builder_tenancy_v1');
    });

    afterEach(() => {
      localStorage.removeItem('form_builder_tenancy_v1');
    });

    it('should open workspace switcher modal with loaded organizations and workspaces', () => {
      component.openWorkspaceSwitcher();

      expect(component.pDialogWorkspaceSwitcher).toBeTrue();
      expect(component.tenantOrganizations.length).toBeGreaterThanOrEqual(3);
      expect(component.activeWorkspace).toBeDefined();
      expect(component.activeWorkspace?.id).toBe('ws_default');
      expect(component.activeOrganization?.id).toBe('org_berlin_mitte');
      expect(component.currentWorkspaceUsers.length).toBeGreaterThan(0);
    });

    it('should switch workspace and reload isolated document instances', () => {
      component.openWorkspaceSwitcher();
      const physioWs = component.tenantWorkspaces.find((w) => w.id === 'ws_physio_reha');
      expect(physioWs).toBeDefined();

      component.selectWorkspace(physioWs!);

      expect(component.activeWorkspace?.id).toBe('ws_physio_reha');
      expect(component.pDialogWorkspaceSwitcher).toBeFalse();
      expect(component.apiWorkspaceIdHeader).toBe('ws_physio_reha');
    });

    it('should create new organization with default workspace', () => {
      component.openCreateOrgModal();
      expect(component.pDialogCreateOrganization).toBeTrue();

      component.newOrgName = 'Schweizer Privatklinik Genf';
      component.newOrgDescription = 'Private Healthcare Group';
      component.submitCreateOrg();

      expect(component.pDialogCreateOrganization).toBeFalse();
      expect(component.activeOrganization?.name).toBe('Schweizer Privatklinik Genf');
    });

    it('should create new workspace under selected organization', () => {
      component.openWorkspaceSwitcher();
      component.openCreateWorkspaceModal(component.activeOrganization!);
      expect(component.pDialogCreateWorkspace).toBeTrue();

      component.newWsName = 'Radiologie & MRT';
      component.newWsIndustry = 'healthcare';
      component.submitCreateWorkspace();

      expect(component.pDialogCreateWorkspace).toBeFalse();
      expect(component.activeWorkspace?.name).toBe('Radiologie & MRT');
    });
  });

  describe('Phase 11: Roles & Permissions (RBAC) UI', () => {
    it('should open RBAC center modal and load role definitions and team users', () => {
      component.openRbacCenter();
      expect(component.pDialogRbac).toBeTrue();
      expect(component.allRoleDefinitions.length).toBe(6);
      expect(component.allPermissionsList.length).toBe(13);
      expect(component.availableSimulatedUsers.length).toBeGreaterThanOrEqual(4);
      expect(component.activeUser).toBeDefined();
    });

    it('should switch active user and update role and permissions', () => {
      component.openRbacCenter();
      const staffUser = component.availableSimulatedUsers.find((u) => u.role === 'healthcare_staff');
      expect(staffUser).toBeDefined();

      component.selectSimulatedUser(staffUser!);
      expect(component.activeUserRole).toBe('healthcare_staff');
      expect(component.hasRbacPermission('document:generate')).toBeTrue();
      expect(component.hasRbacPermission('template:delete')).toBeFalse();
      expect(component.hasRbacPermission('workspace:manage')).toBeFalse();
    });

    it('should simulate roles on the fly and verify UI permission gates', () => {
      // Simulate Viewer
      component.simulateRole('viewer');
      expect(component.isSimulatingRole).toBeTrue();
      expect(component.activeUserRole).toBe('viewer');
      expect(component.hasRbacPermission('template:view')).toBeTrue();
      expect(component.hasRbacPermission('document:generate')).toBeFalse();
      expect(component.hasRbacPermission('template:edit')).toBeFalse();

      // Reset simulation
      component.resetRoleSimulation();
      expect(component.isSimulatingRole).toBeFalse();
    });

    it('should block template deletion and document generation if permission is denied', () => {
      component.simulateRole('viewer');

      // Attempt document generation as viewer -> should be blocked by RBAC guard
      component.docGenTitle = 'Unauthorized Clinical Record';
      component.generateAndSaveDocumentInstance();
      // Should not have stored new document because permission was denied
      const unauthDoc = component.documentService.getDocuments().find((d) => d.title === 'Unauthorized Clinical Record');
      expect(unauthDoc).toBeUndefined();

      // Reset simulation
      component.resetRoleSimulation();
    });
  });

  describe('Toolbar Categorization & Navigation Hubs', () => {
    it('should initialize with activeToolbarMenu as null', () => {
      expect(component.activeToolbarMenu).toBeNull();
    });

    it('should toggle category menus open and closed', () => {
      component.toggleCategoryMenu('templates');
      expect(component.activeToolbarMenu).toBe('templates');

      component.toggleCategoryMenu('templates');
      expect(component.activeToolbarMenu).toBeNull();
    });

    it('should switch between category menus seamlessly', () => {
      component.toggleCategoryMenu('templates');
      expect(component.activeToolbarMenu).toBe('templates');

      component.toggleCategoryMenu('clinical');
      expect(component.activeToolbarMenu).toBe('clinical');

      component.toggleCategoryMenu('documents');
      expect(component.activeToolbarMenu).toBe('documents');

      component.toggleCategoryMenu('platform');
      expect(component.activeToolbarMenu).toBe('platform');
    });

    it('should close active menu when closeCategoryMenu is called', () => {
      component.activeToolbarMenu = 'templates';
      component.closeCategoryMenu();
      expect(component.activeToolbarMenu).toBeNull();
    });

    it('should close active menu on Escape key press', () => {
      component.activeToolbarMenu = 'clinical';
      component.onEscapePress();
      expect(component.activeToolbarMenu).toBeNull();
    });

    it('should execute category action and close menu', () => {
      component.activeToolbarMenu = 'templates';
      spyOn(component, 'openCreateWithAIDialog');

      component.runCategoryAction('createWithAi');

      expect(component.activeToolbarMenu).toBeNull();
      expect(component.openCreateWithAIDialog).toHaveBeenCalled();
    });

    it('should dispatch corresponding methods for all category actions', () => {
      spyOn(component, 'openTemplateGallery');
      spyOn(component, 'openTemplateManager');
      spyOn(component, 'openVariableInserter');
      spyOn(component, 'openBrandSettings');
      spyOn(component, 'openPatientContext');
      spyOn(component, 'reviewClinicalDocument');
      spyOn(component, 'signClinicalDocument');
      spyOn(component, 'openAuditTrail');
      spyOn(component, 'openGenerateDocumentDialog');
      spyOn(component, 'openDocumentInstancesDialog');
      spyOn(component, 'openPdfExportDialog');
      spyOn(component, 'openDataPreview');
      spyOn(component, 'openWorkspaceSwitcher');
      spyOn(component, 'openRbacCenter');
      spyOn(component, 'openApiPortal');

      component.runCategoryAction('templateGallery');
      expect(component.openTemplateGallery).toHaveBeenCalled();

      component.runCategoryAction('templateManager');
      expect(component.openTemplateManager).toHaveBeenCalled();

      component.runCategoryAction('variableInserter');
      expect(component.openVariableInserter).toHaveBeenCalled();

      component.runCategoryAction('brandSettings');
      expect(component.openBrandSettings).toHaveBeenCalled();

      component.runCategoryAction('patientContext');
      expect(component.openPatientContext).toHaveBeenCalled();

      component.runCategoryAction('reviewClinical');
      expect(component.reviewClinicalDocument).toHaveBeenCalled();

      component.runCategoryAction('signClinical');
      expect(component.signClinicalDocument).toHaveBeenCalled();

      component.runCategoryAction('auditTrail');
      expect(component.openAuditTrail).toHaveBeenCalled();

      component.runCategoryAction('generateDocument');
      expect(component.openGenerateDocumentDialog).toHaveBeenCalled();

      component.runCategoryAction('documentInstances');
      expect(component.openDocumentInstancesDialog).toHaveBeenCalled();

      component.runCategoryAction('pdfExport');
      expect(component.openPdfExportDialog).toHaveBeenCalled();

      component.runCategoryAction('dataPreview');
      expect(component.openDataPreview).toHaveBeenCalled();

      component.runCategoryAction('workspaceSwitcher');
      expect(component.openWorkspaceSwitcher).toHaveBeenCalled();

      component.runCategoryAction('rbacCenter');
      expect(component.openRbacCenter).toHaveBeenCalled();

      component.runCategoryAction('apiPortal');
      expect(component.openApiPortal).toHaveBeenCalled();
    });

    it('should close menu on document click outside category dropdown', () => {
      component.activeToolbarMenu = 'templates';

      // Click outside
      const outsideDiv = document.createElement('div');
      document.body.appendChild(outsideDiv);
      const mouseEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(mouseEvent, 'target', { value: outsideDiv });

      component.onDocumentClick(mouseEvent);
      expect(component.activeToolbarMenu).toBeNull();
      document.body.removeChild(outsideDiv);
    });
  });

  describe('Phase 12: Brand Management Studio', () => {
    it('should open Brand Management studio and load organization brand profiles', () => {
      component.openBrandSettings();

      expect(component.pDialogBrandSettings).toBeTrue();
      expect(component.brandProfiles.length).toBeGreaterThanOrEqual(1);
      expect(component.brandPresets.length).toBeGreaterThanOrEqual(4);
      expect(component.selectedBrandProfile).toBeDefined();
      expect(component.brandForm.value.name).toBeDefined();
    });

    it('should apply brand presets into the active brand form', () => {
      component.openBrandSettings();
      component.applyBrandPreset('nordic_emerald');

      expect(component.brandForm.value.primaryColor).toBe('#059669');
      expect(component.brandForm.value.secondaryColor).toBe('#047857');
    });

    it('should save a new brand profile when permitted', () => {
      component.openBrandSettings();
      component.createNewBrandProfile();
      component.brandForm.patchValue({
        name: 'Tufts Pediatric Specialty Clinic',
        primaryColor: '#1d4ed8',
      });

      component.saveBrandProfile();

      expect(component.selectedBrandProfile?.name).toBe('Tufts Pediatric Specialty Clinic');
      const found = component.brandService.getBrands().find((b) => b.name === 'Tufts Pediatric Specialty Clinic');
      expect(found).toBeDefined();
    });

    it('should switch between brand profiles', () => {
      component.openBrandSettings();

      const chariteBrand = component.brandService.getBrands().find((b) => b.name.includes('Charité'));
      expect(chariteBrand).toBeDefined();

      component.selectBrandProfile(chariteBrand!);
      expect(component.selectedBrandProfile?.id).toBe(chariteBrand!.id);
      expect(component.brandForm.value.name).toContain('Charité');
    });

    it('should apply brand CSS styles to canvas', () => {
      component.openBrandSettings();
      component.brandForm.patchValue({
        primaryColor: '#8b5cf6',
        fontFamily: 'Montserrat, sans-serif',
      });

      component.applyBrandToActiveCanvas();

      expect(component.pDialogBrandSettings).toBeFalse();
    });
  });
});



