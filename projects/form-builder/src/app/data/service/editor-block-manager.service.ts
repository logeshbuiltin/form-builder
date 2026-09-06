import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppUtils } from '../../common/app-utils';
import { DataObject } from '../../common/enum/data-object.enum';
import { FormComponentType } from '../../common/enum/form-component-type.enum';
import { SystemMasterData } from '../model/system-master-data';
import { TemplateDataObject } from '../model/template-data-object';
import { TemplateDataTable } from '../model/template-data-table';
import { SettingsData } from '../settings-data';
import { DataObjectService } from './data-object.service';
import { DOCUMENT_FORMATS } from '../constant/document-formats.constant';

@Injectable({
  providedIn: 'root',
})
export class EditorBlockManagerService {
  constructor(
    private settingsData: SettingsData,
    private systemMasterData: SystemMasterData,
    private dataObjectService: DataObjectService,
    private http: HttpClient
  ) { }

  addUOMBlock(editor: any): void {
    if (
      !AppUtils.isNull(this.systemMasterData.uomClass) &&
      this.systemMasterData.uomClass.length > 0
    ) {
      this.systemMasterData.uomClass.forEach((element) => {
        editor.BlockManager.add(
          element.identifierCode,
          this.getUnitBlock(element.identifierCode, 'Units', element.nameEn)
        );
      });
    }
  }

  private getUnitBlock(id: string, category: string, label: string): any {
    return {
      id,
      label,
      category,
      attributes: { class: 'fa fa-list' },
      content:
        '<div><select class="select" name="' +
        id +
        '" id="' +
        id +
        '"><option value="">- Select option -</option></select></div>',
    };
  }

  getEmrCompByType(compType: string, editor: any): any {
    let emrComp: any;
    if (AppUtils.isNull(this.settingsData.emrComponents)) {
      this.getEmrComponentData().then((events) => {
        this.settingsData.emrComponents = events;
        this.settingsData?.emrComponents?.forEach((element) => {
          if (element.type === compType) {
            emrComp = element;
          }
        });
        this.addEmrComponentFieldsToBlock(editor, emrComp);
      });
    } else {
      this.settingsData?.emrComponents?.forEach((element) => {
        if (element.type === compType) {
          emrComp = element;
        }
      });
      this.addEmrComponentFieldsToBlock(editor, emrComp);
    }
  }

  getEmrComponentData(): any {
    return this.http
      .get<any>('assets/demo/data/emr-component.json')
      .toPromise()
      .then((res) => res)
      .then((data) => data);
  }

  public addEmrComponentFieldsToBlock(
    editor: any,

    emComp?
  ): void {
    const emrComp = emComp;
    let columnContent = '';

    emrComp?.availableFields?.forEach((field) => {
      columnContent =
        columnContent + this.getECLabelContent(field.key, field.value);

      editor.BlockManager.add(
        field.key,
        this.getECLabelBlock(
          field.key,
          field.value,
          emrComp.type,

          'fa fa-registered'
        )
      );
    });

    editor.BlockManager.add(emrComp.type + 'block', {
      label: emrComp.type,
      id: emrComp.type + 'id',
      name: emrComp.type,
      category: emrComp.type,
      attributes: { class: 'fa fa-list-alt' },
      content:
        `<div class="div` +
        emrComp.type +
        `" >
                      ` +
        columnContent +
        `
                        </div>
                      `,
    });

    this.setButton(emrComp.type, 'btnAdd' + emrComp.type, editor);
    setTimeout(() => {
      this.collapseBlock(editor);
    }, 1000);
  }

  setButton(category: any, id: any, editor: any): void {
    editor.BlockManager.add(category, {
      id,
      label: 'Add ' + category,
      category,
      attributes: { class: 'fa fa-arrow-circle-right' },
      content:
        `<button id="` +
        id +
        `" class="button">
            Add
          </button>`,
    });
  }

  getECLabelBlock(
    id: string,
    label: string,
    category: string,

    icon: string
  ): any {
    return {
      id,
      label: id,
      category,

      attributes: { class: icon },
      content: this.getECLabelContent(id, label),
    };
  }

  getECLabelContent(id: string, label: string): any {
    return '<label class="' + id.replace(/ /g, '') + '">' + label + '</label>';
  }

  public addCustomLayoutToBlock(customLayouts: any, editor: any): void {
    if (!editor || !customLayouts || !Array.isArray(customLayouts)) {
      return;
    }
    customLayouts.forEach((item) => {
      if (item && item.hasOwnProperty('formEditorValue')) {
        const blockId = item.layoutName || item.identifier;
        const htmlData =
          '<div class="' +
          'div_' +
          (item.identifier || item.id || '') +
          '">' +
          (item.formEditorValue?.html || '') +
          (item.formEditorValue?.css ? '<style>' + item.formEditorValue.css + '</style>' : '') +
          '</div>';

        if (editor.BlockManager.get(blockId)) {
          editor.BlockManager.remove(blockId);
        }

        editor.BlockManager.add(blockId, {
          id: blockId,
          label: item.layoutName || 'Custom Form',
          media: this.getFormPreviewSvg('generic', item.layoutName || 'Custom Form'),
          category: { id: 'custom-forms', label: 'Custom Forms', open: true },
          attributes: { class: item.layoutIcon || 'fa fa-file-text-o' },
          content: htmlData,
        });
      }
    });
  }

  /** Reusable domain-neutral binding primitives for the document engine. */
  public addDataBindingBlocks(editor: any): void {
    if (!editor?.BlockManager) return;
    const category = { id: 'data-bindings', label: '⚡ Dynamic Variables', open: true };
    const blocks = [
      {
        id: 'binding-patient-name', label: 'Patient Name', icon: 'fa fa-user',
        content: '<span class="var-badge" style="font-weight:600; color:#1e293b;">{{patient.name}}</span>'
      },
      {
        id: 'binding-patient-dob', label: 'Patient DOB', icon: 'fa fa-calendar',
        content: '<span>{{patient.dateOfBirth}}</span>'
      },
      {
        id: 'binding-patient-mrn', label: 'Patient MRN', icon: 'fa fa-id-badge',
        content: '<span style="font-family:monospace; font-weight:700;">{{patient.mrn}}</span>'
      },
      {
        id: 'binding-doctor-name', label: 'Doctor Name', icon: 'fa fa-user-md',
        content: '<span style="font-weight:600; color:#0f766e;">{{doctor.name}}</span>'
      },
      {
        id: 'binding-doctor-reg', label: 'Doctor Reg No.', icon: 'fa fa-certificate',
        content: '<span>{{doctor.registrationNumber}}</span>'
      },
      {
        id: 'binding-clinic-name', label: 'Clinic Name', icon: 'fa fa-hospital-o',
        content: '<strong style="color:#1e40af; font-size:1.1em;">{{clinic.name}}</strong>'
      },
      {
        id: 'binding-appointment-date', label: 'Appointment Date', icon: 'fa fa-calendar-check-o',
        content: '<span>{{appointment.date}}</span>'
      },
      {
        id: 'binding-invoice-total', label: 'Invoice Total', icon: 'fa fa-money',
        content: '<strong style="font-size:1.2em; color:#059669;">{{invoice.total}}</strong>'
      },
      {
        id: 'binding-custom-variable', label: 'Custom Field', icon: 'fa fa-code',
        content: '<span>{{field.path}}</span>'
      }
    ];
    blocks.forEach(block => {
      if (editor.BlockManager.get(block.id)) editor.BlockManager.remove(block.id);
      editor.BlockManager.add(block.id, { ...block, category, attributes: { class: block.icon } });
    });
  }

