import { AppUtils } from './../../../common/app-utils';
import { FormEvent } from './../../../data/model/forms';
import { Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { FormService } from '../../../data/service/form.service';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { AppGlobalConstant } from '../../../constants/app-global-constant';
import { DomSanitizer } from '@angular/platform-browser';
import { SettingsData } from '../../../data/settings-data';
import { Location } from '@angular/common';
import $ from 'jquery';
@Component({
  selector: 'app-form-view',
  templateUrl: './form-view.component.html',
  styleUrls: ['./form-view.component.scss'],
})
export class FormViewComponent implements OnInit {
  formCss = '';
  formHtml = '';
  formScript = '';
  displayContent: any;
  form: FormEvent;
  selectedFormTemplate: FormEvent;
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
    this.form = this.router.getCurrentNavigation().extras?.state.form;
  }

  ngOnInit() {
    console.log(this.selectedFormTemplate);
    // this.formService.getFormss(this, this.form?.id);

    // this.formService.getAdmissionTemplatedata(this);
    if (
      this.selectedFormTemplate?.admitType === 'OP' ||
      this.form?.admitType === 'OP'
    ) {
      this.formService.getFormBuilderData(this, this.form?.id);
    } else if (
      this.selectedFormTemplate?.admitType === 'IP' ||
      this.form?.admitType === 'IP'
    ) {
      this.formService.getIpFormBuilderData(this, this.form?.id);
    } else if (
      this.selectedFormTemplate?.admitType === 'ER' ||
      this.form?.admitType === 'ER'
    ) {
      this.formService.getErFormBuilderData(this, this.form?.id);
    }
  }
  back() {
    this.location.back();
    // this.formService.getFormBuilderData(this, this.form?.id);
  }

  print() {
    var w = window.open('', '_blank', 'width=1000,height=1500');
    var html = $('#print').html();
    $(w.document.body).html(html);
    w.print();
    w.close();
  }

  createIframeAndAppend(html) {    
    const iframe = this.renderer.createElement('iframe');
    this.renderer.setAttribute(iframe, 'srcdoc', html);
    this.renderer.setStyle(iframe, 'height', '650px');
    this.renderer.setStyle(iframe, 'width', '100%');
    this.renderer.setStyle(iframe, 'border', 'none');
    
    this.renderer.appendChild(this.contentContainer.nativeElement, iframe);
  }

  onResult(data: any, type: any, other?: any): void {
    switch (type) {
      case AppGlobalConstant.CLINICAL_FORM_BY_ + 'GET':
        this.settingsData.form = [];
        this.settingsData.form = data;
        // if (!AppUtils.isNull(data)) {
        //   this.formHtml = data.html;
        //   this.formCss = data.css;
        //   this.formHtml = this.formHtml + '<style>' + this.formCss + '</style>';
        //   this.displayContent = this.sanitizer.bypassSecurityTrustHtml(
        //     this.formHtml
        //   );
        // }
        break;
        case AppGlobalConstant.CLINICAL_FORM_BUILDER_DATA + 'GET':
        let formData = data?.data;
        this.settingsData.form = formData;
        this.formHtml = formData.html;
        this.formCss = formData.css;
        this.formHtml = this.formHtml + '<style>' + this.formCss + '</style>';
        if(formData.jsCode) {
          this.formScript = formData.jsCode;
          this.formHtml += this.formScript;
        }

        this.displayContent = this.sanitizer.bypassSecurityTrustHtml(
          this.formHtml
        );

        this.createIframeAndAppend(this.formHtml);
        break;
      case AppGlobalConstant.ER_CLINICAL_FORM_BUILDER_DATA + 'GET':
        this.settingsData.form = data?.data;
        this.formHtml = data?.data?.html;
        this.formCss = data?.data?.css;
        this.formHtml = this.formHtml + '<style>' + this.formCss + '</style>';
        if(formData.jsCode) {
          this.formScript = formData.jsCode;
          this.formHtml += this.formScript;
        }

        this.displayContent = this.sanitizer.bypassSecurityTrustHtml(
          this.formHtml
        );
        break;
      case AppGlobalConstant.IP_CLINICAL_FORM_BUILDER_DATA + 'GET':
        this.settingsData.form = data?.data;
        this.formHtml = data?.data.html;
        this.formCss = data?.data.css;
        this.formHtml = this.formHtml + '<style>' + this.formCss + '</style>';
        if(formData.jsCode) {
          this.formScript = formData.jsCode;
          this.formHtml += this.formScript;
        }
       this.displayContent = this.sanitizer.bypassSecurityTrustHtml(
          this.formHtml
        );
        break;
      case AppGlobalConstant.GET_ADMISSION_FORM_DATA:
        this.settingsData.form = data;
        this.formHtml = data[0].html;
        this.formCss = data[0].css;
        this.formHtml = this.formHtml + '<style>' + this.formCss + '</style>';
        this.displayContent = this.sanitizer.bypassSecurityTrustHtml(
          this.formHtml
        );
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
