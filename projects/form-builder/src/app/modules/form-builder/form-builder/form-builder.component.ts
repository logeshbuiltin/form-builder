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
    private ngZone: NgZone
  ) { }

  ngOnInit(): void {
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

        const types: string[] = [SystemMasterConstant.UOM_CLASS];
        this.masterService.getSystemMastersByLanguage(this, types, 'LANG-147');

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

        // add the masters to editor block
        this.editorBlockManagerService.addMastersToBlock(
          this.grapeEditorService.editor
        );

        // add the demographic items to editor block
        this.editorBlockManagerService.addDemographicItemsToBlock(
          this.grapeEditorService.editor
        );

        // load custom layouts / saved forms
        this.getCustomLayouts();
        this.getDataObject();
        this.getDataTable();
        this.getFormScriptData();

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
      `Demographic field '${item.label}' added to Custom Demographics!`
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
    this.formService.getCustomLayout(
      this,
      this.getCustomerBusinessId(),
      FormComponentType.ALL
    );
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

    if (this.selectedFormTemplate?.admitType === 'OP') {
      this.formService.saveEditorForm(
        this,
        this.selectedFormTemplate?.id,
        formEditorDTO
      );
    } else if (this.selectedFormTemplate?.admitType === 'IP') {
      this.formService.saveIPEditorForm(
        this,
        this.selectedFormTemplate?.id,
        formEditorDTO
      );
    } else if (this.selectedFormTemplate?.admitType === 'ER') {
      this.formService.saveErEditorForm(
        this,
        this.selectedFormTemplate?.id,
        formEditorDTO
      );
    } else {
      // Fallback for admitType 'ALL' or any other value
      this.formService.saveEditorForm(
        this,
        this.selectedFormTemplate?.id,
        formEditorDTO
      );
    }
  }

  getFormData(): void {
    this.formService.getEditorData(this, this.selectedFormTemplate?.id);
    this.formService.getEditorData(this, this.selectedFormTemplate?.id);


  }
  getFormBuilderData(): void {
    this.formService.getFormBuilderData(this, this.selectedFormTemplate?.id);

  }
  getFormScriptData() {
    this.formService.getFormScriptData(this, this.selectedFormTemplate?.id);

  }
  getIpFormBuilderData(): void {
    this.formService.getIpFormBuilderData(this, this.selectedFormTemplate?.id);
  }
  getErFormBuilderData(): void {
    this.formService.getErFormBuilderData(this, this.selectedFormTemplate?.id);
  }

  getCustomLayoutData(): void {
    this.formService.getCustomLayoutEditorData(
      this,
      this.selectedFormComponent.id
    );
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
    this.isLoading = true;
    this.cdr.markForCheck();

    this.formService.saveCustomLayout(this, formComps);
  }
  back(): void {
    this.location.back();
  }
  // viewForm(selectedFormTemplate: FormEvent) {
  //   this.getFormBuilderData();
  //   this.navigateToPrintList = null;
  //   this.navigateToPrintList = selectedFormTemplate;
  // }
  // navigatetoprint(selectedFormTemplate: FormEvent) {
  //   const navigationExtras: NavigationExtras = {
  //     state: {
  //       form: selectedFormTemplate,
  //     },
  //     replaceUrl: false,
  //   };
  //   this.router.navigateByUrl('home/form-view', navigationExtras);
  // }
  viewForm() {
    if (
      this.selectedFormTemplate.formStatus === 'PUBLISHED' ||
      this.selectedFormTemplate.formStatus === 'READYTOPUBLISH'
    ) {
      const navigationExtras: NavigationExtras = {
        state: {
          form: this.selectedFormTemplate
        },
        replaceUrl: false,
      };
      this.router.navigateByUrl('home/form-view', navigationExtras);
    } else {
      AppUtils.showSuccessViaToast(
        this.messageService,
        'Please Add Form Contents'
      );
    }
  }

  editorHelp(): void {
    window.open('https://grapesjs.com/');
  }

  onAISearch(): void {
    if (!this.aiSearchQuery || !this.aiSearchQuery.trim()) {
      return;
    }
    const query = this.aiSearchQuery.trim();
    this.messageService.add({
      key: 'tst',
      severity: 'info',
      summary: 'AI Form Assistant',
      detail: `Searching / Generating for: "${query}"`,
    });
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

