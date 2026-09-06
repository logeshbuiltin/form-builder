import { UserProfileService } from './../../../data/service/user-profile.service';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MessageService } from 'primeng/api';
import { environment } from 'projects/form-builder/src/environments/environment';
import { SystemMasterConstant } from '../../../common/constant/system-master-constant';
import { EditorSource } from '../../../common/enum/editor-source.enum';

import { Location } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { AppUtils } from '../../../common/app-utils';
import { EventAction } from '../../../common/enum/event-action.enum';
import { FormComponentType } from '../../../common/enum/form-component-type.enum';
import { AppGlobalConstant } from '../../../constants/app-global-constant';
import {
  EditorData,
  FormComponents,
  FormEditorDTO,
  FormEditorValue,
  FormEditorValueDto,
  FormEvent,
} from '../../../data/model/forms';
import { SystemMasterData } from '../../../data/model/system-master-data';
import { EditorBlockManagerService } from '../../../data/service/editor-block-manager.service';
import { FormService } from '../../../data/service/form.service';
import { GrapeEditorService } from '../../../data/service/grape-editor.service';
import { MasterService } from '../../../data/service/master.service';
import { SettingsData } from '../../../data/settings-data';
import { ApiCallBack } from '../../../http/callback/api-callback';
import { FileUpload } from 'primeng/fileupload';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { DOCUMENT_CATEGORIES, DOCUMENT_FORMATS } from '../../../data/constant/document-formats.constant';
import { DocumentCategory, DocumentCategoryId, DocumentFormat } from '../../../data/model/document-formats.model';
import { TemplateDefinition, TemplateStatus } from '../../../data/model/template.model';
import { TemplateVersion, VersionDiffResult } from '../../../core/domain/template.model';
import { TemplateVersionService } from '../../../core/services/template-version.service';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { AuditEvent, AuditFilterCriteria, AuditAction, AuditResourceType } from '../../../core/domain/audit-event.model';
import { SecurityFoundationService } from '../../../core/services/security-foundation.service';
import { PasswordValidationResult, SignedDocumentToken, SecurityAlert, SecurityPolicy } from '../../../core/domain/security.model';
import { TemplateRendererService } from '../../../data/service/template-renderer.service';
import { TemplateStoreService } from '../../../data/service/template-store.service';
import { ClinicalAuditEvent, PatientContext } from '../../../data/model/clinical-document.model';
import { ClinicalWorkflowService } from '../../../data/service/clinical-workflow.service';
import { VariableItem, VariableScopeGroup, VariableSchemaService } from '../../../core/services/variable-schema.service';
import { CategoryService } from '../../../core/services/category.service';
import { CategoryDefinition, DocumentTypeDefinition } from '../../../core/domain/category.model';
import { AITemplateSearchService } from '../../../core/services/ai-template-search.service';
import { AISearchResponse } from '../../../core/domain/ai-request.model';
import { AITemplateGenerationService } from '../../../core/services/ai-template-generation.service';
import { TemplateIR } from '../../../core/domain/template-ir.model';
import { DocumentService } from '../../../core/services/document.service';
import { Document as DocumentInstance, DocumentStatus, BatchDocumentGenerationResult } from '../../../core/domain/document.model';
import { DataBindingEngine } from '../../../core/engine/data-binding-engine';
import {
  PdfExportService,
  PdfExportOptions,
  PageSize,
  PageOrientation,
  WatermarkType,
  MarginSize
} from '../../../core/services/pdf-export.service';
import { ApiClientService } from '../../../core/services/api-client.service';
import {
  ApiKey,
  ApiEndpointDefinition,
  ApiResponse,
  ApiAuditLog
} from '../../../core/domain/api-client.model';
import { TenantWorkspaceService } from '../../../core/services/tenant-workspace.service';
import { Organization, Workspace } from '../../../core/domain/workspace.model';
import {
  User,
  UserRole,
  Permission,
  RoleDefinition,
  ROLE_DEFINITIONS,
  ALL_PERMISSIONS
} from '../../../core/domain/user.model';
import { RbacService } from '../../../core/services/rbac.service';
import { BrandService } from '../../../core/services/brand.service';
import { Brand, BrandPreset } from '../../../core/domain/brand.model';

