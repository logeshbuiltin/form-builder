import { TransactionBase } from '../../common/transaction-base';
import { TemplateDataObject } from './template-data-object';

export class FlowSheetItemDTO extends TransactionBase {
  public id: string;
  public itemName: string;
  public templateDataObject: TemplateDataObject;
  public snowMedCode: string;
  public templateId: string;
  public itemType: any;
  public parentGroupId: string;
  // public parentSubGroupId: string;
}

export class FlowSheetItem extends TransactionBase {
  public id: string;
  public itemName: string;
  public templateDataObject: TemplateDataObject;
  public snowMedCode: string;
  public templateId: string;
  public itemType: any;
  public children: FlowSheetItem[];
}
