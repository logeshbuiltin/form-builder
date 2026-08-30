import { Injectable } from '@angular/core';
import { AppUtils } from '../../common/app-utils';
import { DataObjectComponentType } from '../../common/enum/data-object-component-type.enum';
import { TemplateDataObject } from '../model/template-data-object';

@Injectable({
  providedIn: 'root',
})
export class DataObjectService {
  constructor() {}

  getDropDown(item: TemplateDataObject, dataTableId: string): string {
    let dropDown =
      '<div>' +
      item.name +
      ': ' +
      '<select key="' +
      item.name +
      (AppUtils.isNull(dataTableId) ? '' : '" datatableid="' + dataTableId) +
      '" class="select" name="' +
      item.identifier +
      '" id="' +
      item.identifier +
      '" class="' +
      item.identifier +
      '" name="' +
      item.identifier +
      '"><option value="">- Select option -</option></select></div>';
    return dropDown;
  }

  getDropDownWithUnit(item: TemplateDataObject, dataTableId: string): string {
    let dropDownWithUnit =
      '<div>' +
      item.name +
      ': ' +
      '<select key="' +
      item.name +
      (AppUtils.isNull(dataTableId) ? '' : '" datatableid="' + dataTableId) +
      '" class="select" name="' +
      item.identifier +
      '" id="' +
      item.identifier +
      '" class="' +
      item.identifier +
      '" name="' +
      item.identifier +
      '_1"><option value="">- Select option -</option></select>' +
      ' - ' +
      '<select key="' +
      item.name +
      (AppUtils.isNull(dataTableId) ? '' : '" datatableid="' + dataTableId) +
      '" class="select" name="' +
      item.identifier +
      '" id="' +
      item.identifier +
      '" class="' +
      item.identifier +
      '" name="' +
      item.identifier +
      '_2"><option value="">- Select option -</option></select></div>';

    return dropDownWithUnit;
  }

  getInputNumber(item: TemplateDataObject, dataTableId: string): string {
    let inputNumber =
      '<div>' +
      item.name +
      ': ' +
      '<input key="' +
      item.name +
      (AppUtils.isNull(dataTableId) ? '' : '" datatableid="' + dataTableId) +
      '" type="number" class="' +
      item.identifier +
      '" name="' +
      item.identifier +
      '"></input></div>';

    return inputNumber;
  }

  getInputNumberWithUnit(
    item: TemplateDataObject,
    dataTableId: string
  ): string {
    let inputNumberWithUnit =
      '<div>' +
      item.name +
      ': ' +
      '<input key="' +
      item.name +
      (AppUtils.isNull(dataTableId) ? '' : '" datatableid="' + dataTableId) +
      '" type="number" class="' +
      item.identifier +
      '" name="' +
      item.identifier +
      '_1"></input>' +
      ' - ' +
      '<select key="' +
      item.name +
      '" class="select" name="' +
      item.identifier +
      '" id="' +
      item.identifier +
      (AppUtils.isNull(dataTableId) ? '' : '" datatableid="' + dataTableId) +
      '" class="' +
      item.identifier +
      '" name="' +
      item.identifier +
      '_2"><option value="">- Select option -</option></select></div>';

    return inputNumberWithUnit;
  }

  getTextBox(item: TemplateDataObject, dataTableId: string): string {
    let textBox =
      '<div>' +
      item.name +
      ': ' +
      '<input key="' +
      item.name +
      (AppUtils.isNull(dataTableId) ? '' : '" datatableid="' + dataTableId) +
      '" type="text" class="' +
      item.identifier +
      '" name="' +
      item.identifier +
      '"></input></div>';

    return textBox;
  }

  getTextBoxWithUnit(item: TemplateDataObject, dataTableId: string): string {
    let textBoxWithUnit =
      '<div>' +
      item.name +
      ': ' +
      '<input key="' +
      item.name +
      (AppUtils.isNull(dataTableId) ? '' : '" datatableid="' + dataTableId) +
      '" type="text" class="' +
      item.identifier +
      '" name="' +
      item.identifier +
      '_1"></input>' +
      ' - ' +
      '<select key="' +
      item.name +
      (AppUtils.isNull(dataTableId) ? '' : '" datatableid="' + dataTableId) +
      '" class="select" name="' +
      item.identifier +
      '" id="' +
      item.identifier +
      '" class="' +
      item.identifier +
      '" name="' +
      item.identifier +
      '_2"><option value="">- Select option -</option></select></div>';

    return textBoxWithUnit;
  }

  getTextBoxWithSeparator(
    item: TemplateDataObject,
    dataTableId: string
  ): string {
    let textBoxWithSeparator =
      '<div>' +
      item.name +
      ': ' +
      '<input key="' +
      item.name +
      (AppUtils.isNull(dataTableId) ? '' : '" datatableid="' + dataTableId) +
      '" type="text" class="' +
      item.identifier +
      '" name="' +
      item.identifier +
      '_1"></input>' +
      ' - ' +
      '<input key="' +
      item.name +
      (AppUtils.isNull(dataTableId) ? '' : '" datatableid="' + dataTableId) +
      '" type="text" class="' +
      item.identifier +
      '" name="' +
      item.identifier +
      '_2"></input></div>';
    return textBoxWithSeparator;
  }

  getDataObjectHtml(item: TemplateDataObject, dataTableId: string): string {
    let htmlData = '';
    switch (item.componentTypeIdentifier) {
      case DataObjectComponentType.DROPDOWN:
        htmlData = this.getDropDown(item, dataTableId);
        break;
      case DataObjectComponentType.DROPDOWN_WITH_UNIT:
        htmlData = this.getDropDownWithUnit(item, dataTableId);
        break;
      case DataObjectComponentType.INPUT_NUMBER:
        htmlData = this.getInputNumber(item, dataTableId);
        break;
      case DataObjectComponentType.INPUT_NUMBER_WITH_UNIT:
        htmlData = this.getInputNumberWithUnit(item, dataTableId);
        break;
      case DataObjectComponentType.TEXT_BOX:
        htmlData = this.getTextBox(item, dataTableId);
        break;
      case DataObjectComponentType.TEXT_BOX_WITH_UNIT:
        htmlData = this.getTextBoxWithUnit(item, dataTableId);
        break;
      case DataObjectComponentType.TEXT_WITH_SEPARATOR:
        htmlData = this.getTextBoxWithSeparator(item, dataTableId);
        break;

      default:
        break;
    }
    return htmlData;
  }
}
