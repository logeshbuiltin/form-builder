import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppUtils } from '../../common/app-utils';
import { SystemMasterConstant } from '../../common/constant/system-master-constant';
import { AppGlobalConstant } from '../../constants/app-global-constant';
import { ApiCallHelper } from '../../http/api-call-helper';
import { ApiCallBack } from '../../http/callback/api-callback';
import { LzApiService } from '../../http/lz-api.service';
import { SystemMasterData } from '../model/system-master-data';

@Injectable({
  providedIn: 'root',
})
export class MasterService implements ApiCallBack {
  constructor(
    private lzApiService: LzApiService,
    private systemMasterData: SystemMasterData
  ) {}

  public getSystemMastersByLanguage(
    callBack: ApiCallBack,
    typeIdentifiers: any[],
    languageIdentifier: string
  ): void {
    let params = new HttpParams();
    if (!AppUtils.isNull(typeIdentifiers) && typeIdentifiers.length > 0) {
      typeIdentifiers.forEach((item) => {
        params = params.append('typeIdentifiers', item);
      });
    } else {
      params = params.append('typeIdentifiers', '');
    }
    params = params.append('languageIdentifier', languageIdentifier);
    const apiObject: ApiCallHelper = {} as ApiCallHelper;
    apiObject.service = AppGlobalConstant.SYSTEM_MASTERS_LANGUAGE_GET;
    apiObject.method = 'GET';
    apiObject.params = params;
    this.lzApiService.getData(
      apiObject,
      callBack,
      AppGlobalConstant.SYSTEM_MASTERS_LANGUAGE_GET
    );
  }

  onResult(data: any, type: any, other?: any): void {
    switch (type) {
      case AppGlobalConstant.SYSTEM_MASTERS_LANGUAGE_GET:
        this.systemMasterData.uomClass = [];
        data.forEach((element) => {
          switch (element?.typeIdentifier) {
            case SystemMasterConstant.UOM_CLASS:
              this.systemMasterData.uomClass.push(element);

              break;

            default:
              break;
          }
        });
        break;
      default:
        break;
    }
  }
  onError(err: any, type: any, other?: any): void {
    throw new Error('Method not implemented.');
  }
}
