import { MessageService } from 'primeng/api';

export class AppUtils {
  constructor() {}
  public static isNull(value: any): boolean {
    if (value == null) {
      return true;
    } else if (value === '') {
      return true;
    } else if (value === 'null') {
      return true;
    } else if (value === 'NULL') {
      return true;
    } else if (value === 'undefined') {
      return true;
    } else if (value === 0) {
      return true;
    } else {
      return false;
    }
  }

  public static getValue(value: any): any {
    if (value == null) {
      return '';
    } else if (value === '') {
      return '';
    } else if (value === 'null') {
      return '';
    } else if (value === 'NULL') {
      return '';
    } else if (value === 'undefined') {
      return '';
    } else if (value === 0) {
      return '';
    } else {
      return value;
    }
  }

  public static showErrorViaToast(
    service: MessageService,
    message: string
  ): void {
    service.add({
      key: 'tst',
      severity: 'error',
      summary: 'Error Message',
      detail: message,
    });
  }

  public static showInfoViaToast(
    service: MessageService,
    message: string,
    toastKey?: string
  ): void {
    if (this.isNull(toastKey)) {
      toastKey = 'tst';
    }
    service.add({
      key: 'tst',
      severity: 'info',
      summary: 'Info Message',
      detail: message,
    });
  }

  public static showWarnViaToast(
    service: MessageService,
    message: string,
    toastKey?: string
  ): void {
    if (this.isNull(toastKey)) {
      toastKey = 'tst';
    }
    service.add({
      key: toastKey,
      severity: 'warn',
      summary: 'Warning Message',
      detail: message,
    });
  }

  public static showSuccessViaToast(
    service: MessageService,
    message: string
  ): void {
    service.add({
      key: 'tst',
      severity: 'success',
      summary: 'Success Message',
      detail: message,
    });
  }
}