  /** Reusable document structure blocks: Headers, Footers, Signatures, Tables, Page Breaks */
  public addDocumentStructureBlocks(editor: any): void {
    if (!editor?.BlockManager) return;
    const category = { id: 'doc-structures', label: '📐 Document Structures', open: true };
    const blocks = [
      {
        id: 'struct-header-branded',
        label: 'Branded Header',
        icon: 'fa fa-id-card-o',
        content: `<header class="doc-header" style="display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:16px; margin-bottom:24px; border-bottom:2px solid #2563eb; font-family:Inter, Arial, sans-serif;">
  <div style="display:flex; align-items:center; gap:16px;">
    <div style="width:52px; height:52px; border-radius:8px; background:linear-gradient(135deg, #2563eb, #1d4ed8); display:flex; align-items:center; justify-content:center; color:#ffffff; font-size:24px; font-weight:bold;">
      +
    </div>
    <div>
      <h2 style="margin:0; font-size:20px; font-weight:800; color:#1e293b;">{{clinic.name}}</h2>
      <p style="margin:2px 0 0 0; font-size:12px; color:#64748b;">{{clinic.address}} · Tel: {{clinic.phone}}</p>
    </div>
  </div>
  <div style="text-align:right;">
    <span style="display:inline-block; padding:4px 10px; background:#eff6ff; color:#1d4ed8; font-size:11px; font-weight:700; border-radius:4px; text-transform:uppercase; letter-spacing:0.5px;">{{document.title}}</span>
    <p style="margin:4px 0 0 0; font-size:12px; color:#64748b;">Date: <strong>{{document.date}}</strong></p>
    <p style="margin:2px 0 0 0; font-size:11px; color:#94a3b8;">Doc ID: {{document.id}}</p>
  </div>
</header>`
      },
      {
        id: 'struct-footer-pages',
        label: 'Branded Footer',
        icon: 'fa fa-window-minimize',
        content: `<footer class="doc-footer" style="margin-top:40px; padding-top:16px; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; font-family:Inter, Arial, sans-serif; font-size:11px; color:#64748b;">
  <div>
    <strong>{{clinic.name}}</strong> · Confidential Healthcare Document · Reg No: {{clinic.registrationNumber}}
  </div>
  <div style="text-align:right;">
    <span>Page <span class="doc-page-num">{{document.pageNumber}}</span> of <span class="doc-total-pages">{{document.totalPages}}</span></span>
  </div>
</footer>`
      },
      {
        id: 'struct-signatures-dual',
        label: 'Dual Signatures',
        icon: 'fa fa-pencil-square-o',
        content: `<section class="doc-signatures" style="margin-top:36px; padding-top:16px; border-top:1px solid #cbd5e1; display:flex; justify-content:space-between; gap:32px; font-family:Inter, Arial, sans-serif;">
  <div style="flex:1; border:1px dashed #cbd5e1; border-radius:6px; padding:16px; background:#f8fafc;">
    <div style="font-size:12px; font-weight:700; color:#475569; margin-bottom:28px;">Clinician / Practitioner Signoff</div>
    <div style="border-bottom:1px solid #1e293b; margin-bottom:8px;"></div>
    <div style="font-size:13px; font-weight:700; color:#0f172a;">{{doctor.name}}</div>
    <div style="font-size:11px; color:#64748b;">Reg: {{doctor.registrationNumber}} · Date: {{document.date}}</div>
  </div>
  <div style="flex:1; border:1px dashed #cbd5e1; border-radius:6px; padding:16px; background:#f8fafc;">
    <div style="font-size:12px; font-weight:700; color:#475569; margin-bottom:28px;">Patient / Authorized Representative</div>
    <div style="border-bottom:1px solid #1e293b; margin-bottom:8px;"></div>
    <div style="font-size:13px; font-weight:700; color:#0f172a;">{{patient.name}}</div>
    <div style="font-size:11px; color:#64748b;">Signature / Consent Date: {{document.date}}</div>
  </div>
</section>`
      },
      {
        id: 'struct-conditional-alert',
        label: 'Conditional Section',
        icon: 'fa fa-exclamation-triangle',
        content: `{{#if patient.allergies}}
<div class="conditional-alert" style="background:#fef2f2; border-left:4px solid #ef4444; border-radius:4px; padding:12px 16px; margin:14px 0; font-family:Inter, Arial, sans-serif;">
  <strong style="color:#b91c1c; font-size:13px;">Critical Alert / Known Allergies:</strong>
  <span style="color:#991b1b; font-size:13px; margin-left:8px; font-weight:600;">{{patient.allergies}}</span>
</div>
{{/if}}`
      },
      {
        id: 'struct-repeater-table',
        label: 'Repeating Items Table',
        icon: 'fa fa-table',
        content: `<table class="doc-table" style="width:100%; border-collapse:collapse; margin:16px 0; font-family:Inter, Arial, sans-serif; font-size:13px;">
  <thead>
    <tr style="background:#f1f5f9; border-bottom:2px solid #cbd5e1;">
      <th style="padding:10px 12px; text-align:left; font-weight:700; color:#334155;">#</th>
      <th style="padding:10px 12px; text-align:left; font-weight:700; color:#334155;">Description / Service</th>
      <th style="padding:10px 12px; text-align:right; font-weight:700; color:#334155;">Qty</th>
      <th style="padding:10px 12px; text-align:right; font-weight:700; color:#334155;">Rate</th>
      <th style="padding:10px 12px; text-align:right; font-weight:700; color:#334155;">Amount</th>
    </tr>
  </thead>
  <tbody>
    {{#each items}}
    <tr style="border-bottom:1px solid #e2e8f0;">
      <td style="padding:10px 12px; color:#64748b;">{{@index}}</td>
      <td style="padding:10px 12px; font-weight:600; color:#1e293b;">{{name}}</td>
      <td style="padding:10px 12px; text-align:right;">{{quantity}}</td>
      <td style="padding:10px 12px; text-align:right;">{{rate}}</td>
      <td style="padding:10px 12px; text-align:right; font-weight:700; color:#0f172a;">{{amount}}</td>
    </tr>
    {{/each}}
  </tbody>
  <tfoot>
    <tr>
      <td colspan="4" style="padding:10px 12px; text-align:right; font-weight:700; color:#475569;">Total:</td>
      <td style="padding:10px 12px; text-align:right; font-weight:800; color:#2563eb; font-size:15px;">{{invoice.total}}</td>
    </tr>
  </tfoot>
</table>`
      },
      {
        id: 'struct-page-break',
        label: 'Page Break',
        icon: 'fa fa-scissors',
        content: `<div class="doc-page-break" style="page-break-after: always; break-after: page; height: 2px; border-bottom: 2px dashed #94a3b8; margin: 28px 0; text-align: center; position: relative;">
  <span style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: #ffffff; padding: 0 10px; color: #94a3b8; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
    Page Break (Print/PDF)
  </span>
</div>`
      }
    ];
    blocks.forEach(block => {
      if (editor.BlockManager.get(block.id)) editor.BlockManager.remove(block.id);
      editor.BlockManager.add(block.id, { ...block, category, attributes: { class: block.icon } });
    });
  }

