import { TransactionBase } from '../../common/transaction-base';

export class TemplateDataObject extends TransactionBase {
  public id: string;
  public name: string;
  public identifier: string;
  public componentType: string;
  public componentTypeIdentifier: string;
  public dataObjectType: string;
  public componentGroup: string;
  public componentGroupIdentifier: string;
  public isReadOnly: boolean;
}
