export interface ApiCallBack {
  onResult(data: any, type: any, other?: any): void;
  onError(err: any, type: any, other?: any): void;
}
