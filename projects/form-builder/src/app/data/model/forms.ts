import { TransactionBase } from '../../common/transaction-base';
import { FlowSheetItem } from './flow-sheet-item';
import { SystemMaster } from './system-master';

export class FormEvent extends TransactionBase {
  public id: string;
  public level: string;
  public eventAction: string;
  public eventIdentifier: string;
  public eventReferenceId: string;
  public form: Form;
  public formname: string;
  public parentformId: any;
  public description: string;
  public certificate: SystemMaster;
  public flowsheetItem: FlowSheetItem[];
  public isPrint: boolean = false;
  public formStatus: string;
}

export class Form {
  public assets: string;
  public components: string;
  public css: string;
  public html: string;
  public styles: string;

  public formType: SystemMaster;

  public levelOfCare: AssignForm[];
  public role: AssignForm[];
  public specilization: AssignForm[];
  public editorData: EditorData;
}

export class GetForms {
  public customerBusinessId: any;
  public level: string;
  public siteId: any;
  public userId: any;
  public eventIdentifier: string;
  public templateType: string;
  public templateName: string;
}

export class GetAssesmentForms {
  public roleIdentifierCode: string;
  public specialityIdentifierCode: string;
  public levelOfCareIdentifierCode: string;
  public customerBusinessId: any;
  public level: string;
  public siteId: any;
  public userId: any;
  public eventIdentifier: string;
  public formname: string;
  public templateType: string;
}

export class ClinicalOrderActivity {
  catalogueItemId: number;
  frequencyId: number;
  durationId: number;
  orderQty: number;
  categoryIdentifierCode: string;
  active: boolean;
  dose: number;
  doseId: number;
  routeId: number;
  foodIntakeId: number;
  priorityId: number;
  isPercentile: boolean;
  discountAmount: any;
  status: string;
  additives: any[] = null;
  fullOrderText: string;
  signDetail: any;
  isPRN: boolean;
  schedules: any[] = null;
  orderDetails: any;
  otherProperties: any;
  hasInsulin: boolean;
  isAdhoc: boolean;
  adhocText: string;
  activityReferenceId: string;
}

export class AssignForm {
  public id: number;
  public name: string;
  public identifierCode: string;
}
export class AssignFormDTO {
  public levelOfCare: AssignForm[];
  public role: AssignForm[];
  public specilization: AssignForm[];
}

export class AssesmentFormsGetDTO {
  public id: string;
  public formname: string;
  public formId: string;
  public userId: number;
  public siteId: number;
  public customerBusinessId: number;
  public count: number;
  public form: Form;
  public certificate: SystemMaster;
}

export class FormComponents extends TransactionBase {
  public id: string;
  public level: string;
  public eventAction: string;
  public eventIdentifier: string;
  public eventReferenceId: string;
  public layoutName: string;
  public layoutIcon: string;
  public formEditorValue: FormEditorValue;
  public identifier: string;
  public emrcomponent: any;
}
export class FormEditorValueDto {
  public id: number;
  public formId: number;
  public assets: string;
  public components: string;
  public css: string;
  public html: string;
  public styles: string;
  public editorData: string;
}

export class FormEditorValue {
    public id:string
    public assets: string;
    public components: string;
    public css: string;
    public html: string;
    public styles: string;
    public editorData: EditorData;
    public script: Script[] = [];
    public jsCode: string;
  }


export class FormEditorDTO {
  public id:string
  public assets: string;
  public components: string;
  public css: string;
  public html: string;
  public styles: string;
  public jsCode: string;
  public editorData: EditorData;
  public script: Script[] = [];
}

export class Script {
  public id: string;
  public scriptUrl: string;
  public isformUrl: boolean;
  public scriptPath: String;
}

export class PagesHtml {
  public css: string;
  public html: string;
}

export class EditorData {
  public id: string;
  // public pagesHtml: PagesHtml[];
  public data: string;
}

export class GrapeEditorData {
  public assets: any;
  public styles: any;
  public component: string;
}
