import { Injectable } from '@angular/core';
import { FlowSheetItem } from './model/flow-sheet-item';
import { Form } from './model/forms';
import { TemplateDataObject } from './model/template-data-object';
import { TemplateDataTable } from './model/template-data-table';

@Injectable({
  providedIn: 'root',
})
export class SettingsData {
  public dataObjectList: TemplateDataObject[] = [];
  public flowSheetItemList: FlowSheetItem[] = [];
  public dataTableList: TemplateDataTable[] = [];
  public emrComponents: any;
  public form: Form[];

  constructor() {}

  clear(): void {
    this.dataObjectList = [];
    this.flowSheetItemList = [];
  }
}