  /** Clinician-oriented blocks remain ordinary bindings, so the editor core stays domain-neutral. */
  public addClinicalBindingBlocks(editor: any): void {
    if (!editor?.BlockManager) return;
    const category = { id: 'clinical-bindings', label: 'Healthcare Fields', open: false };
    const blocks = [
      { id: 'clinical-patient-banner', label: 'Patient safety banner', icon: 'fa fa-id-card', content: '<section style="border:2px solid #1d4ed8;background:#eff6ff;padding:12px 16px;margin-bottom:16px;font-family:Arial"><strong style="font-size:18px">{{patient.name}}</strong><span style="margin-left:16px">DOB: {{patient.dateOfBirth}}</span><span style="margin-left:16px">MRN: {{patient.mrn}}</span><div style="margin-top:7px;color:#b91c1c;font-weight:600">Allergies: {{patient.allergies}}</div><div style="margin-top:4px">Encounter: {{encounter.name}} · Clinician: {{clinician.name}}</div></section>' },
      { id: 'clinical-diagnosis', label: 'Diagnosis', icon: 'fa fa-stethoscope', content: '<p><strong>Diagnosis:</strong> {{clinical.diagnosis}}</p>' },
      { id: 'clinical-vitals', label: 'Vitals', icon: 'fa fa-heartbeat', content: '<table style="width:100%;border-collapse:collapse"><tr><th style="text-align:left">BP</th><th style="text-align:left">Pulse</th><th style="text-align:left">Temperature</th></tr><tr><td>{{observations.bloodPressure}}</td><td>{{observations.pulse}}</td><td>{{observations.temperature}}</td></tr></table>' },
      { id: 'clinical-medications', label: 'Medication list', icon: 'fa fa-medkit', content: '<h3>Medications</h3><table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left">Medicine</th><th style="text-align:left">Dose</th><th style="text-align:left">Frequency</th></tr></thead><tbody>{{#each medications}}<tr><td>{{name}}</td><td>{{dose}}</td><td>{{frequency}}</td></tr>{{/each}}</tbody></table>' },
      { id: 'clinical-signature', label: 'Signature block', icon: 'fa fa-pencil-square-o', content: '<section style="margin-top:32px;border-top:1px solid #94a3b8;padding-top:10px"><strong>Signed by:</strong> {{clinician.name}}<br><span>Date/time: {{document.signedAt}}</span></section>' },
    ];
    blocks.forEach(block => {
      if (editor.BlockManager.get(block.id)) editor.BlockManager.remove(block.id);
      editor.BlockManager.add(block.id, { ...block, category, attributes: { class: block.icon } });
    });
  }

  public addDataObjectToBlock(editor: any, item: TemplateDataObject): void {
    if (!AppUtils.isNull(item.componentGroup)) {
      let htmlData = this.dataObjectService.getDataObjectHtml(item, '');
      editor.BlockManager.add(item.name, {
        id: item.name,
        label: item.name,
        category: item.componentGroup,
        content: htmlData,
      });
    }
  }

  addDataTableToBlock(editor: any): void {
    this.settingsData.dataTableList.forEach((item) => {
      let htmlData = '';
      if (item?.isForm) {
        htmlData = this.getDataTableItems(item);
        // if (!AppUtils.isNull(htmlData)) {
        //   htmlData =
        //     htmlData +
        //     `<div style="padding-top:8px;padding-bottom: 8px;
        //      display:flex; flex-direction:row;justify-content:center; align-items: center">
        //     <button style="background-color: #4CAF50;
        //     border: none;
        //     color: white;
        //     padding: 7px 12px;
        //     border-radius:5px;
        //     text-align: center;
        //     font-size: 16px;
        //     margin: 4px 2px;
        //   " id="btn_` +
        //     item.identifier +
        //     `" class="button">Save</button></div>`;
        // }

        if (!AppUtils.isNull(htmlData)) {
          htmlData =
            `<div style="text-align:end"><button id="btna_" class="button" style="background-color: #4CAF50;
            border: none;
            color: white;
            padding: 7px 12px;
            border-radius:5px;
            text-align: center;
            font-size: 16px;
            margin: 4px 2px;
          " >Add</button></div>` +
            `<dialog style="width:720px;margin-left:520px;margin-top:80px;display:none;
            position: fixed;	border: 0;
            border-radius: 8px;
            background: #d6e3e9;
            border: 5px solid black;
            z-index: 9;" id="add_">` +
            `<div style="text-align:end"><button id="close_" class="button" style="box-sizing: border-box;
            color:white;
            display: inline-block;
            float: right; width: 22px;
            height: 22px;
            background-color: red;
            margin-bottom:5px;
            border-radius: 50%;
            position: relative;
            cursor: pointer;
            transition: background 0.5s;
         ">X</button></div>` +
            htmlData +
            `<div style="padding-top:8px;padding-bottom: 8px;
             display:flex; flex-direction:row;justify-content:center; align-items: center">
            <button style="background-color: #4CAF50;
            border: none;
            color: white;
            padding: 7px 12px;
            border-radius:5px;
            text-align: center;
            font-size: 16px;
            margin: 4px 2px;
          " id="btn_` +
            item.identifier +
            `" class="button">Save</button> </div>` +
            `</dialog>`;
        }
      }
      htmlData =
        htmlData +
        `
      <div  >
            <table id="` +
        item.templateDataObjects[0].componentGroupIdentifier +
        `" style="width:100%;table-layout: fixed;">
            <thead style="background-color:black;
            color:white;">` +
        this.getDataTableColumn(item) +
        `</thead>
            </table>
            <br>
          </div>`;

      htmlData = `<div  >` + htmlData + `</div>`;

      editor.BlockManager.add(item.name, {
        id: item.name,
        label: item.name,
        category: 'Data Tables(s)',
        content: htmlData,
      });
    });
  }

