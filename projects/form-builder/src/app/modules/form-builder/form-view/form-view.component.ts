import { AppUtils } from './../../../common/app-utils';
import { FormEvent } from './../../../data/model/forms';
import { AfterViewInit, Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { FormService } from '../../../data/service/form.service';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { AppGlobalConstant } from '../../../constants/app-global-constant';
import { DomSanitizer } from '@angular/platform-browser';
import { SettingsData } from '../../../data/settings-data';
import { Location } from '@angular/common';

@Component({
  selector: 'app-form-view',
  templateUrl: './form-view.component.html',
  styleUrls: ['./form-view.component.scss'],
})
export class FormViewComponent implements OnInit, AfterViewInit {
  formCss = '';
  formHtml = '';
  formScript = '';
  displayContent: any;
  form: any;
  selectedFormTemplate: FormEvent;
  isIframeRendered = false;
  @ViewChild('contentContainer', { static: false }) contentContainer: ElementRef;

  constructor(
    private formService: FormService,
    private route: ActivatedRoute,
    private location: Location,
    public settingsData: SettingsData,
    public sanitizer: DomSanitizer,
    private router: Router,
    private renderer: Renderer2
  ) {
    const nav = this.router.getCurrentNavigation();
    this.form = nav?.extras?.state?.['form'] || (history.state && history.state.form);
    if (!this.form) {
      try {
        const cached = sessionStorage.getItem('form_builder_preview_form');
        if (cached) {
          this.form = JSON.parse(cached);
        }
      } catch (e) {
        console.warn('Could not read cached preview form in constructor:', e);
      }
    }
  }

  ngOnInit() {
    if (!this.form) {
      this.form = (history.state && history.state.form) || null;
      if (!this.form) {
        try {
          const cached = sessionStorage.getItem('form_builder_preview_form');
          if (cached) {
            this.form = JSON.parse(cached);
          }
        } catch (e) {
          console.warn('Could not read cached preview form in ngOnInit:', e);
        }
      }
    }

    if (this.form?.html) {
      this.formHtml = this.form.html;
      this.formCss = this.form.css || '';
      this.formHtml = this.formHtml + '<style>' + this.formCss + '</style>';
      if (this.form.jsCode) {
        this.formScript = this.form.jsCode;
        this.formHtml += this.formScript;
      }
      this.displayContent = this.sanitizer.bypassSecurityTrustHtml(this.formHtml);
      return;
    }

    if (
      (this.selectedFormTemplate?.admitType === 'OP' || this.form?.admitType === 'OP') &&
      (this.form?.id || this.selectedFormTemplate?.id)
    ) {
      this.formService.getFormBuilderData(this, this.form?.id || this.selectedFormTemplate?.id);
    } else if (
      (this.selectedFormTemplate?.admitType === 'IP' || this.form?.admitType === 'IP') &&
      (this.form?.id || this.selectedFormTemplate?.id)
    ) {
      this.formService.getIpFormBuilderData(this, this.form?.id || this.selectedFormTemplate?.id);
    } else if (
      (this.selectedFormTemplate?.admitType === 'ER' || this.form?.admitType === 'ER') &&
      (this.form?.id || this.selectedFormTemplate?.id)
    ) {
      this.formService.getErFormBuilderData(this, this.form?.id || this.selectedFormTemplate?.id);
    }
  }

  ngAfterViewInit(): void {
    if (this.formHtml) {
      this.createIframeAndAppend(this.formHtml);
    }
  }

  back() {
    this.location.back();
  }

  print() {
    const w = window.open('', '_blank', 'width=1000,height=1500');
    if (w) {
      w.document.open();
      w.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Document</title>
            <style>${this.formCss}</style>
          </head>
          <body>
            ${this.formHtml}
          </body>
        </html>
      `);
      w.document.close();
      setTimeout(() => {
        w.print();
        w.close();
      }, 300);
    }
  }

  createIframeAndAppend(html: string) {
    if (!this.contentContainer?.nativeElement) {
      return;
    }
    this.contentContainer.nativeElement.innerHTML = '';
    const iframe = this.renderer.createElement('iframe');
    this.renderer.setAttribute(iframe, 'srcdoc', html);
    this.renderer.setStyle(iframe, 'height', '100%');
    this.renderer.setStyle(iframe, 'min-height', '750px');
    this.renderer.setStyle(iframe, 'width', '100%');
    this.renderer.setStyle(iframe, 'border', 'none');
    
    this.renderer.appendChild(this.contentContainer.nativeElement, iframe);
    this.isIframeRendered = true;
  }

  onResult(data: any, type: any, other?: any): void {
    switch (type) {
      case AppGlobalConstant.CLINICAL_FORM_BY_ + 'GET':
        this.settingsData.form = [];
        this.settingsData.form = data;
        break;
      case AppGlobalConstant.CLINICAL_FORM_BUILDER_DATA + 'GET':
      case AppGlobalConstant.ER_CLINICAL_FORM_BUILDER_DATA + 'GET':
      case AppGlobalConstant.IP_CLINICAL_FORM_BUILDER_DATA + 'GET':
        const formData = data?.data;
        this.settingsData.form = formData;
        this.formHtml = formData?.html || '';
        this.formCss = formData?.css || '';
        this.formHtml = this.formHtml + '<style>' + this.formCss + '</style>';
        if (formData?.jsCode) {
          this.formScript = formData.jsCode;
          this.formHtml += this.formScript;
        }

        this.displayContent = this.sanitizer.bypassSecurityTrustHtml(
          this.formHtml
        );

        this.createIframeAndAppend(this.formHtml);
        break;
      case AppGlobalConstant.GET_ADMISSION_FORM_DATA:
        this.settingsData.form = data;
        if (Array.isArray(data) && data.length > 0) {
          this.formHtml = data[0].html || '';
          this.formCss = data[0].css || '';
          this.formHtml = this.formHtml + '<style>' + this.formCss + '</style>';
          this.displayContent = this.sanitizer.bypassSecurityTrustHtml(
            this.formHtml
          );
          this.createIframeAndAppend(this.formHtml);
        }
        break;

      default:
        break;
    }
  }

  onError(err: any, type: any, other?: any): void {
    switch (type) {
      case AppGlobalConstant.CLINICAL_FORM_BY_ + 'GET':
        break;

      default:
        break;
    }
  }
}
