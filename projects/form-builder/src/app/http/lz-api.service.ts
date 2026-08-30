import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';
import { CookieService } from 'ngx-cookie-service';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CookieConstant } from '../common/constant/cookie-constant';
import { ApiCallHelper } from './api-call-helper';
import { ApiCallBack } from './callback/api-callback';

@Injectable({
  providedIn: 'root',
})
export class LzApiService {
  constructor(private http: HttpClient, private cookieService: CookieService) {}
  getDataDelete(
    apiObject: ApiCallHelper,
    callback: ApiCallBack,
    requestServiceType: any,
    dataToReturn?: any
  ): Observable<any> {
    let data: any;
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
    };
    const httpGetOptions = {
      params: apiObject.params,
    };
    switch (apiObject.method) {
      case 'DELETE':
        {
          data = this.http
            .delete(environment.baseUrl + apiObject.service, apiObject.params)
            .subscribe(
              (result) => {
                callback.onResult(result, requestServiceType, dataToReturn);
              },
              (err) => {
                callback.onError(err, requestServiceType, dataToReturn);
              }
            );
        }
        break;
      default:
        break;
    }
    return data;
  }

  getData(
    apiObject: ApiCallHelper,
    callback: ApiCallBack,
    requestServiceType: any,
    dataToReturn?: any
  ): Observable<any> {
    let data: any;
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
    };
    const httpGetOptions = {
      params: apiObject.params,
    };
    switch (apiObject.method) {
      case 'GET':
        {
          data = this.http
            .get(environment.baseUrl + apiObject.service, httpGetOptions)
            .subscribe(
              (result) => {
                callback.onResult(result, requestServiceType, dataToReturn);
              },
              (err) => {
                callback.onError(err, requestServiceType, dataToReturn);
              }
            );
        }
        break;
      case 'POST':
        data = this.http
          .post(
            environment.baseUrl + apiObject.service,
            apiObject.params,
            httpOptions
          )
          .subscribe(
            (result) => {
              callback.onResult(result, requestServiceType, dataToReturn);
            },
            (err) => {
              // AppUtils.showWarnViaToast(
              //   this.messageService,
              //   'Transaction Failed!'
              // );
              callback.onError(err, requestServiceType, dataToReturn);
            }
          );
        break;
      case 'PUT':
        data = this.http
          .put<any>(environment.baseUrl + apiObject.service, apiObject.params)
          .subscribe(
            (result) => {
              callback.onResult(result, requestServiceType, dataToReturn);
            },
            (err) => {
              callback.onError(err, requestServiceType, dataToReturn);
            }
          );
        break;
      case 'DELETE':
        {
          data = this.http
            .delete(environment.baseUrl + apiObject.service + apiObject.params)
            .subscribe(
              (result) => {
                callback.onResult(result, requestServiceType, dataToReturn);
              },
              (err) => {
                callback.onError(err, requestServiceType, dataToReturn);
              }
            );
        }
        break;
      case 'DOWNLOAD_EXCEL':
        {
          data = this.http
            .get(environment.baseUrl + apiObject.service, {
              responseType: 'arraybuffer' as 'json',
            })
            .subscribe(
              (result) => {
                callback.onResult(result, requestServiceType, dataToReturn);
              },
              (err) => {
                callback.onError(err, requestServiceType, dataToReturn);
              }
            );
        }
        break;
      case 'UPLOAD_EXCEL':
        {
          // tslint:disable-next-line: max-line-length
          data = this.http
            .post(environment.baseUrl + apiObject.service, apiObject.formData, {
              params: { customerId: apiObject.params },
            })
            .subscribe(
              (result) => {
                callback.onResult(result, requestServiceType, dataToReturn);
              },
              (err) => {
                callback.onError(err, requestServiceType, dataToReturn);
              }
            );
        }
        break;
      default:
        break;
    }
    return data;
  }

  downLoadFile(
    apiObject: ApiCallHelper,
    fileName: string,
    isView?: boolean,
    requestServiceType?: any,
    callback?: ApiCallBack,
    isNotSave?: boolean
  ): Observable<any> {
    let data: any;

    switch (apiObject.method) {
      case 'GET':
        {
          data = this.http
            .get(environment.baseUrl + apiObject.service, {
              headers: new HttpHeaders({
                Authorization:
                  'Bearer ' +
                  atob(
                    this.cookieService.get(btoa(CookieConstant.ACCESS_TOKEN))
                  ),
              }),
              responseType: 'blob',
            })
            .subscribe(
              (result) => {
                let blob: any = new Blob([result], {
                  type: result.type,
                });
                const url = window.URL.createObjectURL(blob);
                let file: File = null;
                try {
                  file = new File([blob], fileName);
                } catch (error) {}

                if (isView) {
                  window.open(url);
                } else if (!isNotSave) {
                  saveAs(blob, fileName);
                }
                //window.location.href = response.url;
                callback.onResult(result, requestServiceType, file);
              },
              (err) => {
                callback.onError(err, requestServiceType, null);
                console.log('Error downloading the file');
              },
              () => {
                console.info('File downloaded successfully');
              }
            );
        }
        break;

      case 'POST':
        {
          data = this.http
            .post(environment.baseUrl + apiObject.service, apiObject.params, {
              headers: new HttpHeaders({
                Authorization:
                  'Bearer ' +
                  atob(
                    this.cookieService.get(btoa(CookieConstant.ACCESS_TOKEN))
                  ),
              }),
              responseType: 'blob',
            })
            .subscribe(
              (result) => {
                let blob: any = new Blob([result], {
                  type: result.type,
                });
                const url = window.URL.createObjectURL(blob);
                // window.open(url);
                //window.location.href = response.url;
                callback.onResult(result, requestServiceType, blob);
                saveAs(blob, fileName);
              },
              (err) => {
                console.log('Error downloading the file');
                callback.onError(err, requestServiceType, null);
              },
              () => {
                console.info('File downloaded successfully');
              }
            );
        }
        break;

      default:
        break;
    }
    return data;
  }

  getAgoraData(
    apiObject: ApiCallHelper,
    callback: ApiCallBack,
    requestServiceType: any,
    dataToReturn?: any
  ): Observable<any> {
    let data: any;
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
    };
    const httpGetOptions = {
      params: apiObject.params,
    };
    switch (apiObject.method) {
      case 'GET':
        {
          data = this.http.get(apiObject.service, httpGetOptions).subscribe(
            (result) => {
              callback.onResult(result, requestServiceType, dataToReturn);
            },
            (err) => {
              callback.onError(err, requestServiceType, dataToReturn);
            }
          );
        }
        break;
      case 'POST':
        data = this.http
          .post(apiObject.service, apiObject.params, httpOptions)
          .subscribe(
            (result) => {
              callback.onResult(result, requestServiceType, dataToReturn);
            },
            (err) => {
              callback.onError(err, requestServiceType, dataToReturn);
            }
          );
        break;
      default:
        break;
    }
    return data;
  }
}
