import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AppGlobalConstant } from '../../constants/app-global-constant';
import { ApiCallHelper } from '../../http/api-call-helper';
import { ApiCallBack } from '../../http/callback/api-callback';
import { LzApiService } from '../../http/lz-api.service';
import {
  EditorData,
  FormComponents,
  FormEditorValue,
  FormEditorValueDto,
} from '../model/forms';

@Injectable({
  providedIn: 'root',
})
export class FormService {
  constructor(
    private lzApiService: LzApiService,
    public translateService: TranslateService
  ) {}

  getDataObject(callback: ApiCallBack): void {
    const apiobject: ApiCallHelper = {} as ApiCallHelper;
    apiobject.service = AppGlobalConstant.CLINICAL_TEMPLATE_DATA_OBJECT;
    apiobject.method = 'GET';
    this.lzApiService.getData(
      apiobject,
      callback,
      AppGlobalConstant.CLINICAL_TEMPLATE_DATA_OBJECT + 'GET'
    );
  }

  getDataTable(callback: ApiCallBack): void {
    const apiobject: ApiCallHelper = {} as ApiCallHelper;
    apiobject.service = AppGlobalConstant.CLINICAL_TEMPLATE_DATA_TABLE;
    apiobject.method = 'GET';
    this.lzApiService.getData(
      apiobject,
      callback,
      AppGlobalConstant.CLINICAL_TEMPLATE_DATA_TABLE + 'GET'
    );
  }

  saveEditorForm(
    callback: ApiCallBack,
    formId: any,
    request: FormEditorValue
  ): void {
    const apiObject: ApiCallHelper = {} as ApiCallHelper;
    apiObject.service = AppGlobalConstant.CLINICAL_EDITOR_FORM_ + formId;
    apiObject.params = request;
    apiObject.method = 'POST';
    this.lzApiService.getData(
      apiObject,
      callback,
      AppGlobalConstant.CLINICAL_EDITOR_FORM_,
      request
    );
  }
  saveIPEditorForm(
    callback: ApiCallBack,
    formId: any,
    request: FormEditorValue
  ): void {
    const apiObject: ApiCallHelper = {} as ApiCallHelper;
    apiObject.service = AppGlobalConstant.IP_CLINICAL_EDITOR_FORM_ + formId;
    apiObject.params = request;
    apiObject.method = 'POST';
    this.lzApiService.getData(
      apiObject,
      callback,
      AppGlobalConstant.IP_CLINICAL_EDITOR_FORM_,
      request
    );
  }
  saveErEditorForm(
    callback: ApiCallBack,
    formId: any,
    request: FormEditorValue
  ): void {
    const apiObject: ApiCallHelper = {} as ApiCallHelper;
    apiObject.service = AppGlobalConstant.ER_CLINICAL_EDITOR_FORM_ + formId;
    apiObject.params = request;
    apiObject.method = 'POST';
    this.lzApiService.getData(
      apiObject,
      callback,
      AppGlobalConstant.ER_CLINICAL_EDITOR_FORM_,
      request
    );
  }
  getFormss(callback: ApiCallBack, id: string): void {
    const apiobject: ApiCallHelper = {} as ApiCallHelper;
    apiobject.service = AppGlobalConstant.CLINICAL_FORM_BY_ + id;
    apiobject.method = 'GET';

    this.lzApiService.getData(
      apiobject,
      callback,
      AppGlobalConstant.CLINICAL_FORM_BY_ + 'GET'
    );
  }

  saveCustomLayout(
    callback: ApiCallBack,
    formComponents: FormComponents
  ): void {
    const apiObject: ApiCallHelper = {} as ApiCallHelper;
    apiObject.service = AppGlobalConstant.CLINICAL_FORM_CUSTOM_LAYOUT;
    apiObject.params = formComponents;
    apiObject.method = 'POST';
    this.lzApiService.getData(
      apiObject,
      callback,
      AppGlobalConstant.CLINICAL_FORM_CUSTOM_LAYOUT,
      formComponents
    );
  }

  getCustomLayout(
    callback: ApiCallBack,
    customerBusinessId: any,
    eventIdentifier: string
  ): void {
    const apiobject: ApiCallHelper = {} as ApiCallHelper;
    apiobject.service =
      AppGlobalConstant.CLINICAL_FORM_CUSTOM_LAYOUT_ +
      customerBusinessId +
      '/' +
      eventIdentifier;
    apiobject.method = 'GET';

    this.lzApiService.getData(
      apiobject,
      callback,
      AppGlobalConstant.CLINICAL_FORM_CUSTOM_LAYOUT_
    );
  }