  getDataTableColumn(dataTable: TemplateDataTable): string {
    let column: string;
    dataTable.templateDataObjects.forEach((item) => {
      if (AppUtils.isNull(column)) {
        column = `<th>` + item.name + `</th>`;
      } else {
        column = column + `<th>` + item.name + `</th>`;
      }
    });
    return column;
  }

  getDataTableItems(item: TemplateDataTable): any {
    let htmlData = '';
    if (item.templateDataObjects.length > 0) {
      let count = 0;
      item.templateDataObjects.forEach((dataObject) => {
        if (count === 3) {
          count = 0;
          htmlData = htmlData + `</div>`;
        }
        if (count === 0) {
          htmlData =
            htmlData +
            `<div style="padding-left: 4px; padding-right: 4px;  width: 100%; display:flex; flex-direction: row;">
        ` +
            this.getDataObjectColumn(dataObject, item.identifier);
        } else {
          htmlData =
            htmlData + this.getDataObjectColumn(dataObject, item.identifier);
        }
        count++;
      });
      if (!AppUtils.isNull(htmlData)) {
        htmlData = htmlData + `</div>`;
      }
    }
    return htmlData;
  }

  getDataObjectColumn(
    dataObject: TemplateDataObject,
    dataTableId: string
  ): any {
    let htmlString = '';

    if (!dataObject.isReadOnly) {
      //   htmlString =
      //     `<div style="width: 33.33%; display:flex; flex-direction: column; padding: 2px;" >
      // <label class="label" >` +
      //     dataObject.name +
      //     `</label>`;
      htmlString = `<div style="width: 33.33%; display:flex; flex-direction: column; padding: 2px;" >`;

      htmlString =
        htmlString +
        this.dataObjectService.getDataObjectHtml(dataObject, dataTableId) +
        '</div>';
      // switch (dataObject.identifier) {
      //   case DataObject.HEIGHT:
      //     htmlString =
      //       htmlString +
      //       `<input id="` +
      //       dataObject.identifier +
      //       `" class="input"/></div>`;
      //     break;

      //   default:
      //     htmlString =
      //       htmlString +
      //       `<input id="` +
      //       dataObject.identifier +
      //       `" class="input"/></div>`;
      //     break;
      // }
    }
    return htmlString;
  }

  public addCustomFormsToBlock(editor: any): void {
    if (!editor || !editor.BlockManager) {
      return;
    }

    editor.BlockManager.add('clinical-intake-form', {
      id: 'clinical-intake-form',
      label: 'Clinical Intake Form',
      media: this.getFormPreviewSvg('intake'),
      category: { id: 'custom-forms', label: 'Custom Forms', open: true },
      attributes: { class: 'fa fa-file-text-o' },
      content: `
        <div class="custom-form-block" style="padding: 20px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; font-family: sans-serif; margin-bottom: 15px;">
          <h3 style="margin-top: 0; color: #1e293b; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">Patient Clinical Intake Form</h3>
          <div style="display: flex; gap: 15px; margin-bottom: 12px;">
            <div style="flex: 1;">
              <label style="font-weight: 600; font-size: 13px; display: block; margin-bottom: 4px; color: #475569;">Patient Full Name</label>
              <input type="text" placeholder="e.g. John Doe" style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 4px; box-sizing: border-box;" />
            </div>
            <div style="flex: 1;">
              <label style="font-weight: 600; font-size: 13px; display: block; margin-bottom: 4px; color: #475569;">Date of Birth</label>
              <input type="date" style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 4px; box-sizing: border-box;" />
            </div>
          </div>
          <div style="margin-bottom: 12px;">
            <label style="font-weight: 600; font-size: 13px; display: block; margin-bottom: 4px; color: #475569;">Symptoms & Clinical Notes</label>
            <textarea rows="3" placeholder="Enter patient assessment notes..." style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 4px; box-sizing: border-box;"></textarea>
          </div>
        </div>
      `,
    });

    editor.BlockManager.add('vital-signs-form', {
      id: 'vital-signs-form',
      label: 'Vital Signs Form',
      media: this.getFormPreviewSvg('vitals'),
      category: { id: 'custom-forms', label: 'Custom Forms', open: true },
      attributes: { class: 'fa fa-heartbeat' },
      content: `
        <div class="vital-signs-block" style="padding: 18px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-family: sans-serif; margin-bottom: 15px;">
          <h4 style="margin-top: 0; color: #0f172a; margin-bottom: 12px;">Vital Signs Record</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 4px;">Blood Pressure (mmHg)</label>
              <input type="text" placeholder="120/80" style="width: 100%; padding: 6px 8px; border: 1px solid #cbd5e1; border-radius: 4px; box-sizing: border-box;" />
            </div>
            <div>
              <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 4px;">Heart Rate (bpm)</label>
              <input type="number" placeholder="72" style="width: 100%; padding: 6px 8px; border: 1px solid #cbd5e1; border-radius: 4px; box-sizing: border-box;" />
            </div>
            <div>
              <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 4px;">Temperature (°C)</label>
              <input type="number" placeholder="37.0" style="width: 100%; padding: 6px 8px; border: 1px solid #cbd5e1; border-radius: 4px; box-sizing: border-box;" />
            </div>
            <div>
              <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 4px;">SpO2 (%)</label>
              <input type="number" placeholder="98" style="width: 100%; padding: 6px 8px; border: 1px solid #cbd5e1; border-radius: 4px; box-sizing: border-box;" />
            </div>
          </div>
        </div>
      `,
    });

    editor.BlockManager.add('image-block', {
      id: 'imageEditor',
      label: 'Image / Diagram Block',
      media: this.getFormPreviewSvg('image'),
      category: { id: 'custom-forms', label: 'Custom Forms', open: true },
      attributes: { class: 'fa fa-picture-o' },
      content: `
          <div style='border:0px solid #f1f1f1;' >
            <img name="imageEditor"/>
          </div>
        `,
    });

    editor.BlockManager.add('table-block', {
      id: 'table',
      label: 'Custom Table',
      media: this.getFormPreviewSvg('table'),
      category: { id: 'custom-forms', label: 'Custom Forms', open: true },
      attributes: { class: 'fa fa-table' },
      content: `
          <div style='border:1px solid #f1f1f1;' >
            <table id="myTable" style="width:100%;table-layout: fixed;">
            <tr>
              <td>

              </td>
            </tr>

            </table>
            <br>
          </div>
        `,
    });
  }

