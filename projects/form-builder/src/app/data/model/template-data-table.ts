import { TransactionBase } from '../../common/transaction-base';
import { TemplateDataObject } from './template-data-object';

export class TemplateDataTable extends TransactionBase {
  public id: string;
  public name: string;
  public identifier: string;
  public templateDataObjects: TemplateDataObject[];
  public isForm: boolean;
}
