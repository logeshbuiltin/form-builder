import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiCallHelper } from './api-call-helper';
import { Observable } from 'rxjs';
import { ApiCallBack } from './callback/api-callback';

@Injectable({
  providedIn: 'root',
})
export class ExternalApiService {
  constructor(private http: HttpClient) {}

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
      // case 'GET':
      //   {
      //     data = this.http
      //       .get(environment.externalAPIURL + apiObject.service, httpGetOptions)
      //       .subscribe(
      //         (result) => {
      //           callback.onResult(result, requestServiceType, dataToReturn);
      //         },
      //         (err) => {
      //           callback.onError(err, requestServiceType, dataToReturn);
      //         }
      //       );
      //   }
      //   break;

      case 'POST':
        data = this.http;
        // .post(
        //   environment.externalAPIURL + apiObject.service,
        //   apiObject.params,
        //   httpOptions
        // )
        // .subscribe(
        //   (result) => {
        //     callback.onResult(result, requestServiceType, dataToReturn);
        //   },
        //   (err) => {
        //     callback.onError(err, requestServiceType, dataToReturn);
        //   }
        // );
        break;

      default:
        break;
    }
    return data;
  }
}