  public addDocumentFormatBlocks(editor: any, categoryFilter: string = 'all'): void {
    this.removeReadyTemplatesFromBlock(editor);
  }

  public filterReadyTemplates(editor: any, categoryFilter: string = 'all'): void {
    this.removeReadyTemplatesFromBlock(editor);
  }

  public removeReadyTemplatesFromBlock(editor: any): void {
    if (!editor || !editor.BlockManager) {
      return;
    }

    // Remove all template & format-specific blocks from BlockManager
    const allManagedBlockIds = [
      ...DOCUMENT_FORMATS.map((f) => 'template-' + f.id),
      'inv-line-items',
      'inv-totals-box',
      'rep-kpi-grid',
      'med-rx-table',
      'cert-seal-badge',
      'menu-dish-item',
      'del-dispatch-table',
      'univ-signature',
      'univ-stamp-paid',
      'univ-page-break',
    ];

    allManagedBlockIds.forEach((id) => {
      if (editor.BlockManager.get(id)) {
        editor.BlockManager.remove(id);
      }
    });

    // Clean up template categories from BlockManager
    const oldCatIds = [
      'doc-templates',
      'cat-invoices',
      'cat-reports',
      'cat-medical',
      'cat-certificates',
      'cat-menu',
      'cat-delivery',
      'cat-universal',
    ];
    try {
      const categories = editor.BlockManager.getCategories();
      if (categories && categories.models) {
        oldCatIds.forEach((catId) => {
          const found = categories.models.find((c: any) => c.get('id') === catId || c.id === catId);
          if (found && categories.remove) {
            categories.remove(found);
          }
        });
      }
    } catch (e) {
      console.warn('Category cleanup note:', e);
    }

    if (editor.BlockManager.render) {
      try {
        editor.BlockManager.render();
      } catch (e) {
        // silent
      }
    }
  }

  private getInvoiceTableContent(): string {
    return `
      <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px; font-family: sans-serif;">
        <thead>
          <tr style="background: #0f172a; color: #ffffff;">
            <th style="padding: 10px 12px; text-align: left;">#</th>
            <th style="padding: 10px 12px; text-align: left;">Item Description</th>
            <th style="padding: 10px 12px; text-align: center;">Qty</th>
            <th style="padding: 10px 12px; text-align: right;">Rate</th>
            <th style="padding: 10px 12px; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 12px; color: #64748b;">1</td>
            <td style="padding: 10px 12px;"><strong>Professional Services</strong></td>
            <td style="padding: 10px 12px; text-align: center;">1</td>
            <td style="padding: 10px 12px; text-align: right;">$1,500.00</td>
            <td style="padding: 10px 12px; text-align: right; font-weight: 600;">$1,500.00</td>
          </tr>
        </tbody>
      </table>
    `;
  }

  private getInvoiceTotalsContent(): string {
    return `
      <div style="max-width: 280px; margin-left: auto; font-size: 13px; font-family: sans-serif; padding: 10px 0;">
        <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #64748b;">
          <span>Subtotal:</span><span>$1,500.00</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #64748b;">
          <span>Tax (10%):</span><span>$150.00</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-top: 2px solid #0f172a; font-weight: 800; font-size: 15px; color: #2563eb;">
          <span>Total Due:</span><span>$1,650.00</span>
        </div>
      </div>
    `;
  }

  private getKpiGridContent(): string {
    return `
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 15px 0; font-family: sans-serif;">
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 6px; text-align: center;">
          <span style="font-size: 11px; color: #166534; font-weight: 700; text-transform: uppercase;">Revenue</span>
          <h3 style="margin: 4px 0; font-size: 18px; color: #15803d;">$1.2M</h3>
          <span style="font-size: 11px; color: #16a34a;">+12% vs Target</span>
        </div>
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 12px; border-radius: 6px; text-align: center;">
          <span style="font-size: 11px; color: #1e40af; font-weight: 700; text-transform: uppercase;">New Users</span>
          <h3 style="margin: 4px 0; font-size: 18px; color: #1d4ed8;">4,850</h3>
          <span style="font-size: 11px; color: #2563eb;">+28% Growth</span>
        </div>
        <div style="background: #fefce8; border: 1px solid #fef08a; padding: 12px; border-radius: 6px; text-align: center;">
          <span style="font-size: 11px; color: #854d0e; font-weight: 700; text-transform: uppercase;">Retention</span>
          <h3 style="margin: 4px 0; font-size: 18px; color: #a16207;">95.2%</h3>
          <span style="font-size: 11px; color: #ca8a04;">Optimal</span>
        </div>
        <div style="background: #faf5ff; border: 1px solid #e9d5ff; padding: 12px; border-radius: 6px; text-align: center;">
          <span style="font-size: 11px; color: #6b21a8; font-weight: 700; text-transform: uppercase;">NPS</span>
          <h3 style="margin: 4px 0; font-size: 18px; color: #7e22ce;">+72</h3>
          <span style="font-size: 11px; color: #9333ea;">Top Tier</span>
        </div>
      </div>
    `;
  }

