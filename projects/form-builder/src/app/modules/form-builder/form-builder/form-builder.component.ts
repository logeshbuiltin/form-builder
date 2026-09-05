import { UserProfileService } from './../../../data/service/user-profile.service';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
import { TemplateRendererService } from '../../../data/service/template-renderer.service';
import { TemplateStoreService } from '../../../data/service/template-store.service';
import { ClinicalAuditEvent, PatientContext } from '../../../data/model/clinical-document.model';
import { ClinicalWorkflowService } from '../../../data/service/clinical-workflow.service';

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
  selectedTemplateForPreview: DocumentFormat | null = null;
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
  currentLang: 'English' | 'German' = 'English';
  canvasLayoutMode: 'free' | 'a4-portrait' | 'a4-landscape' | 'receipt' = 'free';
  activeFormatName: string = 'Multi-Document Studio';
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
    public translate: TranslateService
  ) { }

  ngOnInit(): void {
    const savedLang = (localStorage.getItem('form_builder_lang') as 'English' | 'German') || 'English';
    this.currentLang = savedLang;
    this.translate.setDefaultLang('English');
    this.translate.use(savedLang);
    this.updateCategoryOptions(savedLang);

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

        // add the 12 document formats and universal blocks to editor block
        this.editorBlockManagerService.addDocumentFormatBlocks(
          this.grapeEditorService.editor,
          this.selectedTemplateCategory
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
      design: this.grapeEditorService.editor.getProjectData(),
      html: this.grapeEditorService.editor.getHtml(),
      css: this.grapeEditorService.editor.getCss(),
      dataSchema: schema,
      sampleData,
      createdAt: previous?.createdAt || now,
      updatedAt: now,
    };
    this.templateStore.save(template);
    this.activeGenericTemplate = template;
    this.genericTemplates = this.templateStore.list();
    this.pDialogTemplateDetails = false;
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
    this.clinicalAudit = this.clinicalWorkflow.listAudit();
    this.pDialogAudit = true;
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

  openTemplateGallery(): void {
    this.templateSearchQuery = '';
    this.selectedDocumentCategory = 'all';
    this.filterTemplates();
    this.pDialogTemplateGallery = true;
    this.cdr.markForCheck();
  }

  selectCategory(catId: DocumentCategoryId): void {
    this.selectedDocumentCategory = catId;
    this.filterTemplates();
  }

  filterTemplates(): void {
    const q = (this.templateSearchQuery || '').toLowerCase().trim();
    this.filteredDocumentFormats = this.documentFormats.filter((fmt) => {
      const matchCat =
        this.selectedDocumentCategory === 'all' ||
        fmt.category === this.selectedDocumentCategory;
      const matchSearch =
        !q ||
        fmt.name.toLowerCase().includes(q) ||
        fmt.description.toLowerCase().includes(q) ||
        fmt.features.some((f) => f.toLowerCase().includes(q));
      return matchCat && matchSearch;
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
    const query = this.aiSearchQuery.trim().toLowerCase();

    // Check if query matches any of the 12 document formats (English and German)
    const matched = this.documentFormats.find((f) => {
      const id = f.id.toLowerCase();
      const name = f.name.toLowerCase();
      return (
        query.includes(id) ||
        query.includes(name) ||
        (query.includes('invoice') && id === 'invoice') ||
        (query.includes('bill') && id === 'invoice') ||
        (query.includes('rechnung') && id === 'invoice') ||
        (query.includes('abrechnung') && id === 'invoice') ||
        ((query.includes('report') || query.includes('bericht') || query.includes('geschäftsbericht')) &&
          !query.includes('medical') && !query.includes('arzt') &&
          !query.includes('financial') && !query.includes('finanz') &&
          id === 'business-report') ||
        ((query.includes('medical') ||
          query.includes('doctor') ||
          query.includes('clinic') ||
          query.includes('patient') ||
          query.includes('arzt') ||
          query.includes('arztbericht') ||
          query.includes('befund') ||
          query.includes('patientenbericht')) &&
          id === 'medical-report') ||
        ((query.includes('quote') ||
          query.includes('quotation') ||
          query.includes('estimate') ||
          query.includes('angebot') ||
          query.includes('kostenvoranschlag')) &&
          id === 'quotation') ||
        ((query.includes('hr') ||
          query.includes('employee') ||
          query.includes('offer') ||
          query.includes('contract') ||
          query.includes('personal') ||
          query.includes('arbeitsvertrag') ||
          query.includes('vertrag')) &&
          id === 'hr-document') ||
        ((query.includes('cert') ||
          query.includes('certificate') ||
          query.includes('award') ||
          query.includes('zertifikat') ||
          query.includes('urkunde') ||
          query.includes('bescheinigung')) &&
          id === 'certificate') ||
        ((query.includes('receipt') ||
          query.includes('pos') ||
          query.includes('slip') ||
          query.includes('quittung') ||
          query.includes('beleg') ||
          query.includes('kassenbon')) &&
          id === 'receipt') ||
        ((query.includes('proposal') ||
          query.includes('bid') ||
          query.includes('pitch') ||
          query.includes('projektvorschlag') ||
          query.includes('vorschlag') ||
          query.includes('ausschreibung')) &&
          id === 'proposal') ||
        ((query.includes('financial') ||
          query.includes('p&l') ||
          query.includes('profit') ||
          query.includes('balance sheet') ||
          query.includes('finanz') ||
          query.includes('bilanz') ||
          query.includes('gewinn')) &&
          id === 'financial-report') ||
        ((query.includes('menu') ||
          query.includes('restaurant') ||
          query.includes('food') ||
          query.includes('cafe') ||
          query.includes('speisekarte') ||
          query.includes('karte') ||
          query.includes('gericht')) &&
          id === 'restaurant-menu') ||
        ((query.includes('delivery') ||
          query.includes('dispatch') ||
          query.includes('shipping') ||
          query.includes('lieferschein') ||
          query.includes('lieferung') ||
          query.includes('versand')) &&
          id === 'delivery-note') ||
        ((query.includes('letter') ||
          query.includes('letterhead') ||
          query.includes('formal') ||
          query.includes('brief') ||
          query.includes('geschäftsbrief') ||
          query.includes('anschreiben')) &&
          id === 'business-letter')
      );
    });

    if (matched) {
      this.loadDocumentTemplate(matched, 'replace');
      const detailMsg = this.currentLang === 'German'
        ? `Erkanntes Format: ${matched.name}. Vorlage auf der Arbeitsfläche geladen!`
        : `Recognized format: ${matched.name}. Template loaded onto canvas!`;
      this.messageService.add({
        key: 'tst',
        severity: 'success',
        summary: 'AI Form Assistant',
        detail: detailMsg,
      });
      this.aiSearchQuery = '';
    } else {
      this.openTemplateGallery();
      this.templateSearchQuery = query;
      this.filterTemplates();
      this.messageService.add({
        key: 'tst',
        severity: 'info',
        summary: 'AI Form Assistant',
        detail: `Opened template gallery for "${query}". Select a layout below:`,
      });
    }
    this.cdr.markForCheck();
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