  // saveEditorData(
  //   callback: ApiCallBack,
  //   formId: any,
  //   request: EditorData
  // ): void {
  //   const apiObject: ApiCallHelper = {} as ApiCallHelper;
  //   apiObject.service = AppGlobalConstant.CLINICAL_FORM_EDITOR_DATA_ + formId;
  //   apiObject.params = request;
  //   apiObject.method = 'POST';
  //   this.lzApiService.getData(
  //     apiObject,
  //     callback,
  //     AppGlobalConstant.CLINICAL_FORM_EDITOR_DATA_,
  //     request
  //   );
  // }

  getEditorData(callback: ApiCallBack, formId: string): void {
    const apiobject: ApiCallHelper = {} as ApiCallHelper;
    apiobject.service = AppGlobalConstant.CLINICAL_FORM_EDITOR_DATA_ + formId;
    apiobject.method = 'GET';
    this.lzApiService.getData(
      apiobject,
      callback,
      AppGlobalConstant.CLINICAL_FORM_EDITOR_DATA_ + 'GET'
    );
  }

  getFormBuilderData(callback: ApiCallBack, id: string): void {
    const apiobject: ApiCallHelper = {} as ApiCallHelper;
    apiobject.service = AppGlobalConstant.CLINICAL_FORM_BUILDER_DATA + id;
    apiobject.method = 'GET';

    this.lzApiService.getData(
      apiobject,
      callback,
      AppGlobalConstant.CLINICAL_FORM_BUILDER_DATA + 'GET'
    );
  }
  getErFormBuilderData(callback: ApiCallBack, id: string): void {
    const apiobject: ApiCallHelper = {} as ApiCallHelper;
    apiobject.service = AppGlobalConstant.ER_CLINICAL_FORM_BUILDER_DATA + id;
    apiobject.method = 'GET';

    this.lzApiService.getData(
      apiobject,
      callback,
      AppGlobalConstant.ER_CLINICAL_FORM_BUILDER_DATA + 'GET'
    );
  }
  getIpFormBuilderData(callback: ApiCallBack, id: string): void {
    const apiobject: ApiCallHelper = {} as ApiCallHelper;
    apiobject.service = AppGlobalConstant.IP_CLINICAL_FORM_BUILDER_DATA + id;
    apiobject.method = 'GET';

    this.lzApiService.getData(
      apiobject,
      callback,
      AppGlobalConstant.IP_CLINICAL_FORM_BUILDER_DATA + 'GET'
    );
  }

  getCustomLayoutEditorData(
    callback: ApiCallBack,
    customLayoutId: string
  ): void {
    const apiobject: ApiCallHelper = {} as ApiCallHelper;
    apiobject.service =
      AppGlobalConstant.CLINICAL_CUSTOM_LAYOUT_EDITOR_DATA_ + customLayoutId;
    apiobject.method = 'GET';
    this.lzApiService.getData(
      apiobject,
      callback,
      AppGlobalConstant.CLINICAL_CUSTOM_LAYOUT_EDITOR_DATA_ + 'GET'
    );
  }

  saveIpdTemplateEditorData(
    callback: ApiCallBack,
    formId: any,
    request: FormEditorValueDto
  ): void {
    const apiObject: ApiCallHelper = {} as ApiCallHelper;
    apiObject.service = AppGlobalConstant.ADD_TEMPLATE_EDITOR_DATA + formId;
    apiObject.params = request;
    apiObject.method = 'POST';
    this.lzApiService.getData(
      apiObject,
      callback,
      AppGlobalConstant.ADD_TEMPLATE_EDITOR_DATA,
      request
    );
  }
  getAdmissionTemplatedata(callback: ApiCallBack) {
    const apiObject: ApiCallHelper = {} as ApiCallHelper;
    apiObject.service = AppGlobalConstant.GET_ADMISSION_FORM_DATA;
    apiObject.method = 'GET';
    this.lzApiService.getData(
      apiObject,
      callback,
      AppGlobalConstant.GET_ADMISSION_FORM_DATA
    );
  }
  getFormScriptData(callback: ApiCallBack, id: string): void {
    const apiobject: ApiCallHelper = {} as ApiCallHelper;
    apiobject.service = AppGlobalConstant.GET_FORM_SCRIPT_DATA + id;
    apiobject.method = 'GET';

    this.lzApiService.getData(
      apiobject,
      callback,
      AppGlobalConstant.GET_FORM_SCRIPT_DATA + 'GET'
    );
  }

}