  private getRxTableContent(): string {
    return `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px; margin: 15px 0; font-family: sans-serif;">
        <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #0284c7; font-weight: 800;">Rx - PRESCRIPTION</h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="border-bottom: 1px solid #cbd5e1; color: #64748b;">
              <th style="padding: 6px 0; text-align: left;">Medication</th>
              <th style="padding: 6px 0; text-align: center;">Dosage & Freq</th>
              <th style="padding: 6px 0; text-align: center;">Duration</th>
              <th style="padding: 6px 0; text-align: left;">Special Advice</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px 0; font-weight: 600;">Paracetamol 650mg</td>
              <td style="padding: 8px 0; text-align: center;">1 SOS</td>
              <td style="padding: 8px 0; text-align: center;">3 Days</td>
              <td style="padding: 8px 0;">Take after food</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  private getCertSealContent(): string {
    return `
      <div style="text-align: center; margin: 20px auto;">
        <div style="display: inline-flex; width: 70px; height: 70px; border-radius: 50%; background: linear-gradient(135deg, #f59e0b, #b45309); align-items: center; justify-content: center; color: #ffffff; font-size: 28px; box-shadow: 0 4px 12px rgba(180, 83, 9, 0.35);">
          ★
        </div>
        <div style="font-family: serif; font-weight: 700; font-size: 11px; color: #92400e; margin-top: 6px; letter-spacing: 1px; text-transform: uppercase;">
          OFFICIAL DISTINCTION
        </div>
      </div>
    `;
  }

  private getMenuDishContent(): string {
    return `
      <div style="margin: 12px 0; font-family: 'Georgia', serif;">
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <strong style="font-size: 15px; color: #1c1917;">Truffle Risotto ai Funghi</strong>
          <span style="font-weight: 700; color: #991b1b; font-size: 14px;">$26.00</span>
        </div>
        <p style="margin: 3px 0 4px 0; font-size: 12px; color: #78716c; font-style: italic; line-height: 1.4;">
          Carnaroli rice, wild porcini mushrooms, Parmigiano-Reggiano foam, micro parsley.
        </p>
        <span style="font-family: sans-serif; font-size: 10px; background: #dcfce7; color: #15803d; padding: 1px 6px; border-radius: 4px;">🌱 VEGETARIAN</span>
      </div>
    `;
  }

  private getDispatchTableContent(): string {
    return `
      <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px; font-family: sans-serif;">
        <thead>
          <tr style="background: #ea580c; color: #ffffff;">
            <th style="padding: 8px 10px; text-align: left;">SKU / Code</th>
            <th style="padding: 8px 10px; text-align: left;">Description</th>
            <th style="padding: 8px 10px; text-align: center;">Ordered</th>
            <th style="padding: 8px 10px; text-align: center;">Shipped</th>
            <th style="padding: 8px 10px; text-align: center;">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 10px; font-family: monospace;">SKU-4910</td>
            <td style="padding: 8px 10px;">Industrial Motor Assembly</td>
            <td style="padding: 8px 10px; text-align: center;">2</td>
            <td style="padding: 8px 10px; text-align: center; font-weight: 700; color: #15803d;">2 Units</td>
            <td style="padding: 8px 10px; text-align: center;"><span style="background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 8px; font-size: 11px;">VERIFIED</span></td>
          </tr>
        </tbody>
      </table>
    `;
  }

  private getSignatureContent(): string {
    return `
      <div style="display: inline-block; min-width: 200px; padding: 15px 0; font-family: sans-serif; font-size: 12px;">
        <div style="border-bottom: 1px solid #475569; height: 35px; margin-bottom: 5px;"></div>
        <strong style="color: #0f172a; display: block;">Authorized Signatory</strong>
        <span style="color: #64748b; font-size: 11px;">Name & Official Designation</span>
        <span style="color: #94a3b8; font-size: 10px; display: block;">Date: ____________________</span>
      </div>
    `;
  }

  private getPaidStampContent(): string {
    return `
      <div style="display: inline-block; border: 3px double #16a34a; color: #16a34a; padding: 6px 18px; border-radius: 6px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; font-family: sans-serif; font-size: 14px; transform: rotate(-5deg);">
        PAID IN FULL
      </div>
    `;
  }

  private getPageBreakContent(): string {
    return `
      <div style="page-break-after: always; border-top: 2px dashed #94a3b8; margin: 30px 0; padding: 8px 0; text-align: center; color: #94a3b8; font-size: 11px; font-family: sans-serif;">
        --- Print Page Break (A4 Next Page) ---
      </div>
    `;
  }

  public getFormPreviewSvg(type: 'intake' | 'vitals' | 'table' | 'image' | 'generic', title = 'Custom Form'): string {
    switch (type) {
      case 'intake':
        return `
          <svg viewBox="0 0 160 100" width="100%" height="70" xmlns="http://www.w3.org/2000/svg" style="border-radius: 4px; background: #ffffff; border: 1px solid #e2e8f0; display: block; margin: 0 auto 6px;">
            <rect x="0" y="0" width="160" height="20" fill="#2563eb" rx="3"/>
            <rect x="8" y="6" width="70" height="8" fill="#ffffff" rx="2"/>
            <circle cx="148" cy="10" r="4" fill="#60a5fa"/>
            <rect x="8" y="27" width="28" height="4" fill="#64748b" rx="1"/>
            <rect x="8" y="34" width="68" height="12" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" rx="2"/>
            <rect x="84" y="27" width="24" height="4" fill="#64748b" rx="1"/>
            <rect x="84" y="34" width="68" height="12" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" rx="2"/>
            <rect x="8" y="52" width="40" height="4" fill="#64748b" rx="1"/>
            <rect x="8" y="59" width="144" height="22" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" rx="2"/>
            <rect x="14" y="65" width="80" height="3" fill="#cbd5e1" rx="1"/>
            <rect x="14" y="71" width="50" height="3" fill="#cbd5e1" rx="1"/>
            <rect x="118" y="85" width="34" height="10" fill="#10b981" rx="2"/>
            <rect x="124" y="88" width="22" height="4" fill="#ffffff" rx="1"/>
          </svg>
        `;
      case 'vitals':
        return `
          <svg viewBox="0 0 160 100" width="100%" height="70" xmlns="http://www.w3.org/2000/svg" style="border-radius: 4px; background: #ffffff; border: 1px solid #e2e8f0; display: block; margin: 0 auto 6px;">
            <rect x="0" y="0" width="160" height="20" fill="#0f172a" rx="3"/>
            <rect x="8" y="6" width="60" height="8" fill="#38bdf8" rx="2"/>
            <path d="M 115 10 L 122 10 L 126 4 L 130 16 L 134 7 L 137 12 L 140 10 L 150 10" fill="none" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/>
            <rect x="8" y="26" width="68" height="28" fill="#f0fdf4" stroke="#86efac" stroke-width="1" rx="3"/>
            <rect x="14" y="30" width="28" height="4" fill="#15803d" rx="1"/>
            <rect x="14" y="38" width="38" height="10" fill="#16a34a" rx="2"/>

            <rect x="84" y="26" width="68" height="28" fill="#fef2f2" stroke="#fca5a5" stroke-width="1" rx="3"/>
            <rect x="90" y="30" width="24" height="4" fill="#b91c1c" rx="1"/>
            <rect x="90" y="38" width="34" height="10" fill="#dc2626" rx="2"/>

            <rect x="8" y="60" width="68" height="28" fill="#eff6ff" stroke="#93c5fd" stroke-width="1" rx="3"/>
            <rect x="14" y="64" width="22" height="4" fill="#1d4ed8" rx="1"/>
            <rect x="14" y="72" width="32" height="10" fill="#2563eb" rx="2"/>

            <rect x="84" y="60" width="68" height="28" fill="#faf5ff" stroke="#d8b4fe" stroke-width="1" rx="3"/>
            <rect x="90" y="64" width="26" height="4" fill="#7e22ce" rx="1"/>
            <rect x="90" y="72" width="36" height="10" fill="#9333ea" rx="2"/>
          </svg>
        `;
      case 'table':
        return `
          <svg viewBox="0 0 160 100" width="100%" height="70" xmlns="http://www.w3.org/2000/svg" style="border-radius: 4px; background: #ffffff; border: 1px solid #e2e8f0; display: block; margin: 0 auto 6px;">
            <rect x="8" y="10" width="144" height="16" fill="#1e293b" rx="2"/>
            <rect x="14" y="15" width="30" height="6" fill="#ffffff" rx="1"/>
            <rect x="54" y="15" width="35" height="6" fill="#ffffff" rx="1"/>
            <rect x="99" y="15" width="45" height="6" fill="#ffffff" rx="1"/>
            <rect x="8" y="28" width="144" height="18" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
            <rect x="14" y="34" width="25" height="5" fill="#94a3b8" rx="1"/>
            <rect x="54" y="34" width="30" height="5" fill="#94a3b8" rx="1"/>
            <rect x="99" y="34" width="40" height="5" fill="#94a3b8" rx="1"/>
            <rect x="8" y="48" width="144" height="18" fill="#ffffff" stroke="#e2e8f0" stroke-width="1"/>
            <rect x="14" y="54" width="20" height="5" fill="#94a3b8" rx="1"/>
            <rect x="54" y="54" width="28" height="5" fill="#94a3b8" rx="1"/>
            <rect x="99" y="54" width="35" height="5" fill="#94a3b8" rx="1"/>
            <rect x="8" y="68" width="144" height="18" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
            <rect x="14" y="74" width="22" height="5" fill="#94a3b8" rx="1"/>
            <rect x="54" y="74" width="32" height="5" fill="#94a3b8" rx="1"/>
            <rect x="99" y="74" width="30" height="5" fill="#94a3b8" rx="1"/>
          </svg>
        `;
      case 'image':
        return `
          <svg viewBox="0 0 160 100" width="100%" height="70" xmlns="http://www.w3.org/2000/svg" style="border-radius: 4px; background: #f8fafc; border: 1px dashed #94a3b8; display: block; margin: 0 auto 6px;">
            <circle cx="50" cy="35" r="8" fill="#f59e0b"/>
            <polygon points="20,80 60,45 95,75 120,55 145,80" fill="#3b82f6" opacity="0.6"/>
            <polygon points="45,80 80,55 110,75 145,80" fill="#1d4ed8" opacity="0.8"/>
            <rect x="40" y="85" width="80" height="6" fill="#64748b" rx="2"/>
          </svg>
        `;
      default:
        return `
          <svg viewBox="0 0 160 100" width="100%" height="70" xmlns="http://www.w3.org/2000/svg" style="border-radius: 4px; background: #ffffff; border: 1px solid #e2e8f0; display: block; margin: 0 auto 6px;">
            <rect x="0" y="0" width="160" height="18" fill="#475569" rx="3"/>
            <rect x="8" y="5" width="65" height="8" fill="#ffffff" rx="2"/>
            <rect x="8" y="26" width="30" height="4" fill="#94a3b8" rx="1"/>
            <rect x="8" y="32" width="144" height="12" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" rx="2"/>
            <rect x="8" y="50" width="40" height="4" fill="#94a3b8" rx="1"/>
            <rect x="8" y="56" width="144" height="18" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" rx="2"/>
            <rect x="110" y="80" width="42" height="12" fill="#3b82f6" rx="2"/>
            <rect x="118" y="84" width="26" height="4" fill="#ffffff" rx="1"/>
          </svg>
        `;
    }
  }

  addDemographicItemsToBlock(editor: any): void {
    // Remove legacy 'custom-demographics' category if it exists in BlockManager
    try {
      if (editor?.BlockManager?.getCategories) {
        const cat = editor.BlockManager.getCategories().get('custom-demographics');
        if (cat) {
          editor.BlockManager.getCategories().remove('custom-demographics');
        }
      }
    } catch (e) {
      // ignore
    }

    // Add + Add Custom Field action block at the top of Demographics
    editor.BlockManager.add('NewCustomDemographicField', {
      id: 'NewCustomDemographicField',
      label: '+ Add Field',
      category: 'Demographics',
      attributes: {
        class: 'fa fa-plus-circle',
        title: 'Click or drag to create a custom demographic field',
      },
      content: `
        <div class="demo-field-group demo_CustomField" style="margin-bottom: 12px; font-family: inherit;">
          <label style="font-weight: 600; font-size: 12px; display: block; margin-bottom: 4px; color: #475569;">Custom Field</label>
          <input type="text" placeholder="Enter value..." style="width: 100%; padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 4px; box-sizing: border-box;" />
        </div>
      `,
    });

    editor.BlockManager.add(
      'PatientRegNo',
      this.getLabelBlock('Reg-No', 'Demographics', 'fa fa-registered')
    );
    editor.BlockManager.add(
      'PatientRegDate',
      this.getLabelBlock('Reg-Date', 'Demographics', 'fa fa-calendar')
    );
    editor.BlockManager.add(
      'PatientName',
      this.getLabelBlock('Name', 'Demographics', 'fa fa-pencil')
    );
    editor.BlockManager.add(
      'PatientOpNo',
      this.getLabelBlock('Op-No', 'Demographics', 'fa fa-sticky-note')
    );
    editor.BlockManager.add(
      'PatientAge',
      this.getLabelBlock('Age', 'Demographics', 'fa fa-user-circle')
    );

    editor.BlockManager.add(
      'PatientDob',
      this.getLabelBlock('DOB', 'Demographics', 'fa fa-birthday-cake')
    );

    editor.BlockManager.add(
      'PatientCompany',
      this.getLabelBlock('company', 'Demographics', 'fa fa-building')
    );

    editor.BlockManager.add(
      'PatientGender',
      this.getLabelBlock('gender', 'Demographics', 'fa fa-male')
    );
    editor.BlockManager.add(
      'PatientCardNo',
      this.getLabelBlock('card-no', 'Demographics', 'fa fa-id-card-o')
    );
    editor.BlockManager.add(
      'PatientNationality',
      this.getLabelBlock('nationality', 'Demographics', 'fa fa-flag')
    );
    editor.BlockManager.add(
      'PatientDeduction',
      this.getLabelBlock('deduction', 'Demographics', 'fa fa-outdent')
    );
    editor.BlockManager.add(
      'PatientPhone',
      this.getLabelBlock('phone', 'Demographics', 'fa fa-phone')
    );
    editor.BlockManager.add(
      'PatientIdType',
      this.getLabelBlock('id-type', 'Demographics', 'fa fa-file-text-o')
    );
    editor.BlockManager.add(
      'PatientDoctor',
      this.getLabelBlock('doctor', 'Demographics', 'fa fa-user-md')
    );
    editor.BlockManager.add(
      'PatientIdNo',
      this.getLabelBlock('id-no', 'Demographics', 'fa fa-id-card')
    );

    editor.BlockManager.add(
      'Signature',
      this.getLabelBlock('signature', 'Demographics', 'fa fa-pencil')
    );

    // Load any user-created custom demographics from storage into Demographics category
    try {
      const savedCustomDemo = localStorage.getItem('form_builder_custom_demographics');
      if (savedCustomDemo) {
        const demoList = JSON.parse(savedCustomDemo);
        if (Array.isArray(demoList)) {
          demoList.forEach((item) => {
            this.addCustomDemographicItem(editor, item, false);
          });
        }
      }
    } catch (e) {
      console.warn('Error loading custom demographics from storage:', e);
    }
  }

  public addCustomDemographicItem(
    editor: any,
    item: {
      key: string;
      label: string;
      type?: string;
      icon?: string;
      placeholder?: string;
    },
    saveToStorage = true
  ): void {
    if (!editor || !editor.BlockManager || !item?.label) {
      return;
    }

    const cleanKey = (item.key || item.label).replace(/[^a-zA-Z0-9_]/g, '');
    const blockId = 'Demo_' + cleanKey;
    const iconClass = item.icon || 'fa fa-user';
    const htmlContent = this.getCustomDemographicHtml(cleanKey, item.label, item.type, item.placeholder);

    if (editor.BlockManager.get(blockId)) {
      editor.BlockManager.remove(blockId);
    }

    editor.BlockManager.add(blockId, {
      id: blockId,
      label: item.label,
      category: 'Demographics',
      attributes: { class: iconClass },
      content: htmlContent,
    });

    if (saveToStorage) {
      try {
        let list: any[] = [];
        const existing = localStorage.getItem('form_builder_custom_demographics');
        if (existing) {
          list = JSON.parse(existing) || [];
        }
        const filtered = list.filter((d: any) => d.key !== item.key && d.label !== item.label);
        filtered.push(item);
        localStorage.setItem('form_builder_custom_demographics', JSON.stringify(filtered));
      } catch (e) {
        console.warn('Error saving custom demographic to storage:', e);
      }
    }
  }

  public removeCustomDemographicItem(editor: any, blockId: string): void {
    if (!editor || !editor.BlockManager) return;
    editor.BlockManager.remove(blockId);
    try {
      const existing = localStorage.getItem('form_builder_custom_demographics');
      if (existing) {
        const list = JSON.parse(existing) || [];
        const filtered = list.filter((d: any) => ('Demo_' + (d.key || d.label).replace(/[^a-zA-Z0-9_]/g, '')) !== blockId);
        localStorage.setItem('form_builder_custom_demographics', JSON.stringify(filtered));
      }
    } catch (e) {
      console.warn('Error removing custom demographic from storage:', e);
    }
  }

  private getCustomDemographicHtml(
    key: string,
    label: string,
    type = 'text',
    placeholder = ''
  ): string {
    const ph = placeholder || `Enter ${label}`;
    switch (type) {
      case 'label':
        return `<label class="demo_${key}" style="font-weight: 600; font-size: 13px;">${label}</label>`;
      case 'number':
        return `
          <div class="demo-field-group demo_${key}" style="margin-bottom: 12px; font-family: inherit;">
            <label style="font-weight: 600; font-size: 12px; display: block; margin-bottom: 4px; color: #475569;">${label}</label>
            <input type="number" name="${key}" id="${key}" placeholder="${ph}" style="width: 100%; padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 4px; box-sizing: border-box;" />
          </div>
        `;
      case 'date':
        return `
          <div class="demo-field-group demo_${key}" style="margin-bottom: 12px; font-family: inherit;">
            <label style="font-weight: 600; font-size: 12px; display: block; margin-bottom: 4px; color: #475569;">${label}</label>
            <input type="date" name="${key}" id="${key}" style="width: 100%; padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 4px; box-sizing: border-box;" />
          </div>
        `;
      case 'select':
        return `
          <div class="demo-field-group demo_${key}" style="margin-bottom: 12px; font-family: inherit;">
            <label style="font-weight: 600; font-size: 12px; display: block; margin-bottom: 4px; color: #475569;">${label}</label>
            <select name="${key}" id="${key}" style="width: 100%; padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 4px; box-sizing: border-box; background: #fff;">
              <option value="">- Select ${label} -</option>
              <option value="Option 1">Option 1</option>
              <option value="Option 2">Option 2</option>
            </select>
          </div>
        `;
      case 'textarea':
        return `
          <div class="demo-field-group demo_${key}" style="margin-bottom: 12px; font-family: inherit;">
            <label style="font-weight: 600; font-size: 12px; display: block; margin-bottom: 4px; color: #475569;">${label}</label>
            <textarea name="${key}" id="${key}" rows="3" placeholder="${ph}" style="width: 100%; padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 4px; box-sizing: border-box;"></textarea>
          </div>
        `;
      case 'text':
      default:
        return `
          <div class="demo-field-group demo_${key}" style="margin-bottom: 12px; font-family: inherit;">
            <label style="font-weight: 600; font-size: 12px; display: block; margin-bottom: 4px; color: #475569;">${label}</label>
            <input type="text" name="${key}" id="${key}" placeholder="${ph}" style="width: 100%; padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 4px; box-sizing: border-box;" />
          </div>
        `;
    }
  }

  getLabelBlock(id: string, category: string, icon: string): any {
    return {
      id,
      label: id,
      category,
      attributes: { class: icon },
      content: '<label class="' + id.replace(/ /g, '') + '">' + id + '</label>',
    };
  }

  addMastersToBlock(editor): void {
    editor.BlockManager.add('Gender', this.getMasterBlock('GNDR', 'Masters'));

    editor.BlockManager.add(
      'Blood Group',
      this.getMasterBlock('BLD-GRP', 'Masters')
    );

    editor.BlockManager.add(
      'Marital Status',
      this.getMasterBlock('MARSTA', 'Masters')
    );
  }

  getMasterBlock(id: string, category: string): any {
    return {
      id,
      label: id,
      category,
      attributes: { class: 'fa fa-list' },
      content:
        '<select class="select" name="' +
        id +
        '" id="' +
        id +
        '"><option value="">- Select option -</option></select>',
    };
  }

  collapseBlock(editor: any): void {
    const categories = editor.BlockManager.getCategories();
    categories.each((category) => {
      category.set('open', false).on('change:open', (opened) => {
        opened.get('open') &&
          // tslint:disable-next-line: no-shadowed-variable
          categories.each((category) => {
            // tslint:disable-next-line: no-unused-expression
            category !== opened && category.set('open', false);
          });
      });
    });
  }
}