@Component({
  selector: 'app-form-builder',
  templateUrl: './form-builder.component.html',
  styleUrls: ['./form-builder.component.scss'],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormBuilderComponent implements OnInit, OnDestroy, ApiCallBack {
  isLoading = false;
  isLoad = false;
  aiSearchQuery: string = '';
  isAiFocused: boolean = false;
  editor: any;
  source: EditorSource;
  pDialogCustomLayout = false;
  pDialogDemographic = false;

  // Multi-Document Studio State (12 Formats)
  documentFormats: DocumentFormat[] = DOCUMENT_FORMATS;
  documentCategories: DocumentCategory[] = DOCUMENT_CATEGORIES;
  selectedDocumentCategory: DocumentCategoryId = 'all';
  filteredDocumentFormats: DocumentFormat[] = DOCUMENT_FORMATS;
  templateCategoryOptions = [
    { label: 'Category', value: 'all', icon: 'pi pi-th-large' },
    { label: 'Invoices & Billing', value: 'invoices', icon: 'pi pi-dollar' },
    { label: 'Reports & KPIs', value: 'reports', icon: 'pi pi-chart-bar' },
    { label: 'Medical & Clinical', value: 'medical', icon: 'pi pi-heart' },
    { label: 'Certificates & Awards', value: 'certificates', icon: 'pi pi-file' },
    { label: 'Restaurant Menus', value: 'menu', icon: 'pi pi-compass' },
    { label: 'Delivery & Logistics', value: 'delivery', icon: 'pi pi-box' },
    { label: 'Universal Document Blocks', value: 'universal', icon: 'pi pi-check-circle' },
    { label: 'HR Documents', value: 'hr', icon: 'pi pi-briefcase' },
    { label: 'Proposals & Bids', value: 'proposals', icon: 'pi pi-paperclip' },
  ];
  selectedTemplateCategory: string = 'all';
  templateSearchQuery: string = '';
  pDialogTemplateGallery: boolean = false;
  // Phase 4: Configurable Category Taxonomy & Document Types
  configuredCategories: CategoryDefinition[] = [];
  selectedDocumentType: string = 'all';
  pDialogManageCategories: boolean = false;
  pDialogAddCategory: boolean = false;
  pDialogAddDocType: boolean = false;
  selectedCategoryForDocType: CategoryDefinition | null = null;
  categoryForm: FormGroup;
  docTypeForm: FormGroup;
  // Phase 5: AI Template Search State
  pDialogAISearchResults: boolean = false;
  aiSearchResponse: AISearchResponse | null = null;
  selectedTemplateForPreview: DocumentFormat | null = null;
  // Phase 6: Create with AI (Structured Intermediate Representation)
  pDialogCreateWithAI: boolean = false;
  aiGenPrompt: string = 'Create a German physiotherapy patient intake form.';
  aiGenIndustry: string = 'Physiotherapy';
  aiGenLanguage: 'English' | 'German' = 'German';
  generatedIR: TemplateIR | null = null;
  compiledPreviewHtml: string = '';
  irJsonView: string = '';
  isGeneratingWithAI: boolean = false;
  aiGenActiveTab: 'preview' | 'ir' = 'preview';
  // Phase 7: Document Instance Layer & Generation Pipeline
  pDialogDocumentInstances: boolean = false;
  pDialogGenerateDocument: boolean = false;
  pDialogBatchGenerate: boolean = false;
  pDialogDocumentView: boolean = false;
  documentsList: DocumentInstance[] = [];
  selectedDocumentForView: DocumentInstance | null = null;
  docSearchQuery: string = '';
  docStatusFilter: string = 'all';
  docGenTitle: string = '';
  docGenPayloadText: string = '';
  docGenPreviewHtml: string = '';
  docGenTemplateHtml: string = '';
  docGenTemplateName: string = '';
  docGenTemplateId: string = '';
  docGenCategory: string = 'clinical_documents';
  batchRecordsJson: string = '';
  batchTitlePattern: string = 'Document - {{patient.name}}';
  batchResult: BatchDocumentGenerationResult | null = null;
  batchTemplateHtml: string = '';
  batchTemplateName: string = '';
  batchTemplateId: string = '';
  // Phase 8: Export & Document Generation / PDF Pipeline
  pDialogPdfExport: boolean = false;
  pdfExportOptions: PdfExportOptions = {
    pageSize: 'A4',
    orientation: 'portrait',
    margins: 'normal',
    includeHeader: true,
    includeFooter: true,
    includePageNumbers: true,
    watermark: 'none',
    customWatermarkText: '',
    includeVerificationQr: true,
    verificationCode: 'VERIFIED-DOC-2026',
    includeBarcode: true,
    barcodeValue: 'MRN-2026-98214',
    documentTitle: 'Healthcare Clinical Record',
    organizationName: 'HEALTHCARE MEDICAL NETWORK',
    footerNote: 'Confidential Medical Record. Unauthorized duplication or disclosure prohibited under DSGVO / EU-GDPR.'
  };
  pdfTargetContentHtml: string = '';
  pdfPreviewHtml: string = '';
  pdfExportSourceDoc: DocumentInstance | null = null;
  pageSizeOptions: { label: string; value: PageSize }[] = [
    { label: 'A4 (210 × 297 mm)', value: 'A4' },
    { label: 'US Letter (8.5 × 11 in)', value: 'Letter' },
    { label: 'US Legal (8.5 × 14 in)', value: 'Legal' },
    { label: 'Receipt Slip (80 mm roll)', value: 'Receipt' }
  ];
  pageOrientationOptions: { label: string; value: PageOrientation; icon: string }[] = [
    { label: 'Portrait', value: 'portrait', icon: 'pi pi-file' },
    { label: 'Landscape', value: 'landscape', icon: 'pi pi-window-maximize' }
  ];
  watermarkOptions: { label: string; value: WatermarkType }[] = [
    { label: 'None', value: 'none' },
    { label: 'Confidential / Vertraulich', value: 'confidential' },
    { label: 'Draft / Entwurf', value: 'draft' },
    { label: 'Copy / Duplikat', value: 'copy' },
    { label: 'Medical Record (PHI)', value: 'medical_record' },
    { label: 'Custom Watermark...', value: 'custom' }
  ];
  marginOptions: { label: string; value: MarginSize }[] = [
    { label: 'Normal (15mm)', value: 'normal' },
    { label: 'Compact (8mm)', value: 'compact' },
    { label: 'Wide (25mm)', value: 'wide' }
  ];
  // Phase 9: API-First Architecture & Developer Studio
  pDialogApiPortal: boolean = false;
  apiActiveTab: 'console' | 'keys' | 'snippets' | 'audit' = 'console';
  apiEndpoints: ApiEndpointDefinition[] = [];
  selectedApiEndpoint: ApiEndpointDefinition | null = null;
  selectedApiKey: ApiKey | null = null;
  apiRequestBodyText: string = '';
  apiWorkspaceIdHeader: string = 'ws_default';
  apiResponseResult: ApiResponse | null = null;
  isExecutingApiRequest: boolean = false;
  apiSnippetLang: 'curl' | 'javascript' | 'python' = 'curl';
  generatedCodeSnippet: string = '';
  pDialogCreateApiKey: boolean = false;
  newApiKeyName: string = '';
  newApiKeyWorkspace: string = 'ws_default';
  newApiKeyRateLimit: number = 60;
  createdApiKeyNotice: ApiKey | null = null;
  // Phase 10: Multi-Tenancy & Workspace Isolation State
  pDialogWorkspaceSwitcher: boolean = false;
  pDialogCreateOrganization: boolean = false;
  pDialogCreateWorkspace: boolean = false;
  activeWorkspace: Workspace | null = null;
  activeOrganization: Organization | null = null;
  tenantOrganizations: Organization[] = [];
  tenantWorkspaces: Workspace[] = [];
  selectedOrgForWorkspaceView: Organization | null = null;
  currentWorkspaceUsers: User[] = [];
  newOrgName: string = '';
  newOrgDescription: string = '';
  newWsName: string = '';
  newWsDescription: string = '';
  newWsIndustry: string = 'healthcare';
  newWsLanguage: string = 'de';
  newWsCountry: string = 'DE';
  // Phase 11: Roles & Permissions (RBAC) State
  pDialogRbac: boolean = false;
  activeUser: User | null = null;
  activeUserRole: UserRole | null = null;
  activePermissions: Permission[] = [];
  allRoleDefinitions: RoleDefinition[] = ROLE_DEFINITIONS;
  allPermissionsList: Permission[] = ALL_PERMISSIONS;
  availableSimulatedUsers: User[] = [];
  isSimulatingRole: boolean = false;
  genericTemplates: TemplateDefinition[] = [];
  activeGenericTemplate: TemplateDefinition | null = null;
  pDialogTemplateManager = false;
  pDialogTemplateDetails = false;
  pDialogDataPreview = false;
  templateName = '';
  templateCategory = 'healthcare';
  templateStatus: TemplateStatus = 'draft';
  templateSchemaText = '{\n  "patient": { "name": "string" },\n  "items": [{ "name": "string", "amount": "number" }]\n}';
  previewDataText = '{\n  "patient": { "name": "Avery Johnson", "mrn": "MRN-1042" },\n  "invoice": { "total": "$1,250.00" },\n  "items": [{ "name": "Consultation", "amount": "$250.00" }, { "name": "Lab panel", "amount": "$1,000.00" }]\n}';
  templateError = '';
  pDialogPatientContext = false;
  pDialogAudit = false;
  patientContextForm: FormGroup;
  clinicalAudit: ClinicalAuditEvent[] = [];
  clinicalDocumentStatus: 'draft' | 'reviewed' | 'signed' = 'draft';

  // Phase 14: Enterprise Audit Trail & Compliance State
  auditEvents: AuditEvent[] = [];
  filteredAuditEvents: AuditEvent[] = [];
  auditSearchTerm: string = '';
  auditSelectedAction: string = 'all';
  auditSelectedResourceType: string = 'all';
  auditSelectedDateRange: 'all' | 'today' | '7d' | '30d' = 'all';
  auditSelectedEventForMetadata: AuditEvent | null = null;
  pDialogAuditMetadata: boolean = false;

  // Phase 15: Security Foundation & Privacy Shield State
  pDialogSecurityCenter: boolean = false;
  securityActiveTab: 'overview' | 'phiShield' | 'password' | 'documentTokens' | 'alerts' = 'overview';
  securityTestInputText: string = 'Patient named Robert Vance (MRN-90211, SSN 123-45-6789) diagnosed with Type 2 Diabetes.';
  securityTestOutputText: string = '';
  securityTestPhiDetected: boolean = false;
  securityTestMaskedFields: string[] = [];
  securityTestPasswordInput: string = 'ClinicStaff#2026';
  securityPasswordResult: PasswordValidationResult | null = null;
  securityGeneratedSalt: string = '';
  securityGeneratedHash: string = '';
  securityDocTokenId: string = 'DOC-CLINICAL-001';
  securityDocTokenDurationMinutes: number = 15;
  securityDocTokenPurpose: 'view' | 'download' | 'print' = 'view';
  securityGeneratedDocToken: SignedDocumentToken | null = null;
  securityDocTokenVerification: { valid: boolean; reason?: string } | null = null;
  securityAlertsList: SecurityAlert[] = [];

  get securityPolicy(): SecurityPolicy {
    return this.securityService.defaultPolicy;
  }

  currentLang: 'English' | 'German' = 'English';
  canvasLayoutMode: 'free' | 'a4-portrait' | 'a4-landscape' | 'receipt' = 'free';
  activeFormatName: string = 'Multi-Document Studio';
  // Phase 2: Schema-Driven Variables & Branding State
  pDialogInsertVariable: boolean = false;
  pDialogBrandSettings: boolean = false;
  variableScopes: VariableScopeGroup[] = [];
  selectedVariableScope: string = 'all';
  variableSearchQuery: string = '';
  filteredVariables: VariableItem[] = [];
  customVarForm: FormGroup;
  brandForm: FormGroup;
  // Phase 12: Brand Management State
  brandProfiles: Brand[] = [];
  selectedBrandProfile: Brand | null = null;
  activeBrandTab: 'colors' | 'typography' | 'logo' | 'headers' | 'legal' = 'colors';
  brandPresets: BrandPreset[] = [];

  // Phase 13: Versioning & Governance Lifecycle State
  pDialogVersionManager: boolean = false;
  activeVersionTemplate: TemplateDefinition | null = null;
  templateVersions: TemplateVersion[] = [];
  selectedVersion: TemplateVersion | null = null;
  compareVersionA: number = 1;
  compareVersionB: number = 1;
  versionDiffResult: VersionDiffResult | null = null;
  versionReviewNotes: string = '';
  versionChangeLog: string = '';
  versionRejectReason: string = '';
  activeVersionTab: 'timeline' | 'diff' | 'audit' = 'timeline';
  public Object = Object;
  availableFonts = [
    { label: 'Inter (Modern Clean Sans)', value: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
    { label: 'Roboto (Geometric Sans)', value: '"Roboto", Arial, sans-serif' },
    { label: 'Montserrat (Premium Brand)', value: '"Montserrat", Arial, sans-serif' },
    { label: 'Open Sans (Neutral Technical)', value: '"Open Sans", Arial, sans-serif' },
    { label: 'Merriweather (Classic Editorial Serif)', value: '"Merriweather", Georgia, serif' },
    { label: 'Courier Prime (Monospace / Clinical)', value: '"Courier Prime", Courier, monospace' },
  ];
  availableFontSizes = [
    { label: '12px — Compact Print', value: '12px' },
    { label: '13px — Clinical Standard', value: '13px' },
    { label: '14px — Default SaaS', value: '14px' },
    { label: '16px — Large Accessible', value: '16px' },
  ];

  demographicForm: FormGroup;
  demographicTypes = [
    { label: 'Text Input', value: 'text' },
    { label: 'Number Input', value: 'number' },
    { label: 'Date Picker', value: 'date' },
    { label: 'Dropdown / Select', value: 'select' },
    { label: 'Textarea / Notes', value: 'textarea' },
    { label: 'Plain Label', value: 'label' },
  ];
  demographicIcons = [
    { label: 'User / Person', value: 'fa fa-user' },
    { label: 'Phone', value: 'fa fa-phone' },
    { label: 'Email', value: 'fa fa-envelope' },
    { label: 'ID Card', value: 'fa fa-id-card' },
    { label: 'Heart / Vitals', value: 'fa fa-heartbeat' },
    { label: 'Hospital / Clinic', value: 'fa fa-hospital-o' },
    { label: 'Calendar', value: 'fa fa-calendar' },
    { label: 'Address / Location', value: 'fa fa-map-marker' },
    { label: 'Tag / Notes', value: 'fa fa-tag' },
  ];
  selectedFormComponent: FormComponents;

  selectedFormTemplate: FormEvent;

  customLayoutForm: FormGroup;
  scriptForm: FormGroup;
  isFormSubmit = false;

  customLayouts: FormComponents[] = [];

  blockedDocument = true;
  formId: any;
  navigateToPrintList: any;
  disableAssessmentForm: boolean = false;

  importWithScriptsDialog: boolean = false;
  importHTMLScript: any = "";

  formScripts: string = "";
  scripts = [];

  scriptHead;
  scriptBody;

  editorData: any = null;
  pDialogAddScript: boolean = false;
  scriptData: any[] = [];
  isEdit: boolean = false;
  newScriptUrl: any = null;
  @ViewChild('fileUpload') fileUpload!: FileUpload;
  isDelete: boolean = false;

  /**
   * Timeout configuration for various async operations.
   * These delays allow the GrapesJS editor to be fully initialized before loading data.
   */
  private readonly TIMEOUT_CONFIG = {
    /** Delay before loading project data into editor to ensure DOM is ready */
    EDITOR_DATA_LOAD: 1000,
    /** Delay before collapsing editor blocks to allow UI to stabilize */
    EDITOR_BLOCK_COLLAPSE: 1000,
  } as const;

  /**
   * Subject for managing component destruction and subscription cleanup
   */
  private readonly destroy$ = new Subject<void>();

  /**
   * Array to track all setTimeout IDs for cleanup on destroy
   */
  private readonly timeoutIds: number[] = [];

  constructor(
    private grapeEditorService: GrapeEditorService,
    public settingsData: SettingsData,

    private editorBlockManagerService: EditorBlockManagerService,
    private location: Location,
    private profileService: UserProfileService,
    private systemMasterData: SystemMasterData,
    private masterService: MasterService,
    //
    private fb: FormBuilder,
    private formService: FormService,
    private messageService: MessageService,
    public sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private templateStore: TemplateStoreService,
    private templateRenderer: TemplateRendererService,
    private clinicalWorkflow: ClinicalWorkflowService,
    public translate: TranslateService,
    public variableService: VariableSchemaService,
    public categoryService: CategoryService,
    public aiSearchService: AITemplateSearchService,
    public aiGenService: AITemplateGenerationService,
    public documentService: DocumentService,
    public pdfExportService: PdfExportService,
    public apiClientService: ApiClientService,
    public tenantWorkspaceService: TenantWorkspaceService,
    public rbacService: RbacService,
    public brandService: BrandService,
    public templateVersionService: TemplateVersionService,
    public auditLogService: AuditLogService,
    public securityService: SecurityFoundationService
  ) { }

  ngOnInit(): void {
    const savedLang = (localStorage.getItem('form_builder_lang') as 'English' | 'German') || 'English';
    this.currentLang = savedLang;
    this.translate.setDefaultLang('English');
    this.translate.use(savedLang);
    this.updateCategoryOptions(savedLang);
    this.loadConfiguredCategories();
    this.initCategoryForms();
    this.initBrandForm();

    // Phase 12: Brand Management Observable
    this.brandService.activeBrand$
      .pipe(takeUntil(this.destroy$))
      .subscribe((brand) => {
        if (brand && (!this.selectedBrandProfile || this.selectedBrandProfile.id === brand.id)) {
          this.selectBrandProfile(brand);
        }
        this.cdr.markForCheck();
      });

    // Phase 11: Roles & Permissions (RBAC) Observables
    this.rbacService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.activeUser = user;
        this.activeUserRole = this.rbacService.getCurrentRole();
        this.activePermissions = this.rbacService.getCurrentPermissions();
        this.availableSimulatedUsers = this.rbacService.getAvailableUsers();
        this.isSimulatingRole = this.rbacService.isSimulating();
        this.cdr.markForCheck();
      });

    this.rbacService.simulatedRole$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.activeUserRole = this.rbacService.getCurrentRole();
        this.activePermissions = this.rbacService.getCurrentPermissions();
        this.isSimulatingRole = this.rbacService.isSimulating();
        this.cdr.markForCheck();
      });

    // Phase 10: Multi-Tenancy Observables
    this.tenantWorkspaceService.activeOrganization$
      .pipe(takeUntil(this.destroy$))
      .subscribe((org) => {
        this.activeOrganization = org;
        if (!this.selectedOrgForWorkspaceView && org) {
          this.selectedOrgForWorkspaceView = org;
        }
        if (org) {
          this.pdfExportOptions.organizationName = org.name;
        }
        this.cdr.markForCheck();
      });

    this.tenantWorkspaceService.activeWorkspace$
      .pipe(takeUntil(this.destroy$))
      .subscribe((ws) => {
        this.activeWorkspace = ws;
        if (ws) {
          this.apiWorkspaceIdHeader = ws.id;
          this.currentWorkspaceUsers = this.tenantWorkspaceService.getWorkspaceUsers(ws.id);
          this.loadDocumentInstances();
        }
        this.cdr.markForCheck();
      });

    this.tenantWorkspaceService.organizations$
      .pipe(takeUntil(this.destroy$))
      .subscribe((orgs) => {
        this.tenantOrganizations = orgs;
        this.cdr.markForCheck();
      });

    this.tenantWorkspaceService.workspaces$
      .pipe(takeUntil(this.destroy$))
      .subscribe((workspaces) => {
        this.tenantWorkspaces = workspaces;
        this.cdr.markForCheck();
      });

    // Phase 15: Security Foundation & Privacy Shield Alerts
    this.securityService.securityAlerts$
      .pipe(takeUntil(this.destroy$))
      .subscribe((alerts) => {
        this.securityAlertsList = alerts;
        this.cdr.markForCheck();
      });

    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.source = params['source'] || EditorSource.ASSESSMENT_FORM;

        if (params['selectedItem']) {
          try {
            const decoded = JSON.parse(atob(params['selectedItem']));
            switch (this.source) {
              case EditorSource.ASSESSMENT_FORM:
                this.selectedFormTemplate = decoded;
                this.selectedFormComponent = null;
                break;
              case EditorSource.CUSTOM_LAYOUT:
              case EditorSource.EMR_COMPONENT:
                this.selectedFormComponent = decoded;
                this.selectedFormTemplate = null;
                break;
            }
          } catch (e) {
            console.warn('Could not decode selectedItem from params:', e);
          }
        }

        // initialize the editor
        this.grapeEditorService.editor = this.grapeEditorService.initialize();

        // setting the open code(modify the html) to the editor
        this.grapeEditorService.setOpenCode(this.grapeEditorService.editor);

        // set the trait for dependent
        this.grapeEditorService.addTraits(this.grapeEditorService.editor);

        // add the UOM to editor block
        this.editorBlockManagerService.addUOMBlock(
          this.grapeEditorService.editor
        );

        // add the custom forms category and templates to editor block
        this.editorBlockManagerService.addCustomFormsToBlock(
          this.grapeEditorService.editor
        );

        // Clean up ready templates from GrapeJS components panel
        this.editorBlockManagerService.removeReadyTemplatesFromBlock(
          this.grapeEditorService.editor
        );

        // add the masters to editor block
        this.editorBlockManagerService.addMastersToBlock(
          this.grapeEditorService.editor
        );

        // add the demographic items to editor block
        this.editorBlockManagerService.addDemographicItemsToBlock(
          this.grapeEditorService.editor
        );

        // Click listener on GrapesJS block panel for "+ Add Field" block in Demographics
        const handleDemoBlockClick = (ev: MouseEvent) => {
          const target = (ev.target as HTMLElement)?.closest('.gjs-block');
          if (target) {
            const title = target.getAttribute('title') || '';
            const blockId = target.getAttribute('data-id') || '';
            const label = target.querySelector('.gjs-block-label')?.textContent || '';
            if (blockId === 'NewCustomDemographicField' || label.includes('+ Add Field') || title.includes('custom demographic')) {
              this.ngZone.run(() => {
                this.openDemographicDialog();
              });
            }
          }
        };
        document.addEventListener('click', handleDemoBlockClick);
        this.destroy$.subscribe(() => {
          document.removeEventListener('click', handleDemoBlockClick);
        });

        this.editorBlockManagerService.addDataBindingBlocks(this.grapeEditorService.editor);
        this.editorBlockManagerService.addClinicalBindingBlocks(this.grapeEditorService.editor);
        this.editorBlockManagerService.addDocumentStructureBlocks(this.grapeEditorService.editor);
        this.genericTemplates = this.templateStore.list();

        // Load custom layouts from local storage
        try {
          const localLayouts = localStorage.getItem('form_builder_custom_layouts');
          if (localLayouts) {
            const parsed = JSON.parse(localLayouts);
            if (Array.isArray(parsed) && parsed.length > 0) {
              this.editorBlockManagerService.addCustomLayoutToBlock(parsed, this.grapeEditorService.editor);
            }
          }
        } catch (e) {
          console.warn('Could not load custom layouts from storage', e);
        }

        // Only call remote backend if an active form template or component is provided
        if (this.selectedFormTemplate || this.selectedFormComponent) {
          const types: string[] = [SystemMasterConstant.UOM_CLASS];
          this.masterService.getSystemMastersByLanguage(this, types, 'LANG-147');
          this.getCustomLayouts();
          this.getDataObject();
          this.getDataTable();
          this.getFormScriptData();
        }

        switch (this.source) {
          case EditorSource.ASSESSMENT_FORM:
            if (this.selectedFormTemplate?.admitType === 'OP') {
              this.getFormBuilderData();
            } else if (this.selectedFormTemplate?.admitType === 'IP') {
              this.getIpFormBuilderData();
            } else if (this.selectedFormTemplate?.admitType === 'ER') {
              this.getErFormBuilderData();
            }
            break;
          case EditorSource.CUSTOM_LAYOUT:
            this.getCustomLayoutData();
            break;
          case EditorSource.EMR_COMPONENT:
            this.getCustomLayoutData();
            if (this.selectedFormComponent?.emrcomponent) {
              this.editorBlockManagerService.getEmrCompByType(
                this.selectedFormComponent?.emrcomponent,
                this.grapeEditorService.editor
              );
            }
            break;
          default:
            break;
        }
        // Wait for editor blocks to be fully rendered before collapsing them
        this.setTimeoutSafe(() => {
          this.editorBlockManagerService.collapseBlock(
            this.grapeEditorService.editor
          );
        }, this.TIMEOUT_CONFIG.EDITOR_BLOCK_COLLAPSE);
      });

    this.customLayoutForm = this.fb.group({
      name: ['', Validators.required],
      icon: ['', Validators.required],
    });
    this.scriptForm = this.fb.group({
      scriptUrl: [''],
    });
    this.demographicForm = this.fb.group({
      label: ['', Validators.required],
      key: [''],
      type: ['text', Validators.required],
      icon: ['fa fa-user'],
      placeholder: [''],
    });
    const clinicalContext = this.clinicalWorkflow.getContext();
    this.patientContextForm = this.fb.group({
      name: [clinicalContext.name, Validators.required],
      dateOfBirth: [clinicalContext.dateOfBirth],
      mrn: [clinicalContext.mrn, Validators.required],
      allergies: [clinicalContext.allergies],
      encounter: [clinicalContext.encounter],
      clinician: [clinicalContext.clinician, Validators.required],
    });
    this.clinicalAudit = this.clinicalWorkflow.listAudit();

    // Initialize Phase 2: Variable Inserter & Branding Forms
    this.variableScopes = this.variableService.getScopeGroups();
    this.filteredVariables = this.variableService.getAllVariables();

    this.customVarForm = this.fb.group({
      scope: ['custom', Validators.required],
      key: ['', [Validators.required]],
      label: ['', Validators.required],
      type: ['string', Validators.required],
      sampleValue: [''],
    });

    this.initBrandForm();
  }

  openDemographicDialog(): void {
    this.demographicForm.reset({
      label: '',
      key: '',
      type: 'text',
      icon: 'fa fa-user',
      placeholder: '',
    });
    this.pDialogDemographic = true;
    this.cdr.markForCheck();
  }

  onDemographicLabelInput(): void {
    const labelVal = this.demographicForm.get('label')?.value || '';
    const cleanKey = 'Patient' + labelVal.replace(/[^a-zA-Z0-9]/g, '');
    this.demographicForm.patchValue({ key: cleanKey }, { emitEvent: false });
  }

  saveDemographicField(): void {
    if (this.demographicForm.invalid) {
      this.demographicForm.markAllAsTouched();
      return;
    }

    const val = this.demographicForm.value;
    const cleanKey = (val.key || ('Patient' + val.label)).replace(/[^a-zA-Z0-9_]/g, '');
    const item = {
      key: cleanKey,
      label: val.label.trim(),
      type: val.type || 'text',
      icon: val.icon || 'fa fa-user',
      placeholder: val.placeholder?.trim() || '',
    };

    this.editorBlockManagerService.addCustomDemographicItem(
      this.grapeEditorService.editor,
      item,
      true
    );

    this.pDialogDemographic = false;
    AppUtils.showSuccessViaToast(
      this.messageService,
      `Demographic field '${item.label}' added to Demographics!`
    );
    this.cdr.markForCheck();
  }

  // =========================================================================
  // Phase 2: Variable Insertion & Brand Styling APIs
  // =========================================================================

  openVariableInserter(): void {
    this.variableScopes = this.variableService.getScopeGroups();
    this.selectedVariableScope = 'all';
    this.variableSearchQuery = '';
    this.filterVariables();
    this.pDialogInsertVariable = true;
    this.cdr.markForCheck();
  }

  selectVariableScope(scopeId: string): void {
    this.selectedVariableScope = scopeId;
    this.filterVariables();
  }

  filterVariables(): void {
    const all = this.variableService.getAllVariables();
    const q = this.variableSearchQuery.trim().toLowerCase();
    this.filteredVariables = all.filter((v) => {
      const matchScope = this.selectedVariableScope === 'all' || v.scope === this.selectedVariableScope;
      const matchQuery = !q || v.key.toLowerCase().includes(q) || v.label.toLowerCase().includes(q) || (v.description && v.description.toLowerCase().includes(q));
      return matchScope && matchQuery;
    });
    this.cdr.markForCheck();
  }

  insertVariableIntoCanvas(item: VariableItem, mode: 'tag' | 'if' | 'loop' = 'tag'): void {
    let html = '';
    if (mode === 'tag') {
      html = `<span class="var-badge" style="display:inline-block; padding:1px 6px; background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; border-radius:4px; font-weight:600; font-size:0.95em;">{{${item.key}}}</span>`;
    } else if (mode === 'if') {
      html = this.variableService.generateConditionalSyntax(item.key, item.label);
    } else if (mode === 'loop') {
      html = this.variableService.generateRepeaterSyntax(item);
    }

    this.insertHtmlIntoEditor(html);
    this.pDialogInsertVariable = false;
    AppUtils.showSuccessViaToast(this.messageService, `Inserted '${item.label}' into document!`);
    this.cdr.markForCheck();
  }

  insertCustomVariable(): void {
    if (this.customVarForm.invalid) {
      this.customVarForm.markAllAsTouched();
      return;
    }
    const val = this.customVarForm.value;
    const cleanKey = val.key.trim();
    const item: VariableItem = {
      key: cleanKey,
      label: val.label.trim(),
      scope: val.scope || 'custom',
      type: val.type || 'string',
      sampleValue: val.sampleValue || '',
    };
    this.variableService.registerCustomVariable(item);
    this.insertVariableIntoCanvas(item, 'tag');
    this.customVarForm.reset({
      scope: 'custom',
      key: '',
      label: '',
      type: 'string',
      sampleValue: '',
    });
  }

  initBrandForm(): void {
    if (this.brandForm) return;

    this.brandForm = this.fb.group({
      id: [''],
      name: ['St. Jude Health System', Validators.required],
      clinicName: ['St. Jude Health System'],
      tagline: ['Compassionate Care, Advanced Medical Science'],
      isDefault: [true],
      primaryColor: ['#0284c7'],
      secondaryColor: ['#0369a1'],
      accentColor: ['#38bdf8'],
      backgroundColor: ['#ffffff'],
      textColor: ['#0f172a'],
      borderColor: ['#e2e8f0'],
      fontFamily: ["'Inter', sans-serif"],
      headingFontFamily: ["'Inter', sans-serif"],
      fontSizeBase: ['14px'],
      lineHeight: ['1.5'],
      logoUrl: ['https://images.unsplash.com/photo-1516549655169-df83a0774514?w=120&auto=format&fit=crop&q=60'],
      headerStyle: ['modern'],
      footerStyle: ['standard'],
      street: ['100 Medical Center Blvd'],
      city: ['Boston'],
      state: ['MA'],
      postalCode: ['02115'],
      country: ['USA'],
      phone: ['+1 (617) 555-0144'],
      email: ['records@stjudehealth.org'],
      website: ['https://www.stjudehealth.org'],
      taxId: ['US-EIN-9482710'],
      registrationNumber: ['MA-MED-84920'],
      disclaimer: ['Confidential medical record. Protected under HIPAA and applicable health information confidentiality laws.'],
      signatoryName: ['Dr. Sarah Jenkins, MD'],
      signatoryTitle: ['Chief Medical Officer'],
      signatureUrl: [''],
    });

    // Synchronize clinicName with name
    this.brandForm.get('name')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => {
        this.brandForm?.get('clinicName')?.setValue(val, { emitEvent: false });
      });
  }

  openBrandSettings(): void {
    this.initBrandForm();
    const activeOrg = this.tenantWorkspaceService.getActiveOrganization();
    let profiles = activeOrg
      ? this.brandService.getBrandsByOrganization(activeOrg.id)
      : [];
    if (!profiles || profiles.length === 0) {
      profiles = this.brandService.getBrands();
    }
    this.brandProfiles = profiles;
    this.brandPresets = this.brandService.presets;

    const activeBrand = this.brandService.getActiveBrand();
    this.selectBrandProfile(activeBrand);
    this.activeBrandTab = 'colors';
    this.pDialogBrandSettings = true;
    this.cdr.markForCheck();
  }

  selectBrandProfile(brand: Brand): void {
    if (!brand) return;
    this.initBrandForm();
    this.selectedBrandProfile = brand;
    this.brandForm.patchValue({
      id: brand.id,
      name: brand.name,
      clinicName: brand.name,
      tagline: brand.tagline || '',
      isDefault: brand.isDefault,
      primaryColor: brand.colors.primary,
      secondaryColor: brand.colors.secondary,
      accentColor: brand.colors.accent || brand.colors.primary,
      backgroundColor: brand.colors.background,
      textColor: brand.colors.text,
      borderColor: brand.colors.border || '#e2e8f0',
      fontFamily: brand.typography.fontFamily,
      headingFontFamily: brand.typography.headingFontFamily || brand.typography.fontFamily,
      fontSizeBase: brand.typography.fontSizeBase || '14px',
      lineHeight: brand.typography.lineHeight || '1.5',
      logoUrl: brand.logoUrl || '',
      headerStyle: brand.headerStyle || 'modern',
      footerStyle: brand.footerStyle || 'standard',
      street: brand.address?.street || '',
      city: brand.address?.city || '',
      state: brand.address?.state || '',
      postalCode: brand.address?.postalCode || '',
      country: brand.address?.country || 'USA',
      phone: brand.contactInfo?.phone || '',
      email: brand.contactInfo?.email || '',
      website: brand.contactInfo?.website || '',
      taxId: brand.legalInfo?.taxId || '',
      registrationNumber: brand.legalInfo?.registrationNumber || '',
      disclaimer: brand.legalInfo?.disclaimer || '',
      signatoryName: brand.signatoryName || '',
      signatoryTitle: brand.signatoryTitle || '',
      signatureUrl: brand.signatureUrl || '',
    });
    this.cdr.markForCheck();
  }

  applyBrandPreset(presetKey: string): void {
    const preset = this.brandService.presets.find((p) => p.key === presetKey);
    if (!preset) return;
    this.brandForm.patchValue({
      primaryColor: preset.colors.primary,
      secondaryColor: preset.colors.secondary,
      accentColor: preset.colors.accent,
      backgroundColor: preset.colors.background,
      textColor: preset.colors.text,
      borderColor: preset.colors.border,
      fontFamily: preset.typography.fontFamily,
      headingFontFamily: preset.typography.headingFontFamily,
      fontSizeBase: preset.typography.fontSizeBase,
      lineHeight: preset.typography.lineHeight,
    });
    AppUtils.showSuccessViaToast(this.messageService, `Preset "${preset.name}" applied.`);
    this.cdr.markForCheck();
  }

  saveBrandProfile(): void {
    if (!this.rbacService.hasPermission('brand:manage')) {
      AppUtils.showErrorViaToast(this.messageService, 'Access Denied: Missing permission brand:manage');
      return;
    }
    const val = this.brandForm.value;
    const brandData: Partial<Brand> = {
      name: val.name,
      tagline: val.tagline,
      isDefault: val.isDefault,
      logoUrl: val.logoUrl,
      colors: {
        primary: val.primaryColor,
        secondary: val.secondaryColor,
        accent: val.accentColor,
        background: val.backgroundColor,
        text: val.textColor,
        border: val.borderColor,
      },
      typography: {
        fontFamily: val.fontFamily,
        headingFontFamily: val.headingFontFamily,
        fontSizeBase: val.fontSizeBase,
        lineHeight: val.lineHeight,
      },
      headerStyle: val.headerStyle,
      footerStyle: val.footerStyle,
      address: {
        street: val.street,
        city: val.city,
        state: val.state,
        postalCode: val.postalCode,
        country: val.country,
      },
      contactInfo: {
        phone: val.phone,
        email: val.email,
        website: val.website,
      },
      legalInfo: {
        taxId: val.taxId,
        registrationNumber: val.registrationNumber,
        disclaimer: val.disclaimer,
      },
      signatoryName: val.signatoryName,
      signatoryTitle: val.signatoryTitle,
      signatureUrl: val.signatureUrl,
    };

    if (val.id && this.brandService.getBrandById(val.id)) {
      const updated = this.brandService.updateBrand(val.id, brandData);
      if (updated) {
        this.selectedBrandProfile = updated;
        AppUtils.showSuccessViaToast(this.messageService, `Brand profile "${updated.name}" updated successfully.`);
      }
    } else {
      const created = this.brandService.createBrand(brandData);
      this.selectedBrandProfile = created;
      this.brandForm.patchValue({ id: created.id });
      AppUtils.showSuccessViaToast(this.messageService, `New brand profile "${created.name}" created.`);
    }

    const activeOrg = this.tenantWorkspaceService.getActiveOrganization();
    this.brandProfiles = activeOrg
      ? this.brandService.getBrandsByOrganization(activeOrg.id)
      : this.brandService.getBrands();
    this.cdr.markForCheck();
  }

  createNewBrandProfile(): void {
    const activeOrg = this.tenantWorkspaceService.getActiveOrganization();
    this.selectedBrandProfile = null;
    this.brandForm.reset({
      id: '',
      name: `${activeOrg?.name || 'Clinic'} Brand Profile`,
      clinicName: `${activeOrg?.name || 'Clinic'} Brand Profile`,
      tagline: 'Healthcare Excellence',
      isDefault: false,
      primaryColor: '#0284c7',
      secondaryColor: '#0369a1',
      accentColor: '#38bdf8',
      backgroundColor: '#ffffff',
      textColor: '#0f172a',
      borderColor: '#e2e8f0',
      fontFamily: "'Inter', sans-serif",
      headingFontFamily: "'Inter', sans-serif",
      fontSizeBase: '14px',
      lineHeight: '1.5',
      logoUrl: '',
      headerStyle: 'modern',
      footerStyle: 'standard',
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'USA',
      phone: '',
      email: '',
      website: '',
      taxId: '',
      registrationNumber: '',
      disclaimer: 'Confidential medical documentation.',
      signatoryName: '',
      signatoryTitle: '',
      signatureUrl: '',
    });
    this.activeBrandTab = 'colors';
    this.cdr.markForCheck();
  }

  deleteBrandProfile(id: string): void {
    if (!this.rbacService.hasPermission('brand:manage')) {
      AppUtils.showErrorViaToast(this.messageService, 'Access Denied: Missing permission brand:manage');
      return;
    }
    const ok = this.brandService.deleteBrand(id);
    if (ok) {
      AppUtils.showSuccessViaToast(this.messageService, 'Brand profile deleted.');
      const activeOrg = this.tenantWorkspaceService.getActiveOrganization();
      this.brandProfiles = activeOrg
        ? this.brandService.getBrandsByOrganization(activeOrg.id)
        : this.brandService.getBrands();
      this.selectBrandProfile(this.brandService.getActiveBrand());
      this.cdr.markForCheck();
    } else {
      AppUtils.showWarnViaToast(this.messageService, 'Cannot delete the only remaining brand profile.');
    }
  }

  setAsDefaultBrand(id?: string): void {
    if (!this.rbacService.hasPermission('brand:manage')) {
      AppUtils.showErrorViaToast(this.messageService, 'Access Denied: Missing permission brand:manage');
      return;
    }
    const brandId = id || this.brandForm.value.id;
    const activeOrg = this.tenantWorkspaceService.getActiveOrganization();
    if (brandId && activeOrg) {
      this.brandService.setOrganizationDefaultBrand(activeOrg.id, brandId);
      this.brandForm.patchValue({ isDefault: true });
      AppUtils.showSuccessViaToast(this.messageService, 'Brand set as default for this organization.');
      this.brandProfiles = this.brandService.getBrandsByOrganization(activeOrg.id);
      this.cdr.markForCheck();
    }
  }

  applyBrandSettings(): void {
    this.applyBrandToActiveCanvas();
  }

  applyBrandToActiveCanvas(): void {
    const brand = this.getBrandFromFormValues();
    const editor = this.grapeEditorService?.editor;
    if (editor) {
      const brandCss = this.brandService.generateBrandCss(brand);
      const existing = typeof editor.getCss === 'function' ? (editor.getCss() || '') : '';
      if (typeof editor.setCss === 'function') {
        editor.setCss(existing + '\n' + brandCss);
      }
    }
    this.pDialogBrandSettings = false;
    AppUtils.showSuccessViaToast(this.messageService, `Brand styles for "${brand.name}" applied to canvas!`);
    this.cdr.markForCheck();
  }

  insertBrandedHeader(): void {
    const brand = this.getBrandFromFormValues();
    const html = this.brandService.generateHeaderHtml(brand, brand.headerStyle as any);
    this.insertHtmlIntoEditor(html);
    this.pDialogBrandSettings = false;
    AppUtils.showSuccessViaToast(this.messageService, 'Branded header inserted!');
    this.cdr.markForCheck();
  }

  insertBrandedFooter(): void {
    const brand = this.getBrandFromFormValues();
    const html = this.brandService.generateFooterHtml(brand, brand.footerStyle as any);
    this.insertHtmlIntoEditor(html);
    this.pDialogBrandSettings = false;
    AppUtils.showSuccessViaToast(this.messageService, 'Branded footer inserted!');
    this.cdr.markForCheck();
  }

  insertBrandedHeaderAndFooter(): void {
    const brand = this.getBrandFromFormValues();
    const headerHtml = this.brandService.generateHeaderHtml(brand, brand.headerStyle as any);
    const footerHtml = this.brandService.generateFooterHtml(brand, brand.footerStyle as any);
    this.insertHtmlIntoEditor(headerHtml);
    this.insertHtmlIntoEditor(footerHtml);
    this.pDialogBrandSettings = false;
    AppUtils.showSuccessViaToast(this.messageService, 'Branded header & footer inserted into document!');
    this.cdr.markForCheck();
  }

  // =========================================================================
  // Phase 13: Versioning & Governance Lifecycle Studio
  // =========================================================================

  openVersionManager(template?: TemplateDefinition): void {
    this.ensureHealthcareStarter();
    const allTemplates = this.templateStore.list();
    const target = template || this.activeGenericTemplate || allTemplates[0] || null;

    if (!target) {
      AppUtils.showErrorViaToast(this.messageService, 'No templates available for version management.');
      return;
    }

    this.activeVersionTemplate = target;
    this.templateVersions = this.templateVersionService.getVersions(target.id);
    this.selectedVersion = this.templateVersions[0] || null;
    this.activeVersionTab = 'timeline';
    this.versionReviewNotes = '';
    this.versionChangeLog = '';
    this.versionRejectReason = '';

    // Set default compare versions
    if (this.templateVersions.length >= 2) {
      this.compareVersionA = this.templateVersions[1].versionNumber;
      this.compareVersionB = this.templateVersions[0].versionNumber;
      this.runVersionComparison();
    } else if (this.templateVersions.length === 1) {
      this.compareVersionA = this.templateVersions[0].versionNumber;
      this.compareVersionB = this.templateVersions[0].versionNumber;
      this.versionDiffResult = null;
    }

    this.pDialogVersionManager = true;
    this.cdr.markForCheck();
  }

  selectTemplateVersion(version: TemplateVersion): void {
    this.selectedVersion = version;
    this.cdr.markForCheck();
  }

  createNewDraftVersion(): void {
    if (!this.activeVersionTemplate) return;
    try {
      const changeLog = this.versionChangeLog.trim() || `Draft iteration on ${new Date().toLocaleDateString()}`;
      const newDraft = this.templateVersionService.createDraftVersion(
        this.activeVersionTemplate.id,
        changeLog,
        this.selectedVersion?.versionNumber
      );
      this.templateVersions = this.templateVersionService.getVersions(this.activeVersionTemplate.id);
      this.selectedVersion = newDraft;
      this.activeVersionTemplate = this.templateStore.getById(this.activeVersionTemplate.id) || null;
      this.versionChangeLog = '';
      AppUtils.showSuccessViaToast(this.messageService, `Created new draft v${newDraft.versionNumber}!`);
      this.cdr.markForCheck();
    } catch (err: any) {
      AppUtils.showErrorViaToast(this.messageService, err?.message || 'Could not create draft version');
    }
  }

  submitVersionForReview(): void {
    if (!this.activeVersionTemplate || !this.selectedVersion) return;
    try {
      const updated = this.templateVersionService.submitForReview(
        this.activeVersionTemplate.id,
        this.selectedVersion.versionNumber,
        this.versionReviewNotes.trim() || 'Submitted for compliance & medical review'
      );
      this.templateVersions = this.templateVersionService.getVersions(this.activeVersionTemplate.id);
      this.selectedVersion = updated;
      this.activeVersionTemplate = this.templateStore.getById(this.activeVersionTemplate.id) || null;
      this.versionReviewNotes = '';
      AppUtils.showSuccessViaToast(this.messageService, `Version v${updated.versionNumber} submitted for review!`);
      this.cdr.markForCheck();
    } catch (err: any) {
      AppUtils.showErrorViaToast(this.messageService, err?.message || 'Could not submit version for review');
    }
  }

  approveAndPublishVersion(): void {
    if (!this.activeVersionTemplate || !this.selectedVersion) return;
    try {
      const published = this.templateVersionService.approveAndPublish(
        this.activeVersionTemplate.id,
        this.selectedVersion.versionNumber,
        'Approved by authorized director'
      );
      this.templateVersions = this.templateVersionService.getVersions(this.activeVersionTemplate.id);
      this.selectedVersion = published;
      this.activeVersionTemplate = this.templateStore.getById(this.activeVersionTemplate.id) || null;
      
      // If this is currently active canvas template, update canvas title and active format name
      if (this.activeGenericTemplate?.id === this.activeVersionTemplate?.id) {
        this.activeGenericTemplate = this.activeVersionTemplate;
        this.activeFormatName = `${this.activeVersionTemplate.name} (v${published.versionNumber})`;
      }
      AppUtils.showSuccessViaToast(this.messageService, `Version v${published.versionNumber} published to production!`);
      this.cdr.markForCheck();
    } catch (err: any) {
      AppUtils.showErrorViaToast(this.messageService, err?.message || 'Could not publish version');
    }
  }

  rejectVersionReview(): void {
    if (!this.activeVersionTemplate || !this.selectedVersion) return;
    try {
      const reason = this.versionRejectReason.trim() || 'Changes required before clinical release';
      const rejected = this.templateVersionService.rejectReview(
        this.activeVersionTemplate.id,
        this.selectedVersion.versionNumber,
        reason
      );
      this.templateVersions = this.templateVersionService.getVersions(this.activeVersionTemplate.id);
      this.selectedVersion = rejected;
      this.activeVersionTemplate = this.templateStore.getById(this.activeVersionTemplate.id) || null;
      this.versionRejectReason = '';
      AppUtils.showSuccessViaToast(this.messageService, `Version v${rejected.versionNumber} returned to Draft.`);
      this.cdr.markForCheck();
    } catch (err: any) {
      AppUtils.showErrorViaToast(this.messageService, err?.message || 'Could not reject version');
    }
  }

  rollbackVersion(): void {
    if (!this.activeVersionTemplate || !this.selectedVersion) return;
    try {
      const targetVer = this.templateVersionService.rollbackToVersion(
        this.activeVersionTemplate.id,
        this.selectedVersion.versionNumber
      );
      this.templateVersions = this.templateVersionService.getVersions(this.activeVersionTemplate.id);
      this.selectedVersion = targetVer;
      this.activeVersionTemplate = this.templateStore.getById(this.activeVersionTemplate.id) || null;

      // Restore onto active canvas
      this.loadVersionIntoCanvas(targetVer);
      AppUtils.showSuccessViaToast(this.messageService, `Rolled back to v${targetVer.versionNumber} and restored to canvas!`);
      this.cdr.markForCheck();
    } catch (err: any) {
      AppUtils.showErrorViaToast(this.messageService, err?.message || 'Could not roll back version');
    }
  }

  archiveSelectedVersion(): void {
    if (!this.activeVersionTemplate || !this.selectedVersion) return;
    try {
      const archived = this.templateVersionService.archiveVersion(
        this.activeVersionTemplate.id,
        this.selectedVersion.versionNumber
      );
      this.templateVersions = this.templateVersionService.getVersions(this.activeVersionTemplate.id);
      this.selectedVersion = archived;
      this.activeVersionTemplate = this.templateStore.getById(this.activeVersionTemplate.id) || null;
      AppUtils.showSuccessViaToast(this.messageService, `Version v${archived.versionNumber} archived.`);
      this.cdr.markForCheck();
    } catch (err: any) {
      AppUtils.showErrorViaToast(this.messageService, err?.message || 'Could not archive version');
    }
  }

  runVersionComparison(): void {
    if (!this.activeVersionTemplate) return;
    try {
      this.versionDiffResult = this.templateVersionService.compareVersions(
        this.activeVersionTemplate.id,
        Number(this.compareVersionA),
        Number(this.compareVersionB)
      );
      this.cdr.markForCheck();
    } catch (err: any) {
      this.versionDiffResult = null;
    }
  }

  loadVersionIntoCanvas(version: TemplateVersion): void {
    if (version.design && this.grapeEditorService?.editor?.loadProjectData) {
      this.grapeEditorService.editor.loadProjectData(version.design);
    } else if (this.grapeEditorService?.editor?.setComponents) {
      this.grapeEditorService.editor.setComponents(version.html || '');
      if (this.grapeEditorService.editor.setCss) {
        this.grapeEditorService.editor.setCss(version.css || '');
      }
    }
    if (this.activeVersionTemplate) {
      this.activeGenericTemplate = this.activeVersionTemplate;
      this.activeFormatName = `${this.activeVersionTemplate.name} (v${version.versionNumber})`;
    }
    AppUtils.showSuccessViaToast(this.messageService, `Loaded v${version.versionNumber} onto the canvas.`);
    this.cdr.markForCheck();
  }

  getBrandFromFormValues(): Brand {
    const val = this.brandForm.value;
    const activeOrg = this.tenantWorkspaceService.getActiveOrganization();
    return {
      id: val.id || 'temp_brand',
      organizationId: activeOrg?.id || 'org_general_health',
      name: val.name || val.clinicName || 'Healthcare Clinic',
      tagline: val.tagline,
      isDefault: val.isDefault,
      logoUrl: val.logoUrl,
      colors: {
        primary: val.primaryColor,
        secondary: val.secondaryColor,
        accent: val.accentColor || val.primaryColor,
        background: val.backgroundColor,
        text: val.textColor,
        border: val.borderColor || '#e2e8f0',
      },
      typography: {
        fontFamily: val.fontFamily,
        headingFontFamily: val.headingFontFamily || val.fontFamily,
        fontSizeBase: val.fontSizeBase,
        lineHeight: val.lineHeight || '1.5',
      },
      headerStyle: val.headerStyle || 'modern',
      footerStyle: val.footerStyle || 'standard',
      address: {
        street: val.street,
        city: val.city,
        state: val.state,
        postalCode: val.postalCode,
        country: val.country,
      },
      contactInfo: {
        phone: val.phone,
        email: val.email,
        website: val.website,
      },
      legalInfo: {
        taxId: val.taxId,
        registrationNumber: val.registrationNumber,
        disclaimer: val.disclaimer,
      },
      signatoryName: val.signatoryName,
      signatoryTitle: val.signatoryTitle,
      signatureUrl: val.signatureUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  insertHtmlIntoEditor(html: string): void {
    const editor = this.grapeEditorService.editor;
    if (!editor) return;
    const selected = editor.getSelected();
    if (selected) {
      selected.append(html);
    } else {
      const wrapper = editor.getWrapper();
      wrapper.append(html);
    }
  }

  /**
   * Cleanup lifecycle method to prevent memory leaks
   * Unsubscribes from observables and clears all pending timeouts
   */
  ngOnDestroy(): void {
    // Signal to all subscriptions using takeUntil to complete
    this.destroy$.next();
    this.destroy$.complete();

    // Clear all pending timeouts
    this.timeoutIds.forEach(id => clearTimeout(id));
    this.timeoutIds.length = 0;
  }

  /**
   * Helper method to safely schedule a timeout and track it for cleanup
   * This ensures all timeouts are properly cleared on component destroy
   * Runs inside Angular zone to ensure change detection is triggered
   * @param callback Function to execute after delay
   * @param ms Delay in milliseconds
   */
  private setTimeoutSafe(callback: () => void, ms: number): void {
    const timeoutId = this.ngZone.runOutsideAngular(() => {
      return window.setTimeout(() => {
        // Run the callback inside Angular zone so change detection works
        this.ngZone.run(() => {
          callback();
          // Explicitly mark for check after callback to ensure UI updates
          this.cdr.markForCheck();
        });
      }, ms);
    });
    this.timeoutIds.push(timeoutId);
  }

  // getLoadUrl(source): string {
  //   let loadUrl = '';
  //   switch (source) {
  //     case EditorSource.ASSESSMENT_FORM:
  //       loadUrl =
  //         environment.baseUrl +
  //         AppGlobalConstant.CLINICAL_FORM_BY_ +
  //         this.selectedFormTemplate?.id;
  //       break;
  //     case EditorSource.CUSTOM_LAYOUT:
  //       loadUrl =
  //         environment.baseUrl +
  //         AppGlobalConstant.CLINICAL_FORM_CUSTOM_LAYOUT_BY_ +
  //         this.selectedFormComponent?.id;
  //       break;
  //     case EditorSource.EMR_COMPONENT:
  //       loadUrl =
  //         environment.baseUrl +
  //         AppGlobalConstant.CLINICAL_FORM_CUSTOM_LAYOUT_BY_ +
  //         this.selectedFormComponent?.id;
  //       break;

  //     default:
  //       break;
  //   }
  //   return loadUrl;
  // }

  getDataObject(): void {
    if (this.settingsData.dataObjectList.length === 0) {
      this.formService.getDataObject(this);
    } else {
      this.settingsData.dataObjectList.forEach((item) => {
        this.editorBlockManagerService.addDataObjectToBlock(
          this.grapeEditorService.editor,
          item
        );
      });
    }
  }
  getLoadUrl(source: any): string {
    let loadUrl = '';
    switch (source) {
      case EditorSource.EMR_COMPONENT:
        loadUrl =
          environment.baseUrl +
          AppGlobalConstant.CLINICAL_FORM_CUSTOM_LAYOUT_BY_ +
          this.selectedFormComponent?.id;
        this.onEdit(this.selectedFormComponent);
        break;
      default:
        break;
    }
    return loadUrl;
  }

  onEdit(value: FormComponents): void {
    this.selectedFormComponent = value;

    this.customLayoutForm.patchValue({
      name: value?.layoutName,
    });
    this.customLayoutForm.patchValue({
      icon: value?.layoutIcon,
    });
  }

  getDataTable(): void {
    if (this.settingsData.dataTableList.length === 0) {
      this.formService.getDataTable(this);
    } else {
      this.editorBlockManagerService.addDataTableToBlock(
        this.grapeEditorService.editor
      );
    }
  }

  getCustomLayouts(): void {
    const businessId = this.getCustomerBusinessId();
    if (businessId) {
      this.formService.getCustomLayout(
        this,
        businessId,
        FormComponentType.ALL
      );
    }
  }

  getCustomerBusinessId(): any {
    let cId = null;
    switch (this.source) {
      case EditorSource.ASSESSMENT_FORM:
        cId = this.selectedFormTemplate?.customerBusinessId;
        break;

      case EditorSource.CUSTOM_LAYOUT:
        cId = this.selectedFormComponent?.customerBusinessId;
        break;
      case EditorSource.EMR_COMPONENT:
        cId = this.selectedFormComponent?.customerBusinessId;
        break;

      default:
        break;
    }
    return cId;
  }

  getCustomerId(): any {
    let cId = null;
    switch (this.source) {
      case EditorSource.ASSESSMENT_FORM:
        cId = this.selectedFormTemplate?.customerId;
        break;

      case EditorSource.CUSTOM_LAYOUT:
        cId = this.selectedFormComponent?.customerId;
        break;
      case EditorSource.EMR_COMPONENT:
        cId = this.selectedFormComponent?.customerId;
        break;

      default:
        break;
    }
    return cId;
  }

  getCreatedById(): any {
    let cId = null;
    switch (this.source) {
      case EditorSource.ASSESSMENT_FORM:
        cId = this.selectedFormTemplate?.createdById;
        break;

      case EditorSource.CUSTOM_LAYOUT:
        cId = this.selectedFormComponent?.createdById;
        break;
      case EditorSource.EMR_COMPONENT:
        cId = this.selectedFormComponent?.createdById;
        break;

      default:
        break;
    }
    return cId;
  }

  getSiteId(): any {
    let cId = null;
    switch (this.source) {
      case EditorSource.ASSESSMENT_FORM:
        cId = this.selectedFormTemplate?.siteId;
        break;

      case EditorSource.CUSTOM_LAYOUT:
        cId = this.selectedFormComponent?.siteId;
        break;
      case EditorSource.EMR_COMPONENT:
        cId = this.selectedFormComponent?.siteId;
        break;

      default:
        break;
    }
    return cId;
  }

  getUserId(): any {
    let cId = null;
    switch (this.source) {
      case EditorSource.ASSESSMENT_FORM:
        cId = this.selectedFormTemplate?.userId;
        break;

      case EditorSource.CUSTOM_LAYOUT:
        cId = this.selectedFormComponent?.userId;
        break;
      case EditorSource.EMR_COMPONENT:
        cId = this.selectedFormComponent?.userId;
        break;

      default:
        break;
    }
    return cId;
  }

  clear(): void {
    this.customLayoutForm.reset();
    this.selectedFormComponent = null;

  }

  saveForm(): void {
    if (!this.selectedFormTemplate?.id) {
      if (this.activeGenericTemplate) {
        const now = new Date().toISOString();
        const updated: TemplateDefinition = {
          ...this.activeGenericTemplate,
          version: this.activeGenericTemplate.version + 1,
          design: this.grapeEditorService.editor.getProjectData(),
          html: this.grapeEditorService.editor.getHtml(),
          css: this.grapeEditorService.editor.getCss(),
          updatedAt: now,
        };
        this.templateStore.save(updated);
        this.activeGenericTemplate = updated;
        this.genericTemplates = this.templateStore.list();
        AppUtils.showSuccessViaToast(this.messageService, `${updated.name} saved (v${updated.version}).`);
        return;
      }
      // Standalone mode: save document state to localStorage
      const html = this.grapeEditorService.editor.getHtml();
      const css = this.grapeEditorService.editor.getCss();
      const projectData = this.grapeEditorService.editor.getProjectData();
      localStorage.setItem('form_builder_document_saved', JSON.stringify({
        html,
        css,
        projectData,
        formatName: this.activeFormatName,
        savedAt: new Date().toISOString()
      }));
      AppUtils.showSuccessViaToast(
        this.messageService,
        `Document saved locally in browser!`
      );
      return;
    }

    const formEditorDTO: FormEditorDTO = new FormEditorDTO();
    formEditorDTO.assets = '';

    formEditorDTO.components = ''; //JSON.stringify(this.grapeEditorService.editor.getComponents());

    formEditorDTO.css = this.grapeEditorService.editor.getCss();
    formEditorDTO.html = this.grapeEditorService.editor.getHtml(); // + '<style>' + this.grapeEditorService.editor.getCss() + '</style>';
    formEditorDTO.styles = '';

    const eData: EditorData = new EditorData();
    eData.id = this.selectedFormTemplate?.id;
    eData.data = JSON.stringify(
      this.grapeEditorService.editor.getProjectData()
    );
    formEditorDTO.editorData = eData;

    formEditorDTO.jsCode = "";

    if (this.scripts.length > 0) {
      this.scripts.forEach(script => {
        let scriptString: string = "";
        if (script.type === 'external') scriptString = "<script src='" + script.src + "'></script>";
        else if (script.type === 'inline') scriptString = "<script>" + script.content + "</script>";
        formEditorDTO.jsCode += scriptString;
      });
    } else {
      formEditorDTO.jsCode = this.formScripts;
    }

    // const FormEditorDTODto: FormEditorDTODto = new FormEditorDTODto();
    // FormEditorDTODto.assets = '';
    // FormEditorDTODto.components = ''; //JSON.stringify(this.grapeEditorService.editor.getComponents());
    // FormEditorDTODto.css = this.grapeEditorService.editor.getCss();
    // FormEditorDTODto.html = this.grapeEditorService.editor.getHtml(); // + '<style>' + this.grapeEditorService.editor.getCss() + '</style>';
    // FormEditorDTODto.styles = '';
    // FormEditorDTODto.editorData = JSON.stringify(
    //   this.grapeEditorService.editor.getProjectData()
    // );
    // this.formService.saveIpdTemplateEditorData(
    //   this,
    //   this.selectedFormTemplate?.id,
    //   FormEditorDTODto
    // );

    this.formService.saveEditorForm(
      this,
      this.selectedFormTemplate?.id,
      formEditorDTO
    );
  }

  getFormData(): void {
    if (this.selectedFormTemplate?.id) {
      this.formService.getEditorData(this, this.selectedFormTemplate.id);
    }
  }

  getFormBuilderData(): void {
    if (this.selectedFormTemplate?.id) {
      this.formService.getFormBuilderData(this, this.selectedFormTemplate.id);
    }
  }

  getFormScriptData(): void {
    if (this.selectedFormTemplate?.id) {
      this.formService.getFormScriptData(this, this.selectedFormTemplate.id);
    }
  }

  getIpFormBuilderData(): void {
    if (this.selectedFormTemplate?.id) {
      this.formService.getIpFormBuilderData(this, this.selectedFormTemplate.id);
    }
  }

  getErFormBuilderData(): void {
    if (this.selectedFormTemplate?.id) {
      this.formService.getErFormBuilderData(this, this.selectedFormTemplate.id);
    }
  }

  getCustomLayoutData(): void {
    if (this.selectedFormComponent?.id) {
      this.formService.getCustomLayoutEditorData(
        this,
        this.selectedFormComponent.id
      );
    }
  }

  saveAsCustomLayout(): void {
    this.pDialogCustomLayout = true;
    this.customLayoutForm.reset();
    this.selectedFormComponent = null;
    this.cdr.markForCheck();
  }

  saveCustomLayout(): void {
    this.isFormSubmit = true;
    if (this.source === 'CUSTOM-LAYOUT' && !this.customLayoutForm.valid) {
      AppUtils.showWarnViaToast(
        this.messageService,
        'Required field(s) are empty'
      );
      return;
    }
    const formComps: FormComponents = new FormComponents();
    formComps.active = true;
    formComps.eventAction = EventAction.ADD;
    formComps.createdById = this.getCreatedById();
    formComps.customerBusinessId = this.getCustomerBusinessId();
    // formComps.customerBusinessId = Number(
    //   this.profileService.getCustomerBusinessId()
    // );

    formComps.customerId = this.getCustomerId();
    formComps.siteId = this.getSiteId();
    formComps.userId = this.getUserId();

    formComps.eventIdentifier =
      this.source === 'EMR-COMPONENT'
        ? FormComponentType.EMR_COMPONENT
        : FormComponentType.EDITOR_CUSTOM_LAYOUT;
    formComps.eventReferenceId = null;
    formComps.layoutName = AppUtils.isNull(this.customLayoutForm.value.name)
      ? this.selectedFormComponent?.layoutName
      : this.customLayoutForm.value.name;
    formComps.layoutIcon = this.customLayoutForm.value.icon;
    formComps.level = 'CUSTOMER';
    formComps.phySpecIdentifier = null;
    formComps.source = this.router.url;
    formComps.id = this.selectedFormComponent
      ? this.selectedFormComponent.id
      : null;


    const formEditorValue: FormEditorValue = new FormEditorValue();
    formEditorValue.assets = '';
    formEditorValue.components = ''; //JSON.stringify(this.grapeEditorService.editor.getComponents());
    formEditorValue.css = this.grapeEditorService.editor.getCss();
    formEditorValue.html = this.grapeEditorService.editor.getHtml(); // + '<style>' + this.grapeEditorService.editor.getCss() + '</style>';
    formEditorValue.styles = '';


    // const formValue: FormEditorDTO = new FormEditorDTO();
    // formValue.assets = null; // this.grapeEditorService.editor.getAssetEl();
    // formValue.components = JSON.stringify(
    //   this.grapeEditorService.editor.getComponents()
    // );
    // formValue.css = this.grapeEditorService.editor.getCss();
    // formValue.html = this.grapeEditorService.editor.getHtml();
    // formValue.styles = null; // this.grapeEditorService.editor.getStyles();
    const formEditorDTO: FormEditorDTO = new FormEditorDTO();
    formEditorDTO.assets = '';
    formEditorDTO.components = ''; //JSON.stringify(this.grapeEditorService.editor.getComponents());
    formEditorDTO.css = this.grapeEditorService.editor.getCss();
    formEditorDTO.html = this.grapeEditorService.editor.getHtml(); // + '<style>' + this.grapeEditorService.editor.getCss() + '</style>';
    formEditorDTO.styles = '';

    const eData: EditorData = new EditorData();
    eData.id = this.selectedFormTemplate?.id;
    eData.data = JSON.stringify(
      this.grapeEditorService.editor.getProjectData()
    );
    formEditorDTO.editorData = eData;
    formEditorValue.editorData = eData;
    formComps.formEditorValue = formEditorValue;
    formComps.emrcomponent = this.selectedFormComponent?.emrcomponent;
    formComps.identifier = this.selectedFormComponent?.identifier;
    if (!this.selectedFormComponent?.id && !this.selectedFormTemplate?.id) {
      // Standalone mode: save custom layout to localStorage and add to block manager
      try {
        let list: any[] = [];
        const existing = localStorage.getItem('form_builder_custom_layouts');
        if (existing) {
          list = JSON.parse(existing) || [];
        }
        formComps.identifier = (formComps.layoutName || 'Layout').replace(/[^a-zA-Z0-9]/g, '');
        list.push(formComps);
        localStorage.setItem('form_builder_custom_layouts', JSON.stringify(list));
        this.editorBlockManagerService.addCustomLayoutToBlock([formComps], this.grapeEditorService.editor);
        this.pDialogCustomLayout = false;
        this.isLoading = false;
        AppUtils.showSuccessViaToast(
          this.messageService,
          `Custom layout '${formComps.layoutName}' saved to Custom Forms block!`
        );
        this.cdr.markForCheck();
        return;
      } catch (e) {
        console.warn('Error saving layout locally:', e);
      }
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    this.formService.saveCustomLayout(this, formComps);
  }
  back(): void {
    this.location.back();
  }

  viewForm(): void {
    const html = this.grapeEditorService.editor.getHtml();
    const css = this.grapeEditorService.editor.getCss();
    const formData = {
      html: html,
      css: css,
      ...(this.selectedFormTemplate || {}),
    };
    try {
      sessionStorage.setItem('form_builder_preview_form', JSON.stringify(formData));
    } catch (e) {
      console.warn('Error caching preview form:', e);
    }
    const navigationExtras: NavigationExtras = {
      state: {
        form: formData,
      },
      replaceUrl: false,
    };
    this.router.navigateByUrl('home/form-view', navigationExtras);
  }

  // --- Generic template engine and local template management ---

  openTemplateManager(): void {
    this.ensureHealthcareStarter();
    this.genericTemplates = this.templateStore.list();
    this.pDialogTemplateManager = true;
    this.cdr.markForCheck();
  }

  createGenericTemplate(): void {
    this.activeGenericTemplate = null;
    this.templateName = '';
    this.templateCategory = 'healthcare';
    this.templateStatus = 'draft';
    this.templateSchemaText = '{\n  "patient": { "name": "string" },\n  "items": [{ "name": "string", "amount": "number" }]\n}';
    this.templateError = '';
    this.pDialogTemplateDetails = true;
  }

  editGenericTemplate(template: TemplateDefinition): void {
    this.activeGenericTemplate = template;
    this.templateName = template.name;
    this.templateCategory = template.category;
    this.templateStatus = template.status;
    this.templateSchemaText = JSON.stringify(template.dataSchema, null, 2);
    this.previewDataText = JSON.stringify(template.sampleData, null, 2);
    this.templateError = '';
    this.pDialogTemplateDetails = true;
  }

  saveGenericTemplate(): void {
    if (!this.rbacService.hasPermission('template:edit') && !this.rbacService.hasPermission('template:create')) {
      AppUtils.showErrorViaToast(
        this.messageService,
        'Access Denied: Missing required permission template:edit'
      );
      return;
    }

    if (this.templateStatus === 'published' && !this.rbacService.hasPermission('template:publish')) {
      AppUtils.showErrorViaToast(
        this.messageService,
        'Access Denied: Missing required permission template:publish'
      );
      return;
    }

    let schema: Record<string, unknown>;
    let sampleData: Record<string, unknown>;
    try {
      schema = JSON.parse(this.templateSchemaText || '{}');
      sampleData = JSON.parse(this.previewDataText || '{}');
    } catch {
      this.templateError = 'Schema and sample data must both be valid JSON.';
      return;
    }
    if (!this.templateName.trim()) {
      this.templateError = 'A template name is required.';
      return;
    }
    const now = new Date().toISOString();
    const previous = this.activeGenericTemplate;
    const template: TemplateDefinition = {
      id: previous?.id || this.templateStore.newId(),
      name: this.templateName.trim(),
      category: this.templateCategory.trim() || 'general',
      status: this.templateStatus,
      version: previous ? previous.version + 1 : 1,
      design: this.grapeEditorService.editor?.getProjectData ? this.grapeEditorService.editor.getProjectData() : {},
      html: this.grapeEditorService.editor?.getHtml ? this.grapeEditorService.editor.getHtml() : '',
      css: this.grapeEditorService.editor?.getCss ? this.grapeEditorService.editor.getCss() : '',
      dataSchema: schema,
      sampleData,
      createdAt: previous?.createdAt || now,
      updatedAt: now,
    };
    this.templateStore.save(template);
    this.activeGenericTemplate = template;
    this.genericTemplates = this.templateStore.list();
    this.pDialogTemplateDetails = false;

    try {
      const action = previous
        ? (template.status === 'published' ? 'template.published' : 'template.edited')
        : 'template.created';
      this.auditLogService.recordEvent(action, 'template', template.id, {
        templateName: template.name,
        category: template.category,
        version: template.version,
        status: template.status,
      });
    } catch {
      // Safe fallback
    }

    AppUtils.showSuccessViaToast(this.messageService, `${template.name} saved as ${template.status} (v${template.version}).`);
    this.cdr.markForCheck();
  }

  loadGenericTemplate(template: TemplateDefinition): void {
    if (template.design) this.grapeEditorService.editor.loadProjectData(template.design);
    else this.grapeEditorService.editor.setComponents(template.html || '');
    this.activeGenericTemplate = template;
    this.activeFormatName = template.name;
    this.pDialogTemplateManager = false;
    AppUtils.showSuccessViaToast(this.messageService, `Loaded ${template.name}.`);
  }

  duplicateGenericTemplate(template: TemplateDefinition): void {
    const copy = this.templateStore.duplicate(template);
    this.genericTemplates = this.templateStore.list();
    this.editGenericTemplate(copy);
  }

  previewGenericTemplate(template: TemplateDefinition): void {
    this.loadGenericTemplate(template);
    this.previewDataText = JSON.stringify(template.sampleData, null, 2);
    this.openDataPreview();
  }

  openDataPreview(): void {
    this.templateError = '';
    this.pDialogDataPreview = true;
  }

  openPatientContext(): void {
    this.pDialogPatientContext = true;
  }

  savePatientContext(): void {
    if (this.patientContextForm.invalid) {
      this.patientContextForm.markAllAsTouched();
      return;
    }
    this.clinicalWorkflow.saveContext(this.patientContextForm.getRawValue() as PatientContext);
    this.pDialogPatientContext = false;
    AppUtils.showSuccessViaToast(this.messageService, 'Patient and encounter context saved for this local preview session.');
  }

  reviewClinicalDocument(): void {
    this.clinicalDocumentStatus = 'reviewed';
    this.recordClinicalEvent('reviewed', 'Document marked ready for clinical review.');
    AppUtils.showSuccessViaToast(this.messageService, 'Document marked for review.');
  }

  signClinicalDocument(): void {
    if (this.patientContextForm.invalid) {
      this.patientContextForm.markAllAsTouched();
      this.openPatientContext();
      this.templateError = 'Patient name, MRN, and clinician are required before signing.';
      return;
    }
    this.clinicalDocumentStatus = 'signed';
    this.recordClinicalEvent('signed', 'Local prototype sign-off recorded; backend signature and immutable audit are required for production.');
    AppUtils.showSuccessViaToast(this.messageService, 'Local prototype sign-off recorded.');
  }

  openAuditTrail(): void {
    if (!this.hasRbacPermission('audit:view')) {
      AppUtils.showErrorViaToast(
        this.messageService,
        'Access Denied: You do not have permission to view enterprise audit trails.'
      );
      return;
    }
    this.clinicalAudit = this.clinicalWorkflow.listAudit();
    this.refreshAuditEvents();
    this.pDialogAudit = true;
    this.cdr.markForCheck();
  }

  refreshAuditEvents(): void {
    this.auditEvents = this.auditLogService.getEvents();
    this.applyAuditFilters();
  }

  applyAuditFilters(): void {
    const filters: AuditFilterCriteria = {
      action: this.auditSelectedAction === 'all' ? undefined : (this.auditSelectedAction as any),
      resourceType: this.auditSelectedResourceType === 'all' ? undefined : (this.auditSelectedResourceType as any),
      searchTerm: this.auditSearchTerm,
    };

    const now = Date.now();
    if (this.auditSelectedDateRange === 'today') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      filters.fromDate = todayStart.toISOString();
    } else if (this.auditSelectedDateRange === '7d') {
      filters.fromDate = new Date(now - 7 * 86400000).toISOString();
    } else if (this.auditSelectedDateRange === '30d') {
      filters.fromDate = new Date(now - 30 * 86400000).toISOString();
    }

    this.filteredAuditEvents = this.auditLogService.getEvents(filters);
    this.cdr.markForCheck();
  }

  clearAuditFilters(): void {
    this.auditSearchTerm = '';
    this.auditSelectedAction = 'all';
    this.auditSelectedResourceType = 'all';
    this.auditSelectedDateRange = 'all';
    this.applyAuditFilters();
  }

  exportAuditCsv(): void {
    const filters: AuditFilterCriteria = {
      action: this.auditSelectedAction === 'all' ? undefined : (this.auditSelectedAction as any),
      resourceType: this.auditSelectedResourceType === 'all' ? undefined : (this.auditSelectedResourceType as any),
      searchTerm: this.auditSearchTerm,
    };
    const result = this.auditLogService.exportAsCsv(filters);
    this.auditLogService.downloadExport(result);
    AppUtils.showSuccessViaToast(
      this.messageService,
      `Exported ${result.count} audit events as CSV.`
    );
  }

  exportAuditJson(): void {
    const filters: AuditFilterCriteria = {
      action: this.auditSelectedAction === 'all' ? undefined : (this.auditSelectedAction as any),
      resourceType: this.auditSelectedResourceType === 'all' ? undefined : (this.auditSelectedResourceType as any),
      searchTerm: this.auditSearchTerm,
    };
    const result = this.auditLogService.exportAsJson(filters);
    this.auditLogService.downloadExport(result);
    AppUtils.showSuccessViaToast(
      this.messageService,
      `Exported ${result.count} audit events as JSON.`
    );
  }

  inspectAuditMetadata(event: AuditEvent): void {
    this.auditSelectedEventForMetadata = event;
    this.pDialogAuditMetadata = true;
    this.cdr.markForCheck();
  }

  getAuditEventCountByResource(type: string): number {
    return this.auditEvents.filter((e) => e.resourceType === type).length;
  }

  // =========================================================================
  // Phase 15: Security Foundation & Privacy Shield Methods
  // =========================================================================

  openSecurityCenter(): void {
    if (!this.hasRbacPermission('user:manage') && !this.hasRbacPermission('workspace:manage') && !this.hasRbacPermission('audit:view')) {
      AppUtils.showErrorViaToast(
        this.messageService,
        'Access Denied: You do not have permission to access the Security Center.'
      );
      return;
    }
    this.testPhiRedaction();
    this.testPasswordSecurity();
    this.pDialogSecurityCenter = true;
    this.cdr.markForCheck();
  }

  testPhiRedaction(): void {
    const result = this.securityService.maskPhi(this.securityTestInputText);
    this.securityTestOutputText = result.cleanData;
    this.securityTestPhiDetected = result.phiDetected;
    this.securityTestMaskedFields = result.maskedFields;
    this.cdr.markForCheck();
  }

  async testPasswordSecurity(): Promise<void> {
    this.securityPasswordResult = this.securityService.validatePasswordStrength(this.securityTestPasswordInput);
    const hashRes = await this.securityService.hashPassword(this.securityTestPasswordInput);
    this.securityGeneratedSalt = hashRes.salt;
    this.securityGeneratedHash = hashRes.hash;
    this.cdr.markForCheck();
  }

  generateDocumentSecurityToken(): void {
    const wsId = this.tenantWorkspaceService?.getActiveWorkspaceId() || 'ws_default';
    const ttlSeconds = (this.securityDocTokenDurationMinutes || 15) * 60;
    this.securityGeneratedDocToken = this.securityService.generateSignedDocumentAccessToken(
      this.securityDocTokenId || 'doc_sample',
      wsId,
      ttlSeconds,
      this.securityDocTokenPurpose
    );
    this.securityDocTokenVerification = this.securityService.verifySignedDocumentAccessToken(this.securityGeneratedDocToken);
    AppUtils.showSuccessViaToast(
      this.messageService,
      `Issued signed expirable token for document "${this.securityDocTokenId}".`
    );
    this.cdr.markForCheck();
  }

  private recordClinicalEvent(action: ClinicalAuditEvent['action'], detail: string): void {
    const actor = this.patientContextForm?.value?.clinician || 'Current clinician';
    this.clinicalWorkflow.record(action, actor, detail);
    this.clinicalAudit = this.clinicalWorkflow.listAudit();
  }

  previewWithSampleData(): void {
    try {
      const suppliedData = JSON.parse(this.previewDataText || '{}');
      const context = this.patientContextForm?.getRawValue() || {};
      const data = {
        ...suppliedData,
        patient: { ...(suppliedData.patient || {}), name: context.name || suppliedData.patient?.name, dateOfBirth: context.dateOfBirth || suppliedData.patient?.dateOfBirth, mrn: context.mrn || suppliedData.patient?.mrn, allergies: context.allergies || suppliedData.patient?.allergies },
        encounter: { ...(suppliedData.encounter || {}), name: context.encounter || suppliedData.encounter?.name },
        clinician: { ...(suppliedData.clinician || {}), name: context.clinician || suppliedData.clinician?.name },
        document: { ...(suppliedData.document || {}), signedAt: this.clinicalDocumentStatus === 'signed' ? new Date().toLocaleString() : '' },
      };
      const html = this.templateRenderer.render(this.grapeEditorService.editor.getHtml(), data);
      const css = this.grapeEditorService.editor.getCss();
      const formData = { html, css };
      try {
        sessionStorage.setItem('form_builder_preview_form', JSON.stringify(formData));
      } catch (e) {
        console.warn('Error caching preview form:', e);
      }
      this.pDialogDataPreview = false;
      this.recordClinicalEvent('previewed', 'Rendered a data-bound clinical document preview.');
      this.router.navigateByUrl('home/form-view', { state: { form: formData } });
    } catch {
      this.templateError = 'Sample data must be valid JSON.';
    }
  }

  private ensureHealthcareStarter(): void {
    const now = new Date().toISOString();
    if (!this.templateStore.list().some(template => template.id === 'healthcare-visit-summary')) this.templateStore.save({
      id: 'healthcare-visit-summary', name: 'Healthcare Visit Summary', category: 'healthcare', status: 'published', version: 1,
      design: null,
      html: '<div style="max-width:720px;margin:auto;padding:32px;font-family:Arial;color:#172554"><h1>Visit Summary</h1><p><strong>Patient:</strong> {{patient.name}}</p><p><strong>MRN:</strong> {{patient.mrn}}</p><table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left">Service</th><th style="text-align:right">Amount</th></tr></thead><tbody>{{#each items}}<tr><td>{{name}}</td><td style="text-align:right">{{amount}}</td></tr>{{/each}}</tbody></table><p style="text-align:right"><strong>Total: {{invoice.total}}</strong></p></div>',
      css: 'th, td { padding: 8px; border-bottom: 1px solid #cbd5e1; }',
      dataSchema: { patient: { name: 'string', mrn: 'string' }, invoice: { total: 'string' }, items: [{ name: 'string', amount: 'string' }] },
      sampleData: { patient: { name: 'Avery Johnson', mrn: 'MRN-1042' }, invoice: { total: '$1,250.00' }, items: [{ name: 'Consultation', amount: '$250.00' }, { name: 'Lab panel', amount: '$1,000.00' }] },
      createdAt: now, updatedAt: now,
    });
    if (!this.templateStore.list().some(template => template.id === 'healthcare-referral-letter')) this.templateStore.save({
      id: 'healthcare-referral-letter', name: 'Healthcare Referral Letter', category: 'healthcare', status: 'published', version: 1,
      design: null,
      html: '<div style="max-width:720px;margin:auto;padding:32px;font-family:Arial;color:#172554"><section style="border-left:5px solid #1d4ed8;padding-left:14px"><h1>Clinical Referral</h1><strong>{{patient.name}}</strong> · DOB {{patient.dateOfBirth}} · MRN {{patient.mrn}}<br><strong style="color:#b91c1c">Allergies: {{patient.allergies}}</strong></section><h3>Reason for referral</h3><p>{{clinical.reasonForReferral}}</p><h3>Relevant history</h3><p>{{clinical.history}}</p><p>Referring clinician: {{clinician.name}}</p></div>',
      css: '',
      dataSchema: { patient: { name: 'string', dateOfBirth: 'date', mrn: 'string', allergies: 'string' }, clinical: { reasonForReferral: 'string', history: 'string' }, clinician: { name: 'string' } },
      sampleData: { patient: { name: 'Avery Johnson', dateOfBirth: '1982-07-14', mrn: 'MRN-1042', allergies: 'Penicillin' }, clinical: { reasonForReferral: 'Cardiology assessment for exertional chest discomfort.', history: 'Hypertension; no previous cardiac intervention.' }, clinician: { name: 'Dr. Morgan Lee' } },
      createdAt: now, updatedAt: now,
    });
    if (!this.templateStore.list().some(template => template.id === 'healthcare-discharge-summary')) this.templateStore.save({
      id: 'healthcare-discharge-summary', name: 'Healthcare Discharge Summary', category: 'healthcare', status: 'published', version: 1,
      design: null,
      html: '<div style="max-width:720px;margin:auto;padding:32px;font-family:Arial;color:#172554"><h1>Discharge Summary</h1><p><strong>Patient:</strong> {{patient.name}} · {{patient.dateOfBirth}} · {{patient.mrn}}</p><p><strong>Allergies:</strong> {{patient.allergies}}</p><h3>Diagnosis</h3><p>{{clinical.diagnosis}}</p><h3>Discharge medications</h3><ul>{{#each medications}}<li>{{name}} — {{dose}} — {{frequency}}</li>{{/each}}</ul><h3>Follow-up plan</h3><p>{{clinical.followUp}}</p><p>Prepared by {{clinician.name}}</p></div>',
      css: '',
      dataSchema: { patient: { name: 'string', dateOfBirth: 'date', mrn: 'string', allergies: 'string' }, clinical: { diagnosis: 'string', followUp: 'string' }, medications: [{ name: 'string', dose: 'string', frequency: 'string' }], clinician: { name: 'string' } },
      sampleData: { patient: { name: 'Avery Johnson', dateOfBirth: '1982-07-14', mrn: 'MRN-1042', allergies: 'Penicillin' }, clinical: { diagnosis: 'Community-acquired pneumonia, improving.', followUp: 'Primary-care review in 48 hours; return for worsening breathlessness.' }, medications: [{ name: 'Azithromycin', dose: '500 mg', frequency: 'once daily for 3 days' }], clinician: { name: 'Dr. Morgan Lee' } },
      createdAt: now, updatedAt: now,
    });
  }

  editorHelp(): void {
    window.open('https://grapesjs.com/');
  }

  // --- Multi-Document Studio Methods ---

  loadConfiguredCategories(): void {
    this.configuredCategories = this.categoryService.getCategories();
    this.documentCategories = this.configuredCategories.map((c) => ({
      id: c.id,
      label: c.name,
      icon: c.icon,
      industry: c.industry,
      badgeColor: c.badgeColor,
    }));
    this.cdr.markForCheck();
  }

  initCategoryForms(): void {
    this.categoryForm = this.fb.group({
      id: ['', [Validators.required, Validators.pattern(/^[a-z0-9_-]+$/)]],
      name: ['', Validators.required],
      description: [''],
      industry: ['healthcare', Validators.required],
      icon: ['fa fa-folder-o', Validators.required],
      badgeColor: ['#2563eb'],
    });

    this.docTypeForm = this.fb.group({
      id: ['', [Validators.required, Validators.pattern(/^[a-z0-9_-]+$/)]],
      name: ['', Validators.required],
      description: [''],
      tags: [''],
    });
  }

  openTemplateGallery(): void {
    this.loadConfiguredCategories();
    this.templateSearchQuery = '';
    this.selectedDocumentCategory = 'all';
    this.selectedDocumentType = 'all';
    this.filterTemplates();
    this.pDialogTemplateGallery = true;
    this.cdr.markForCheck();
  }

  selectCategory(catId: DocumentCategoryId): void {
    this.selectedDocumentCategory = catId;
    this.selectedDocumentType = 'all';
    this.filterTemplates();
  }

  selectDocType(docTypeId: string): void {
    this.selectedDocumentType = docTypeId;
    this.filterTemplates();
  }

  getActiveCategoryDocTypes(): DocumentTypeDefinition[] {
    if (!this.selectedDocumentCategory || this.selectedDocumentCategory === 'all') {
      return [];
    }
    return this.categoryService.getDocumentTypesByCategory(this.selectedDocumentCategory);
  }

  openCategoryManager(): void {
    this.loadConfiguredCategories();
    this.pDialogManageCategories = true;
    this.cdr.markForCheck();
  }

  openAddCategoryDialog(): void {
    this.categoryForm.reset({
      id: '',
      name: '',
      description: '',
      industry: 'healthcare',
      icon: 'fa fa-folder-o',
      badgeColor: '#2563eb',
    });
    this.pDialogAddCategory = true;
    this.cdr.markForCheck();
  }

  saveCategoryFromModal(): void {
    if (this.categoryForm.invalid) {
      AppUtils.showWarnViaToast(this.messageService, 'Please provide a valid Category ID (lowercase/hyphens) and Name');
      return;
    }
    const val = this.categoryForm.value;
    const cat: CategoryDefinition = {
      id: val.id.trim().toLowerCase(),
      name: val.name.trim(),
      description: val.description?.trim() || '',
      industry: val.industry,
      icon: val.icon?.trim() || 'fa fa-folder-o',
      badgeColor: val.badgeColor || '#2563eb',
      isBuiltIn: false,
      sortOrder: this.configuredCategories.length + 1,
      documentTypes: [],
    };
    this.categoryService.saveCategory(cat);
    this.loadConfiguredCategories();
    this.pDialogAddCategory = false;
    AppUtils.showSuccessViaToast(this.messageService, `Category "${cat.name}" created`);
    this.cdr.markForCheck();
  }

  deleteCategoryFromModal(cat: CategoryDefinition): void {
    if (cat.isBuiltIn) {
      AppUtils.showWarnViaToast(this.messageService, 'Built-in categories cannot be deleted');
      return;
    }
    const success = this.categoryService.deleteCategory(cat.id);
    if (success) {
      this.loadConfiguredCategories();
      if (this.selectedDocumentCategory === cat.id) {
        this.selectCategory('all');
      }
      AppUtils.showSuccessViaToast(this.messageService, `Category "${cat.name}" deleted`);
    } else {
      AppUtils.showErrorViaToast(this.messageService, 'Could not delete category');
    }
    this.cdr.markForCheck();
  }

  openAddDocTypeDialog(cat: CategoryDefinition): void {
    this.selectedCategoryForDocType = cat;
    this.docTypeForm.reset({
      id: '',
      name: '',
      description: '',
      tags: '',
    });
    this.pDialogAddDocType = true;
    this.cdr.markForCheck();
  }

  saveDocTypeFromModal(): void {
    if (!this.selectedCategoryForDocType || this.docTypeForm.invalid) {
      AppUtils.showWarnViaToast(this.messageService, 'Please provide a valid Document Type ID and Name');
      return;
    }
    const val = this.docTypeForm.value;
    const tags = (val.tags || '')
      .split(',')
      .map((t: string) => t.trim().toLowerCase())
      .filter((t: string) => !!t);

    const docType: DocumentTypeDefinition = {
      id: val.id.trim().toLowerCase(),
      name: val.name.trim(),
      description: val.description?.trim() || '',
      categoryId: this.selectedCategoryForDocType.id,
      industry: this.selectedCategoryForDocType.industry,
      tags,
      isBuiltIn: false,
    };

    this.categoryService.addDocumentType(this.selectedCategoryForDocType.id, docType);
    this.loadConfiguredCategories();
    this.pDialogAddDocType = false;
    AppUtils.showSuccessViaToast(this.messageService, `Document type "${docType.name}" added`);
    this.cdr.markForCheck();
  }

  resetCategoriesToDefault(): void {
    this.categoryService.resetToDefaults();
    this.loadConfiguredCategories();
    this.selectCategory('all');
    AppUtils.showSuccessViaToast(this.messageService, 'Categories reset to initial platform defaults');
    this.cdr.markForCheck();
  }

  filterTemplates(): void {
    const q = (this.templateSearchQuery || '').toLowerCase().trim();
    this.filteredDocumentFormats = this.documentFormats.filter((fmt) => {
      const matchCat = this.categoryService.isFormatMatchingCategory(
        fmt.category,
        this.selectedDocumentCategory
      );
      const matchDocType =
        !this.selectedDocumentType ||
        this.selectedDocumentType === 'all' ||
        fmt.documentTypeId === this.selectedDocumentType ||
        fmt.id === this.selectedDocumentType;
      const matchSearch =
        !q ||
        fmt.name.toLowerCase().includes(q) ||
        fmt.description.toLowerCase().includes(q) ||
        fmt.features.some((f) => f.toLowerCase().includes(q));
      return matchCat && matchDocType && matchSearch;
    });
    this.cdr.markForCheck();
  }

  loadDocumentTemplate(
    format: DocumentFormat,
    mode: 'replace' | 'append' = 'replace'
  ): void {
    if (!this.grapeEditorService.editor) {
      return;
    }
    if (mode === 'replace') {
      this.grapeEditorService.editor.setComponents(format.defaultHtml);
    } else {
      this.grapeEditorService.editor.addComponents(format.defaultHtml);
    }
    this.activeFormatName = format.name;
    this.pDialogTemplateGallery = false;
    AppUtils.showSuccessViaToast(
      this.messageService,
      `Loaded "${format.name}" template onto canvas!`
    );
    this.cdr.markForCheck();
  }

  onCategoryFilterChange(catValue: string): void {
    this.selectedTemplateCategory = catValue;
    if (this.grapeEditorService?.editor) {
      this.editorBlockManagerService.filterReadyTemplates(
        this.grapeEditorService.editor,
        catValue
      );
    }
    // Synchronize the selectedDocumentCategory for the gallery dialog
    if (catValue === 'invoices') this.selectedDocumentCategory = 'finance';
    else if (catValue === 'reports') this.selectedDocumentCategory = 'corporate';
    else if (catValue === 'medical') this.selectedDocumentCategory = 'medical';
    else if (catValue === 'certificates') this.selectedDocumentCategory = 'corporate';
    else if (catValue === 'menu') this.selectedDocumentCategory = 'hospitality';
    else if (catValue === 'delivery') this.selectedDocumentCategory = 'operations';
    else if (catValue === 'hr') this.selectedDocumentCategory = 'corporate';
    else if (catValue === 'proposals') this.selectedDocumentCategory = 'proposals';
    else this.selectedDocumentCategory = 'all';
    this.filterTemplates();
    this.cdr.markForCheck();
  }

  setCanvasLayout(mode: 'free' | 'a4-portrait' | 'a4-landscape' | 'receipt'): void {
    this.canvasLayoutMode = mode;
    this.cdr.markForCheck();
  }

  switchLanguage(lang: 'English' | 'German'): void {
    this.currentLang = lang;
    this.translate.use(lang);
    localStorage.setItem('form_builder_lang', lang);
    this.updateCategoryOptions(lang);
    const msg = lang === 'German' ? 'Sprache auf Deutsch umgestellt' : 'Language switched to English';
    AppUtils.showSuccessViaToast(this.messageService, msg);
    this.cdr.markForCheck();
  }

  updateCategoryOptions(lang: 'English' | 'German'): void {
    if (lang === 'German') {
      this.templateCategoryOptions = [
        { label: 'Kategorie', value: 'all', icon: 'pi pi-th-large' },
        { label: 'Rechnungen & Abrechnung', value: 'invoices', icon: 'pi pi-dollar' },
        { label: 'Berichte & KPIs', value: 'reports', icon: 'pi pi-chart-bar' },
        { label: 'Medizinisch & Klinisch', value: 'medical', icon: 'pi pi-heart' },
        { label: 'Zertifikate & Urkunden', value: 'certificates', icon: 'pi pi-file' },
        { label: 'Speisekarten & Gastronomie', value: 'menu', icon: 'pi pi-compass' },
        { label: 'Lieferung & Logistik', value: 'delivery', icon: 'pi pi-box' },
        { label: 'Universelle Dokumentblöcke', value: 'universal', icon: 'pi pi-check-circle' },
        { label: 'HR-Dokumente', value: 'hr', icon: 'pi pi-briefcase' },
        { label: 'Angebote & Konzepte', value: 'proposals', icon: 'pi pi-paperclip' },
      ];
    } else {
      this.templateCategoryOptions = [
        { label: 'Category', value: 'all', icon: 'pi pi-th-large' },
        { label: 'Invoices & Billing', value: 'invoices', icon: 'pi pi-dollar' },
        { label: 'Reports & KPIs', value: 'reports', icon: 'pi pi-chart-bar' },
        { label: 'Medical & Clinical', value: 'medical', icon: 'pi pi-heart' },
        { label: 'Certificates & Awards', value: 'certificates', icon: 'pi pi-file' },
        { label: 'Restaurant Menus', value: 'menu', icon: 'pi pi-compass' },
        { label: 'Delivery & Logistics', value: 'delivery', icon: 'pi pi-box' },
        { label: 'Universal Document Blocks', value: 'universal', icon: 'pi pi-check-circle' },
        { label: 'HR Documents', value: 'hr', icon: 'pi pi-briefcase' },
        { label: 'Proposals & Bids', value: 'proposals', icon: 'pi pi-paperclip' },
      ];
    }
  }

  onAISearch(): void {
    if (!this.aiSearchQuery || !this.aiSearchQuery.trim()) {
      return;
    }
    const query = this.aiSearchQuery.trim();
    this.aiSearchResponse = this.aiSearchService.search(query, this.documentFormats);
    this.pDialogAISearchResults = true;
    this.cdr.markForCheck();
  }

  useAISearchTemplate(tmpl: DocumentFormat, mode: 'replace' | 'append' = 'replace'): void {
    this.loadDocumentTemplate(tmpl, mode);
    this.pDialogAISearchResults = false;
    this.aiSearchQuery = '';
    this.cdr.markForCheck();
  }

  hasExtractedAttributes(): boolean {
    if (!this.aiSearchResponse || !this.aiSearchResponse.extractedAttributes) {
      return false;
    }
    const a = this.aiSearchResponse.extractedAttributes;
    return !!(a.industry || a.documentType || a.language || a.country || a.audience);
  }

  // Phase 6: Create with AI via Structured Intermediate Representation
  openCreateWithAIDialog(initialPrompt?: string): void {
    if (initialPrompt && initialPrompt.trim()) {
      this.aiGenPrompt = initialPrompt.trim();
    } else if (!this.aiGenPrompt) {
      this.aiGenPrompt = 'Create a German physiotherapy patient intake form.';
    }
    this.pDialogCreateWithAI = true;
    if (!this.generatedIR) {
      this.generateWithAI();
    }
    this.cdr.markForCheck();
  }

  setAIGenPromptPreset(preset: string): void {
    this.aiGenPrompt = preset;
    const q = preset.toLowerCase();
    if (q.includes('german') || q.includes('deutsch') || q.includes('physiotherapie')) {
      this.aiGenLanguage = 'German';
    } else {
      this.aiGenLanguage = 'English';
    }

    if (q.includes('physio') || q.includes('krankengymnastik')) {
      this.aiGenIndustry = 'Physiotherapy';
    } else if (q.includes('dent') || q.includes('zahn')) {
      this.aiGenIndustry = 'Dental';
    } else if (q.includes('consent') || q.includes('einwilligung')) {
      this.aiGenIndustry = 'Patient Consent';
    } else if (q.includes('discharge') || q.includes('entlass')) {
      this.aiGenIndustry = 'Clinical Documents';
    } else if (q.includes('invoice') || q.includes('rechnung')) {
      this.aiGenIndustry = 'Billing & Invoices';
    }

    this.generateWithAI();
  }

  generateWithAI(): void {
    if (!this.aiGenPrompt || !this.aiGenPrompt.trim()) {
      return;
    }
    this.isGeneratingWithAI = true;
    this.cdr.markForCheck();

    try {
      const ir = this.aiGenService.generateTemplateIR(this.aiGenPrompt, {
        language: this.aiGenLanguage,
        industry: this.aiGenIndustry
      });

      this.generatedIR = ir;
      this.compiledPreviewHtml = this.aiGenService.compileIRToHtml(ir);
      this.irJsonView = JSON.stringify(ir, null, 2);
    } catch (err) {
      console.error('Error generating template IR:', err);
      AppUtils.showErrorViaToast(this.messageService, 'Failed to generate template via AI IR.');
    } finally {
      this.isGeneratingWithAI = false;
      this.cdr.markForCheck();
    }
  }

  applyGeneratedTemplate(mode: 'replace' | 'append' = 'replace'): void {
    if (!this.generatedIR || !this.compiledPreviewHtml) {
      return;
    }

    const docFormat: DocumentFormat = {
      id: `ai-gen-${this.generatedIR.id || Date.now()}`,
      name: this.generatedIR.title,
      shortName: this.generatedIR.title.slice(0, 20),
      icon: 'pi pi-sparkles',
      emoji: '✨',
      category: this.generatedIR.industry || 'physiotherapy',
      categoryLabel: this.generatedIR.industry || 'Physiotherapy',
      documentTypeId: this.generatedIR.templateType || 'form',
      description: `AI-generated template (${this.generatedIR.language}, ${this.generatedIR.country || 'Universal'})`,
      features: ['AI Intermediate Representation', 'Validated Schema', 'Print-Optimized'],
      defaultHtml: this.compiledPreviewHtml,
      tokens: [],
      previewSvg: ''
    };

    this.loadDocumentTemplate(docFormat, mode);
    this.pDialogCreateWithAI = false;
    AppUtils.showSuccessViaToast(
      this.messageService,
      `Template "${this.generatedIR.title}" loaded to canvas.`
    );
    this.cdr.markForCheck();
  }

  private extractSchemaFromIR(ir: TemplateIR): any[] {
    const fields: any[] = [];
    if (!ir || !ir.sections) return fields;
    for (const sec of ir.sections) {
      if (sec.fields) {
        for (const f of sec.fields) {
          fields.push({
            name: f.token || f.id,
            label: f.label,
            type: f.type,
            required: !!f.required
          });
        }
      }
    }
    return fields;
  }

  // =========================================================================
  // Phase 7: Document Instance Layer & Generation Pipeline Methods
  // =========================================================================

  loadDocumentInstances(): void {
    this.documentsList = this.documentService.getDocumentsForActiveWorkspace();
    this.cdr.markForCheck();
  }

  openDocumentInstancesDialog(): void {
    this.loadDocumentInstances();
    this.pDialogDocumentInstances = true;
    this.cdr.markForCheck();
  }

  getDocumentCountByStatus(status: string): number {
    if (!this.documentsList) return 0;
    return this.documentsList.filter((d) => d.status === status).length;
  }

  getFilteredDocuments(): DocumentInstance[] {
    let docs = this.documentsList || [];
    if (this.docStatusFilter && this.docStatusFilter !== 'all') {
      docs = docs.filter((d) => d.status === this.docStatusFilter);
    }
    if (this.docSearchQuery && this.docSearchQuery.trim()) {
      const q = this.docSearchQuery.trim().toLowerCase();
      docs = docs.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          (d.patientName && d.patientName.toLowerCase().includes(q)) ||
          (d.patientMrn && d.patientMrn.toLowerCase().includes(q)) ||
          (d.templateName && d.templateName.toLowerCase().includes(q))
      );
    }
    return docs;
  }

  openGenerateDocumentDialog(format?: DocumentFormat): void {
    const samples = this.documentService.getSamplePayloads();
    let sampleKey = 'physiotherapy';

    if (format) {
      this.docGenTemplateHtml = format.defaultHtml;
      this.docGenTemplateName = format.name;
      this.docGenTemplateId = format.id;
      this.docGenCategory = format.category;
      this.docGenTitle = `${format.name} - Instance`;
      if (format.id.includes('dent') || format.category === 'dental') {
        sampleKey = 'dental';
      } else if (format.id.includes('discharge')) {
        sampleKey = 'discharge';
      } else if (format.id.includes('invoice')) {
        sampleKey = 'invoice';
      }
    } else {
      const canvasHtml = this.grapeEditorService?.editor?.getHtml() || '';
      this.docGenTemplateHtml = canvasHtml || this.documentFormats[0]?.defaultHtml || '';
      this.docGenTemplateName = this.activeFormatName || 'Active Canvas Form';
      this.docGenTemplateId = `canvas_tmpl_${Date.now()}`;
      this.docGenCategory = 'clinical_documents';
      this.docGenTitle = `${this.docGenTemplateName} - Document Instance`;
    }

    const payloadObj = samples[sampleKey] || samples['physiotherapy'];
    this.docGenPayloadText = JSON.stringify(payloadObj, null, 2);
    this.updateDocGenPreview();
    this.pDialogGenerateDocument = true;
    this.cdr.markForCheck();
  }

  fillDocGenSample(type: string): void {
    const samples = this.documentService.getSamplePayloads();
    if (samples[type]) {
      this.docGenPayloadText = JSON.stringify(samples[type], null, 2);
      this.updateDocGenPreview();
    }
  }

  updateDocGenPreview(): void {
    try {
      const parsed = JSON.parse(this.docGenPayloadText || '{}');
      this.docGenPreviewHtml = DataBindingEngine.render(
        this.docGenTemplateHtml || '',
        parsed,
        { locale: this.currentLang === 'German' ? 'de-DE' : 'en-US' }
      );
    } catch (e) {
      this.docGenPreviewHtml = `<div class="p-3 text-red-500 font-semibold">Invalid JSON Payload: ${(e as any)?.message}</div>`;
    }
    this.cdr.markForCheck();
  }

  generateAndSaveDocumentInstance(): void {
    if (!this.rbacService.hasPermission('document:generate')) {
      AppUtils.showErrorViaToast(
        this.messageService,
        'Access Denied: Missing required permission document:generate'
      );
      return;
    }

    if (!this.docGenTitle || !this.docGenTitle.trim()) {
      AppUtils.showErrorViaToast(this.messageService, 'Document Title is required.');
      return;
    }

    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(this.docGenPayloadText || '{}');
    } catch (e) {
      AppUtils.showErrorViaToast(this.messageService, 'JSON payload syntax error.');
      return;
    }

    const newDoc = this.documentService.generateAndSaveDocument({
      templateId: this.docGenTemplateId || 'custom_template',
      templateName: this.docGenTemplateName || 'Clinical Template',
      title: this.docGenTitle.trim(),
      templateHtml: this.docGenTemplateHtml,
      payload,
      category: this.docGenCategory,
      options: {
        locale: this.currentLang === 'German' ? 'de-DE' : 'en-US',
        actor: 'Dr. Clinician',
        initialStatus: 'rendered'
      }
    });

    this.loadDocumentInstances();
    this.pDialogGenerateDocument = false;
    AppUtils.showSuccessViaToast(
      this.messageService,
      `Document "${newDoc.title}" generated and stored successfully!`
    );
    this.cdr.markForCheck();
  }

  openDocumentInCanvas(doc: DocumentInstance): void {
    if (!this.grapeEditorService?.editor) return;
    const contentToLoad = doc.renderedHtml || doc.rawTemplateHtml || '';
    this.grapeEditorService.editor.setComponents(contentToLoad);
    this.activeFormatName = doc.title;
    this.pDialogDocumentInstances = false;
    this.pDialogDocumentView = false;
    AppUtils.showSuccessViaToast(
      this.messageService,
      `Loaded document "${doc.title}" onto canvas.`
    );
    this.cdr.markForCheck();
  }

  viewDocumentInstance(doc: DocumentInstance): void {
    this.selectedDocumentForView = doc;
    this.pDialogDocumentView = true;
    this.cdr.markForCheck();
  }

  changeDocumentStatus(doc: DocumentInstance, status: DocumentStatus): void {
    this.documentService.updateDocumentStatus(doc.id, status, 'Dr. Clinician');
    this.loadDocumentInstances();
    if (this.selectedDocumentForView && this.selectedDocumentForView.id === doc.id) {
      this.selectedDocumentForView = this.documentService.getDocumentById(doc.id) || null;
    }
    AppUtils.showSuccessViaToast(
      this.messageService,
      `Document status updated to ${status.toUpperCase()}`
    );
    this.cdr.markForCheck();
  }

  deleteDocumentInstance(doc: DocumentInstance): void {
    if (!this.rbacService.hasPermission('document:delete')) {
      AppUtils.showErrorViaToast(
        this.messageService,
        'Access Denied: Missing required permission document:delete'
      );
      return;
    }
    this.documentService.deleteDocument(doc.id);
    this.loadDocumentInstances();
    if (this.selectedDocumentForView?.id === doc.id) {
      this.selectedDocumentForView = null;
      this.pDialogDocumentView = false;
    }
    AppUtils.showSuccessViaToast(
      this.messageService,
      `Deleted document "${doc.title}".`
    );
    this.cdr.markForCheck();
  }

  exportDocAsHtml(doc: DocumentInstance): void {
    this.documentService.exportDocumentAsHtml(doc);
    AppUtils.showSuccessViaToast(this.messageService, `Exported HTML for "${doc.title}".`);
  }

  exportDocAsJson(doc: DocumentInstance): void {
    this.documentService.exportDocumentAsJson(doc);
    AppUtils.showSuccessViaToast(this.messageService, `Exported JSON for "${doc.title}".`);
  }

  openBatchGenerateDialog(): void {
    const batchDemoRecords = [
      {
        patient: { name: 'Erika Musterfrau', dob: '1979-04-12', mrn: 'MRN-DE-1101', phone: '+49 30 111-222' },
        doctor: { name: 'Dr. Stefan Berger' },
        pain_score: '6/10',
        treatment_goals: 'LWS Mobilisation'
      },
      {
        patient: { name: 'Johann Becker', dob: '1965-09-28', mrn: 'MRN-DE-1102', phone: '+49 30 333-444' },
        doctor: { name: 'Dr. Stefan Berger' },
        pain_score: '8/10',
        treatment_goals: 'Schmerztherapie & Haltungstraining'
      },
      {
        patient: { name: 'Greta Lehmann', dob: '1992-12-05', mrn: 'MRN-DE-1103', phone: '+49 30 555-666' },
        doctor: { name: 'Dr. Stefan Berger' },
        pain_score: '4/10',
        treatment_goals: 'Post-operative Knie-Rehabilitation'
      }
    ];

    this.batchRecordsJson = JSON.stringify(batchDemoRecords, null, 2);
    this.batchTitlePattern = 'Physio Befund - {{patient.name}} ({{patient.mrn}})';
    this.batchResult = null;

    const canvasHtml = this.grapeEditorService?.editor?.getHtml() || '';
    this.batchTemplateHtml = canvasHtml || this.documentFormats[0]?.defaultHtml || '';
    this.batchTemplateName = this.activeFormatName || 'Physiotherapy Intake';
    this.batchTemplateId = 'tmpl_batch_physio';

    this.pDialogBatchGenerate = true;
    this.cdr.markForCheck();
  }

  executeBatchGenerate(): void {
    let records: any[] = [];
    try {
      records = JSON.parse(this.batchRecordsJson || '[]');
      if (!Array.isArray(records) || records.length === 0) {
        AppUtils.showErrorViaToast(this.messageService, 'Records must be a non-empty JSON array.');
        return;
      }
    } catch (e) {
      AppUtils.showErrorViaToast(this.messageService, 'Invalid JSON array for batch generation.');
      return;
    }

    this.batchResult = this.documentService.batchGenerate({
      templateId: this.batchTemplateId || 'batch_tmpl',
      templateName: this.batchTemplateName || 'Clinical Template',
      templateHtml: this.batchTemplateHtml,
      records,
      titlePattern: this.batchTitlePattern,
      category: 'physiotherapy'
    });

    this.loadDocumentInstances();
    AppUtils.showSuccessViaToast(
      this.messageService,
      `Batch completed: ${this.batchResult.successful} documents generated!`
    );
    this.cdr.markForCheck();
  }

  // =========================================================================
  // Phase 8: Export & Document Generation / PDF Pipeline Methods
  // =========================================================================

  openPdfExportDialog(targetHtml?: string, title?: string, doc?: DocumentInstance): void {
    this.pdfExportSourceDoc = doc || null;

    let contentToPrint = targetHtml;
    if (!contentToPrint) {
      // Capture canvas content
      const canvasHtml = this.grapeEditorService?.editor?.getHtml() || '';
      const canvasCss = this.grapeEditorService?.editor?.getCss() || '';
      contentToPrint = canvasHtml ? `${canvasHtml}<style>${canvasCss}</style>` : '';
    }

    if (!contentToPrint) {
      contentToPrint = `<div style="padding: 24px; text-align: center; color: #64748b; font-family: sans-serif;">
        <h2 style="color: #0f172a; margin-bottom: 8px;">Empty Document Canvas</h2>
        <p>No document content is currently available to export. Please design or load a document first.</p>
      </div>`;
    }

    this.pdfTargetContentHtml = contentToPrint;

    const docTitle = title || doc?.title || this.activeFormatName || 'Healthcare Clinical Record';
    const mrn = doc?.patientMrn || 'MRN-2026-98214';

    this.pdfExportOptions = {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: 'normal',
      includeHeader: true,
      includeFooter: true,
      includePageNumbers: true,
      watermark: 'none',
      customWatermarkText: '',
      includeVerificationQr: true,
      verificationCode: `VERIFIED-${doc?.id || Date.now()}`,
      includeBarcode: true,
      barcodeValue: mrn,
      documentTitle: docTitle,
      organizationName: 'HEALTHCARE MEDICAL NETWORK',
      footerNote: 'Confidential Medical Record. Unauthorized duplication or disclosure prohibited under DSGVO / EU-GDPR.'
    };

    this.updatePdfPreview();
    this.pDialogPdfExport = true;
    this.cdr.markForCheck();
  }

  updatePdfPreview(): void {
    this.pdfPreviewHtml = this.pdfExportService.buildPrintPreviewHtml(
      this.pdfTargetContentHtml,
      this.pdfExportOptions
    );
    this.cdr.markForCheck();
  }

  executePrint(): void {
    this.pdfExportService.triggerPrint(
      this.pdfTargetContentHtml,
      this.pdfExportOptions
    );
    AppUtils.showSuccessViaToast(
      this.messageService,
      `Print spooler dispatched for "${this.pdfExportOptions.documentTitle}".`
    );
  }

  downloadPrintableHtml(): void {
    this.pdfExportService.exportStandalonePrintHtml(
      this.pdfTargetContentHtml,
      this.pdfExportOptions,
      this.pdfExportOptions.documentTitle
    );
    AppUtils.showSuccessViaToast(
      this.messageService,
      `Downloaded standalone print package for "${this.pdfExportOptions.documentTitle}".`
    );
  }

  // =========================================================================
  // Phase 9: API-First Architecture & Developer Studio Methods
  // =========================================================================

  openApiPortal(): void {
    this.apiEndpoints = this.apiClientService.getEndpointDefinitions();
    if (!this.selectedApiEndpoint && this.apiEndpoints.length > 0) {
      this.selectedApiEndpoint = this.apiEndpoints[0];
      this.apiRequestBodyText = JSON.stringify(this.selectedApiEndpoint.sampleBody || {}, null, 2);
    }
    const keys = this.apiClientService.getApiKeys();
    if (!this.selectedApiKey || !keys.some(k => k.id === this.selectedApiKey?.id)) {
      this.selectedApiKey = this.apiClientService.getActiveApiKey() || keys[0] || null;
    }
    this.updateApiCodeSnippet();
    this.pDialogApiPortal = true;
    this.cdr.markForCheck();
  }

  selectApiEndpoint(endpoint: ApiEndpointDefinition): void {
    this.selectedApiEndpoint = endpoint;
    this.apiRequestBodyText = JSON.stringify(endpoint.sampleBody || {}, null, 2);
    this.apiResponseResult = null;
    this.updateApiCodeSnippet();
    this.cdr.markForCheck();
  }

  setApiActiveTab(tab: 'console' | 'keys' | 'snippets' | 'audit'): void {
    this.apiActiveTab = tab;
    this.updateApiCodeSnippet();
    this.cdr.markForCheck();
  }

  async executeApiConsoleRequest(): Promise<void> {
    if (!this.selectedApiEndpoint) return;

    this.isExecutingApiRequest = true;
    this.apiResponseResult = null;
    this.cdr.markForCheck();

    let parsedBody: any = undefined;
    if (this.selectedApiEndpoint.method !== 'GET' && this.apiRequestBodyText.trim()) {
      try {
        parsedBody = JSON.parse(this.apiRequestBodyText);
      } catch (e) {
        this.isExecutingApiRequest = false;
        AppUtils.showErrorViaToast(this.messageService, 'Invalid JSON in request body.');
        this.cdr.markForCheck();
        return;
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-API-Key': this.selectedApiKey?.secretKey || '',
      'X-Workspace-Id': this.apiWorkspaceIdHeader || 'ws_default',
    };

    try {
      const response = await this.apiClientService.dispatch({
        method: this.selectedApiEndpoint.method,
        endpoint: this.selectedApiEndpoint.path,
        headers,
        body: parsedBody,
      });

      this.apiResponseResult = response;

      if (response.status >= 200 && response.status < 300) {
        AppUtils.showSuccessViaToast(
          this.messageService,
          `API ${response.status} ${response.statusText} (${response.durationMs}ms)`
        );
      } else {
        AppUtils.showWarnViaToast(
          this.messageService,
          `API ${response.status} ${response.statusText}: ${response.error?.message || 'Check error details.'}`
        );
      }
    } catch (err: any) {
      AppUtils.showErrorViaToast(this.messageService, `API execution error: ${err?.message || err}`);
    } finally {
      this.isExecutingApiRequest = false;
      this.cdr.markForCheck();
    }
  }

  updateApiCodeSnippet(): void {
    if (!this.selectedApiEndpoint) return;

    let parsedBody: any = undefined;
    try {
      if (this.apiRequestBodyText.trim()) {
        parsedBody = JSON.parse(this.apiRequestBodyText);
      }
    } catch (e) {}

    const key = this.selectedApiKey?.secretKey || 'sk_live_sample_key';
    const ws = this.apiWorkspaceIdHeader || 'ws_default';

    if (this.apiSnippetLang === 'curl') {
      this.generatedCodeSnippet = this.apiClientService.generateCurlSnippet(
        this.selectedApiEndpoint,
        parsedBody,
        key,
        ws
      );
    } else if (this.apiSnippetLang === 'javascript') {
      this.generatedCodeSnippet = this.apiClientService.generateFetchSnippet(
        this.selectedApiEndpoint,
        parsedBody,
        key,
        ws
      );
    } else {
      this.generatedCodeSnippet = this.apiClientService.generatePythonSnippet(
        this.selectedApiEndpoint,
        parsedBody,
        key,
        ws
      );
    }
  }

  setApiSnippetLang(lang: 'curl' | 'javascript' | 'python'): void {
    this.apiSnippetLang = lang;
    this.updateApiCodeSnippet();
    this.cdr.markForCheck();
  }

  openCreateApiKeyModal(): void {
    this.newApiKeyName = '';
    this.newApiKeyWorkspace = this.apiWorkspaceIdHeader || 'ws_default';
    this.newApiKeyRateLimit = 60;
    this.pDialogCreateApiKey = true;
    this.cdr.markForCheck();
  }

  submitCreateApiKey(): void {
    if (!this.rbacService.hasPermission('api_key:manage')) {
      AppUtils.showErrorViaToast(
        this.messageService,
        'Access Denied: Missing required permission api_key:manage'
      );
      return;
    }

    if (!this.newApiKeyName.trim()) {
      AppUtils.showErrorViaToast(this.messageService, 'API Key name is required.');
      return;
    }

    const created = this.apiClientService.createApiKey(
      this.newApiKeyName.trim(),
      this.newApiKeyWorkspace || 'ws_default',
      this.newApiKeyRateLimit || 60
    );

    this.createdApiKeyNotice = created;
    this.selectedApiKey = created;
    this.pDialogCreateApiKey = false;
    this.updateApiCodeSnippet();

    AppUtils.showSuccessViaToast(
      this.messageService,
      `Created API key "${created.name}".`
    );
    this.cdr.markForCheck();
  }

  revokeApiKey(key: ApiKey): void {
    if (!this.rbacService.hasPermission('api_key:manage')) {
      AppUtils.showErrorViaToast(
        this.messageService,
        'Access Denied: Missing required permission api_key:manage'
      );
      return;
    }
    this.apiClientService.revokeApiKey(key.id);
    AppUtils.showWarnViaToast(this.messageService, `API key "${key.name}" revoked.`);
    this.cdr.markForCheck();
  }

  deleteApiKey(key: ApiKey): void {
    if (!this.rbacService.hasPermission('api_key:manage')) {
      AppUtils.showErrorViaToast(
        this.messageService,
        'Access Denied: Missing required permission api_key:manage'
      );
      return;
    }
    this.apiClientService.deleteApiKey(key.id);
    if (this.selectedApiKey?.id === key.id) {
      this.selectedApiKey = this.apiClientService.getActiveApiKey() || null;
    }
    AppUtils.showSuccessViaToast(this.messageService, `API key "${key.name}" deleted.`);
    this.cdr.markForCheck();
  }

  copyToClipboard(text: string, label: string = 'Copied'): void {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      AppUtils.showSuccessViaToast(this.messageService, `${label} to clipboard!`);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      AppUtils.showSuccessViaToast(this.messageService, `${label} to clipboard!`);
    }
  }

  copyApiResponseJson(): void {
    if (!this.apiResponseResult) return;
    this.copyToClipboard(JSON.stringify(this.apiResponseResult, null, 2), 'Response JSON copied');
  }

  // =========================================================================
  // Phase 10: Multi-Tenancy & Workspace Switcher Methods
  // =========================================================================

  openWorkspaceSwitcher(): void {
    this.tenantOrganizations = this.tenantWorkspaceService.getOrganizations();
    this.activeOrganization = this.tenantWorkspaceService.getActiveOrganization();
    this.selectedOrgForWorkspaceView = this.activeOrganization || this.tenantOrganizations[0] || null;
    this.activeWorkspace = this.tenantWorkspaceService.getActiveWorkspace();
    this.tenantWorkspaces = this.tenantWorkspaceService.getWorkspaces();
    if (this.activeWorkspace) {
      this.currentWorkspaceUsers = this.tenantWorkspaceService.getWorkspaceUsers(this.activeWorkspace.id);
    }
    this.pDialogWorkspaceSwitcher = true;
    this.cdr.markForCheck();
  }

  selectWorkspace(ws: Workspace): void {
    const switched = this.tenantWorkspaceService.switchWorkspace(ws.id);
    if (switched) {
      this.activeWorkspace = ws;
      this.activeOrganization = this.tenantWorkspaceService.getActiveOrganization();
      this.currentWorkspaceUsers = this.tenantWorkspaceService.getWorkspaceUsers(ws.id);
      this.apiWorkspaceIdHeader = ws.id;
      this.loadDocumentInstances();
      try {
        this.auditLogService.recordEvent('workspace.switched', 'workspace', ws.id, {
          workspaceName: ws.name,
          organizationName: this.activeOrganization?.name,
        });
      } catch {
        // Safe fallback
      }
      AppUtils.showSuccessViaToast(
        this.messageService,
        `Switched to Workspace: "${ws.name}" (${this.activeOrganization?.name})`
      );
      this.pDialogWorkspaceSwitcher = false;
      this.cdr.markForCheck();
    }
  }

  selectOrgForWorkspaceView(org: Organization): void {
    this.selectedOrgForWorkspaceView = org;
    this.cdr.markForCheck();
  }

  openCreateOrgModal(): void {
    this.newOrgName = '';
    this.newOrgDescription = '';
    this.pDialogCreateOrganization = true;
    this.cdr.markForCheck();
  }

  submitCreateOrg(): void {
    if (!this.rbacService.hasPermission('workspace:manage')) {
      AppUtils.showErrorViaToast(
        this.messageService,
        'Access Denied: Missing required permission workspace:manage'
      );
      return;
    }

    if (!this.newOrgName.trim()) {
      AppUtils.showErrorViaToast(this.messageService, 'Organization name is required.');
      return;
    }
    const created = this.tenantWorkspaceService.createOrganization({
      name: this.newOrgName.trim(),
      description: this.newOrgDescription.trim(),
    });
    this.activeOrganization = this.tenantWorkspaceService.getActiveOrganization();
    this.activeWorkspace = this.tenantWorkspaceService.getActiveWorkspace();
    this.tenantOrganizations = this.tenantWorkspaceService.getOrganizations();
    this.tenantWorkspaces = this.tenantWorkspaceService.getWorkspaces();
    this.selectedOrgForWorkspaceView = created;
    this.pDialogCreateOrganization = false;
    AppUtils.showSuccessViaToast(
      this.messageService,
      `Created organization "${created.name}" with default workspace.`
    );
    this.cdr.markForCheck();
  }

  openCreateWorkspaceModal(org?: Organization): void {
    if (org) {
      this.selectedOrgForWorkspaceView = org;
    }
    this.newWsName = '';
    this.newWsDescription = '';
    this.newWsIndustry = (this.selectedOrgForWorkspaceView?.metadata?.['industry'] as string) || 'healthcare';
    this.newWsLanguage = 'de';
    this.newWsCountry = 'DE';
    this.pDialogCreateWorkspace = true;
    this.cdr.markForCheck();
  }

  submitCreateWorkspace(): void {
    if (!this.rbacService.hasPermission('workspace:manage')) {
      AppUtils.showErrorViaToast(
        this.messageService,
        'Access Denied: Missing required permission workspace:manage'
      );
      return;
    }

    const org = this.selectedOrgForWorkspaceView || this.activeOrganization;
    if (!org) {
      AppUtils.showErrorViaToast(this.messageService, 'Select an organization first.');
      return;
    }
    if (!this.newWsName.trim()) {
      AppUtils.showErrorViaToast(this.messageService, 'Workspace name is required.');
      return;
    }

    const created = this.tenantWorkspaceService.createWorkspace({
      organizationId: org.id,
      name: this.newWsName.trim(),
      description: this.newWsDescription.trim(),
      industry: this.newWsIndustry,
      defaultLanguage: this.newWsLanguage,
      defaultCountry: this.newWsCountry,
    });

    this.tenantWorkspaces = this.tenantWorkspaceService.getWorkspaces();
    this.selectWorkspace(created);
    this.pDialogCreateWorkspace = false;
    AppUtils.showSuccessViaToast(
      this.messageService,
      `Workspace "${created.name}" created and activated.`
    );
    this.cdr.markForCheck();
  }

  deleteTenantWorkspace(ws: Workspace): void {
    if (!this.rbacService.hasPermission('workspace:manage')) {
      AppUtils.showErrorViaToast(
        this.messageService,
        'Access Denied: Missing required permission workspace:manage'
      );
      return;
    }

    if (this.tenantWorkspaces.length <= 1) {
      AppUtils.showWarnViaToast(this.messageService, 'Cannot delete the only remaining workspace.');
      return;
    }
    const ok = this.tenantWorkspaceService.deleteWorkspace(ws.id);
    if (ok) {
      AppUtils.showSuccessViaToast(this.messageService, `Workspace "${ws.name}" deleted.`);
      this.cdr.markForCheck();
    }
  }

  getWorkspacesForSelectedOrg(): Workspace[] {
    if (!this.selectedOrgForWorkspaceView) {
      return this.tenantWorkspaces;
    }
    return this.tenantWorkspaces.filter(
      (w) => w.organizationId === this.selectedOrgForWorkspaceView?.id
    );
  }

  // =========================================================================
  // Phase 11: Roles & Permissions (RBAC) Operations
  // =========================================================================

  openRbacCenter(): void {
    this.availableSimulatedUsers = this.rbacService.getAvailableUsers();
    this.activeUser = this.rbacService.getCurrentUser();
    this.activeUserRole = this.rbacService.getCurrentRole();
    this.activePermissions = this.rbacService.getCurrentPermissions();
    this.isSimulatingRole = this.rbacService.isSimulating();
    this.pDialogRbac = true;
    this.cdr.markForCheck();
  }

  selectSimulatedUser(user: User): void {
    if (!user) return;
    this.rbacService.setCurrentUser(user);
    this.activeUser = user;
    this.activeUserRole = this.rbacService.getCurrentRole();
    this.activePermissions = this.rbacService.getCurrentPermissions();
    this.isSimulatingRole = false;

    try {
      this.auditLogService.recordEvent('user.login', 'user', user.id, {
        simulatedUserEmail: user.email,
        role: user.role,
      });
    } catch {
      // Safe fallback
    }

    AppUtils.showSuccessViaToast(
      this.messageService,
      `Switched active user to ${user.firstName} ${user.lastName} (${this.getRoleDisplayName(user.role)}).`
    );
    this.cdr.markForCheck();
  }

  simulateRole(role: UserRole): void {
    this.rbacService.simulateRole(role);
    this.activeUserRole = role;
    this.activePermissions = this.rbacService.getCurrentPermissions();
    this.isSimulatingRole = true;

    try {
      this.auditLogService.recordEvent('permission.changed', 'permission', role, {
        simulatedRole: role,
      });
    } catch {
      // Safe fallback
    }

    AppUtils.showWarnViaToast(
      this.messageService,
      `Simulating ${this.getRoleDisplayName(role)} permissions.`
    );
    this.cdr.markForCheck();
  }

  resetRoleSimulation(): void {
    this.rbacService.resetSimulation();
    this.activeUserRole = this.rbacService.getCurrentRole();
    this.activePermissions = this.rbacService.getCurrentPermissions();
    this.isSimulatingRole = false;
    AppUtils.showSuccessViaToast(
      this.messageService,
      'Restored assigned user role & permissions.'
    );
    this.cdr.markForCheck();
  }

  hasRbacPermission(perm: Permission): boolean {
    return this.rbacService.hasPermission(perm);
  }

  getRoleDisplayName(role?: UserRole | null): string {
    if (!role) return 'Unknown Role';
    const def = this.rbacService.getRoleDefinition(role);
    return def ? def.displayName : role;
  }

  getRoleDescription(role?: UserRole | null): string {
    if (!role) return '';
    const def = this.rbacService.getRoleDefinition(role);
    return def ? def.description : '';
  }

  deleteGenericTemplate(template: TemplateDefinition): void {
    if (!this.rbacService.hasPermission('template:delete')) {
      AppUtils.showErrorViaToast(
        this.messageService,
        'Access Denied: Missing permission template:delete'
      );
      return;
    }
    const ok = this.templateStore.delete(template.id);
    if (ok) {
      this.genericTemplates = this.templateStore.list();
      if (this.activeGenericTemplate?.id === template.id) {
        this.activeGenericTemplate = null;
      }
      try {
        this.auditLogService.recordEvent('template.deleted', 'template', template.id, {
          templateName: template.name,
        });
      } catch {
        // Safe fallback
      }
      AppUtils.showSuccessViaToast(this.messageService, `Template "${template.name}" deleted.`);
      this.cdr.markForCheck();
    }
  }

  getWorkspaceDocumentCount(workspaceId: string): number {
    return this.documentService.getDocumentsByWorkspace(workspaceId).length;
  }

  // =========================================================================
  // Toolbar Categorization & Flyout Navigation Hubs
  // =========================================================================

  activeToolbarMenu: 'templates' | 'clinical' | 'documents' | 'platform' | null = null;

  toggleCategoryMenu(category: 'templates' | 'clinical' | 'documents' | 'platform', event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    if (this.activeToolbarMenu === category) {
      this.activeToolbarMenu = null;
    } else {
      this.activeToolbarMenu = category;
    }
    this.cdr.markForCheck();
  }

  closeCategoryMenu(): void {
    if (this.activeToolbarMenu !== null) {
      this.activeToolbarMenu = null;
      this.cdr.markForCheck();
    }
  }

  runCategoryAction(action: string): void {
    this.closeCategoryMenu();
    switch (action) {
      case 'createWithAi':
        this.openCreateWithAIDialog();
        break;
      case 'templateGallery':
        this.openTemplateGallery();
        break;
      case 'templateManager':
        this.openTemplateManager();
        break;
      case 'variableInserter':
        this.openVariableInserter();
        break;
      case 'brandSettings':
        this.openBrandSettings();
        break;
      case 'versionManager':
        this.openVersionManager();
        break;
      case 'patientContext':
        this.openPatientContext();
        break;
      case 'reviewClinical':
        this.reviewClinicalDocument();
        break;
      case 'signClinical':
        this.signClinicalDocument();
        break;
      case 'auditTrail':
        this.openAuditTrail();
        break;
      case 'generateDocument':
        this.openGenerateDocumentDialog();
        break;
      case 'documentInstances':
        this.openDocumentInstancesDialog();
        break;
      case 'pdfExport':
        this.openPdfExportDialog();
        break;
      case 'dataPreview':
        this.openDataPreview();
        break;
      case 'workspaceSwitcher':
        this.openWorkspaceSwitcher();
        break;
      case 'rbacCenter':
        this.openRbacCenter();
        break;
      case 'apiPortal':
        this.openApiPortal();
        break;
      case 'securityCenter':
        this.openSecurityCenter();
        break;
      default:
        break;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.activeToolbarMenu) {
      return;
    }
    const target = event.target as HTMLElement;
    if (target && !target.closest('.fb-category-group')) {
      this.closeCategoryMenu();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    this.closeCategoryMenu();
  }

  // openDialog() {
  //   this.pDialogAddScript = true;
  //   console.log(this.scriptData);
  //   this.getFormScriptData()
  // }

  openDialog() {
    this.importHTMLScript = "";
    this.importWithScriptsDialog = true;
    this.cdr.markForCheck();
  }

  clearDialogScripts() {
    this.importHTMLScript = "";
    this.cdr.markForCheck();
  }

  saveDialogScripts() {
    this.importWithScriptsDialog = false;
    this.importHtmlWithScripts(this.grapeEditorService.editor, this.importHTMLScript);
  }

  importHtmlWithScripts(editor, html) {
    // Parse the HTML string into a DOM object
    this.formScripts = "";
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extract and remove all script tags
    doc.querySelectorAll('script').forEach(script => {
      if (script.src) {
        // External script with src attribute
        this.scripts.push({
          type: 'external',
          src: script.src,
          async: script.hasAttribute('async'),
          defer: script.hasAttribute('defer')
        });
      } else {
        // Inline script with content
        this.scripts.push({
          type: 'inline',
          content: script.textContent
        });
      }
      script.remove();
    });

    // Convert the DOM back to HTML without scripts
    const htmlWithoutScripts = doc.documentElement.outerHTML;

    // Import the HTML into GrapesJS
    editor.setComponents(htmlWithoutScripts);
    this.appendScriptToHTML(editor, this.scripts);
  }

  appendScriptToHTML(editor, scripts) {
    const iframeDoc = editor.Canvas.getDocument();

    // Load external scripts and wait for them to complete
    const loadPromises = scripts.filter(s => s.type === 'external').map(script => {
      return new Promise((resolve, reject) => {
        const newScript = iframeDoc.createElement('script');
        newScript.src = script.src;
        if (script.async) newScript.async = true;
        if (script.defer) newScript.defer = true;
        newScript.onload = resolve;
        newScript.onerror = reject;
        iframeDoc.head.appendChild(newScript);
        this.scriptHead = iframeDoc.head.outerHTML;
      });
    });

    // After external scripts load, add inline scripts
    Promise.all(loadPromises).then(() => {
      scripts.filter(s => s.type === 'inline').forEach(script => {
        const newScript = iframeDoc.createElement('script');
        newScript.textContent = script.content;
        iframeDoc.body.appendChild(newScript);
        this.scriptBody = iframeDoc.body.outerHTML;
      });
    }).catch(error => {
      console.error('Failed to load some scripts:', error);
    });
  }
  // saveScriptData() {
  //   const formEditorDTO: FormEditorDTO = new FormEditorDTO();
  //   formEditorDTO.assets = '';
  //   formEditorDTO.components = '';
  //   formEditorDTO.css = this.grapeEditorService.editor.getCss();
  //   formEditorDTO.html = this.grapeEditorService.editor.getHtml();
  //   formEditorDTO.styles = '';

  //   const eData: EditorData = new EditorData();
  //   eData.id = this.selectedFormTemplate?.id;
  //   eData.data = JSON.stringify(
  //     this.grapeEditorService.editor.getProjectData()
  //   );
  //   formEditorDTO.editorData = eData;
  //   const scriptData: Script = new Script();
  //   if (this.isEdit == true) {
  //     scriptData.id = this.newScriptUrl.id;
  //   }
  //   scriptData.scriptUrl = this.scriptForm.value.scriptUrl;
  //   scriptData.isformUrl = true;
  //   formEditorDTO.script.push(scriptData);
  //   this.formService.saveEditorForm(
  //     this,
  //     this.selectedFormTemplate?.id,
  //     formEditorDTO
  //   );
  // }
  // deleteScript(data: any) {
  //   this.isDelete =true
  //   const formEditorDTO: FormEditorDTO = new FormEditorDTO();
  //   formEditorDTO.assets = '';
  //   formEditorDTO.components = '';
  //   formEditorDTO.css = this.grapeEditorService.editor.getCss();
  //   formEditorDTO.html = this.grapeEditorService.editor.getHtml();
  //   formEditorDTO.styles = '';

  //   const eData: EditorData = new EditorData();
  //   eData.id = this.selectedFormTemplate?.id;
  //   eData.data = JSON.stringify(
  //     this.grapeEditorService.editor.getProjectData()
  //   );
  //   formEditorDTO.editorData = eData;
  //   const scriptData: Script = new Script();
  //   scriptData.id = data.id;
  //   scriptData.scriptUrl = data.scriptUrl;
  //   scriptData.isformUrl = false;
  //   formEditorDTO.script.push(scriptData);
  //   this.formService.saveEditorForm(
  //     this,
  //     this.selectedFormTemplate?.id,
  //     formEditorDTO
  //   );
  // }
  // updateScript(data: any) {
  //   this.isEdit = true;
  //   this.newScriptUrl = data;
  //   this.scriptForm.patchValue({
  //     scriptUrl: data.scriptUrl,
  //   });
  // }
  onHideUloadDialog(any) {
    this.scriptForm.reset();
    this.fileUpload.clear();
    this.getFormBuilderData()
  }

  // onFileSelected(event: any): void {
  //   this.formService.fileDisability.push(event.files[0]);
  //   this.isLoading = true;

  //   let reportTemplate: UplaodScriptDto = new UplaodScriptDto();
  //   reportTemplate.oblectId = this.selectedFormTemplate.id;

  //   const formData = new FormData();
  //   const completePath = "Form Builder";

  //   this.formService.fileDisability.forEach((file) => {
  //     formData.append("files", file);
  //   });

  //   formData.append("uploadPath", completePath);
  //   formData.append("customerBusinessId", this.getCustomerBusinessId());
  //   formData.append("eventType", "FORM_SCRIPT_UPLOAD");
  //   formData.append("requestBody", JSON.stringify(reportTemplate));

  //   this.formService.uploadMultiPartFiles(this, formData);
  // }
  ClearAll() {
    this.scriptForm.reset()
    this.fileUpload.clear()
  }

  onResult(data: any, type: any, other?: any): void {
    switch (type) {
      case AppGlobalConstant.CLINICAL_FORM_EDITOR_DATA_:
        // Wait for editor DOM to be ready before loading project data
        this.setTimeoutSafe(() => {
          this.grapeEditorService.editor.loadProjectData(data);
        }, this.TIMEOUT_CONFIG.EDITOR_DATA_LOAD);
        break;

      case AppGlobalConstant.CLINICAL_FORM_EDITOR_DATA_ + 'GET':
        // Wait for editor DOM to be ready before loading project data
        this.setTimeoutSafe(() => {
          const edData = JSON.parse(data?.data);
          this.grapeEditorService.editor.loadProjectData(edData);
        }, this.TIMEOUT_CONFIG.EDITOR_DATA_LOAD);

        break;
      case AppGlobalConstant.MULTIPART_FILE_UPLOAD:

        this.pDialogAddScript = false
        AppUtils.showSuccessViaToast(
          this.messageService,
          'File Uploaded Successfully'
        );
        this.cdr.markForCheck();
        break

      case AppGlobalConstant.CLINICAL_FORM_BUILDER_DATA + 'GET':
        // Wait for editor DOM to be ready before loading project data
        this.setTimeoutSafe(() => {
          if (data?.data?.jsCode) this.formScripts = data.data.jsCode;
          const k = JSON.parse(data?.data?.editorData?.data);
          this.grapeEditorService.editor.loadProjectData(k);
        }, this.TIMEOUT_CONFIG.EDITOR_DATA_LOAD);
        this.editorData = data?.data?.editorData?.data;
        break;
      case AppGlobalConstant.IP_CLINICAL_FORM_BUILDER_DATA + 'GET':
        this.settingsData.form = data?.data;
        // Wait for editor DOM to be ready before loading project data
        this.setTimeoutSafe(() => {
          if (data?.data?.jsCode) this.formScripts = data.data.jsCode;
          const k = JSON.parse(data?.data?.editorData?.data);
          this.grapeEditorService.editor.loadProjectData(k);
          this.cdr.markForCheck();
        }, this.TIMEOUT_CONFIG.EDITOR_DATA_LOAD);
        break;
      case AppGlobalConstant.ER_CLINICAL_FORM_BUILDER_DATA + 'GET':
        this.settingsData.form = data?.data;
        // Wait for editor DOM to be ready before loading project data
        this.setTimeoutSafe(() => {
          if (data?.data?.jsCode) this.formScripts = data.data.jsCode;
          const k = JSON.parse(data?.data?.editorData?.data);
          this.grapeEditorService.editor.loadProjectData(k);
          this.cdr.markForCheck();
        }, this.TIMEOUT_CONFIG.EDITOR_DATA_LOAD);
        break;
        // case AppGlobalConstant.GET_ADMISSION_FORM_DATA:
        //   setTimeout(() => {
        //     const edData = JSON.parse(data[0]?.editorData);
        //     this.grapeEditorService.editor.loadProjectData(edData);
        //   }, 1000);

        break;
      case AppGlobalConstant.CLINICAL_CUSTOM_LAYOUT_EDITOR_DATA_ + 'GET':
        // Wait for editor DOM to be ready before loading project data
        this.setTimeoutSafe(() => {
          const edData = JSON.parse(data?.data);
          this.grapeEditorService.editor.loadProjectData(edData);
        }, this.TIMEOUT_CONFIG.EDITOR_DATA_LOAD);
        break;

      case AppGlobalConstant.GET_FORM_SCRIPT_DATA + 'GET':
        this.scriptData = [];
        this.scriptData = data?.data?.script?.filter(
          (item) => item.isformUrl === true
        );
        this.cdr.markForCheck();

        break;

      case AppGlobalConstant.CLINICAL_FORM_BY_ + 'GET':
        this.settingsData.form = [];
        this.settingsData.form = data;

        break;
      case AppGlobalConstant.SYSTEM_MASTERS_LANGUAGE_GET:
        this.systemMasterData.uomClass = [];
        data.forEach((element) => {
          switch (element?.typeIdentifier) {
            case SystemMasterConstant.UOM_CLASS:
              this.systemMasterData.uomClass.push(element);

              // add the UOM to editor block
              this.editorBlockManagerService.addUOMBlock(
                this.grapeEditorService.editor
              );
              break;

            default:
              break;
          }
        });
        break;
      //
      case AppGlobalConstant.CLINICAL_EDITOR_FORM_:

        if (this.isDelete === true) {
          AppUtils.showSuccessViaToast(
            this.messageService,
            'Script Deleted  successfully'

          );
          this.getFormScriptData()
          this.isDelete = false
        } else if (this.isEdit === true) {
          AppUtils.showSuccessViaToast(
            this.messageService,
            'Script Updated successfully'
          );
          this.getFormScriptData()
          this.ClearAll()
          this.isEdit = false
        }
        else {
          AppUtils.showSuccessViaToast(
            this.messageService,
            'Item saved successfully'
          );
          this.pDialogAddScript = false
          this.getFormScriptData()
        }


        break;
      case AppGlobalConstant.ER_CLINICAL_EDITOR_FORM_:
        AppUtils.showSuccessViaToast(
          this.messageService,
          'Form saved successfully'
        );

        break;
      case AppGlobalConstant.ADD_TEMPLATE_EDITOR_DATA:
        AppUtils.showSuccessViaToast(
          this.messageService,
          'Form saved successfully'
        );

        break;
      case AppGlobalConstant.IP_CLINICAL_EDITOR_FORM_:
        AppUtils.showSuccessViaToast(
          this.messageService,
          'Form saved successfully'
        );

        break;
      case AppGlobalConstant.CLINICAL_FORM_CUSTOM_LAYOUT:
        this.isLoading = this.isFormSubmit = false;
        if (this.selectedFormComponent) {
          this.customLayouts.forEach((element, index) => {
            if (element.id === data.id) {
              this.customLayouts[index] = data;
            }
          });
        } else {
          this.customLayouts.push(data);
        }
        AppUtils.showSuccessViaToast(
          this.messageService,
          'Form saved successfully'
        );

        this.isLoad = false;
        this.pDialogCustomLayout = false;
        this.getCustomLayouts();
        this.cdr.markForCheck();

        // this.clear();
        break;
      case AppGlobalConstant.CLINICAL_FORM_CUSTOM_LAYOUT_:
        this.customLayouts = data;
        // this.editorBlockManagerService.getEmrCompByType(
        //   this.selectedFormComponent?.eMRComponent,
        //   this.grapeEditorService.editor,
        //   this.customLayouts
        // );
        this.editorBlockManagerService.addCustomLayoutToBlock(
          this.customLayouts,
          this.grapeEditorService.editor
        );
        this.cdr.markForCheck();

        break;
      case AppGlobalConstant.CLINICAL_TEMPLATE_DATA_OBJECT + 'GET':
        this.settingsData.dataObjectList = [];
        this.settingsData.dataObjectList = data;
        this.settingsData.dataObjectList.forEach((item) => {
          this.editorBlockManagerService.addDataObjectToBlock(
            this.grapeEditorService.editor,
            item
          );
        });
        this.cdr.markForCheck();
        break;
      case AppGlobalConstant.CLINICAL_TEMPLATE_DATA_TABLE + 'GET':
        this.settingsData.dataTableList = [];
        this.settingsData.dataTableList = data;
        this.editorBlockManagerService.addDataTableToBlock(
          this.grapeEditorService.editor
        );
        this.cdr.markForCheck();
        break;
      default:
        break;
    }
  }
  onError(err: any, type: any, other?: any): void {
    switch (type) {
      case AppGlobalConstant.CLINICAL_FORM_BY_ + 'GET':
        break;
      case AppGlobalConstant.CLINICAL_FORM_CUSTOM_LAYOUT:
        this.isLoading = this.isFormSubmit = false;
        break;
      case AppGlobalConstant.CLINICAL_FORM_CUSTOM_LAYOUT_:
        break;
      case AppGlobalConstant.CLINICAL_EDITOR_FORM_:
        break;
      default:
        break;
    }
  }
}
