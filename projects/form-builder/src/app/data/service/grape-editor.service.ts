import { Injectable } from '@angular/core';

import grapesjs from 'grapesjs';
import 'grapesjs-blocks-basic';
import 'grapesjs-preset-webpage';
// import 'grapesjs-preset-newsletter';
import 'grapesjs-plugin-forms';
import 'grapesjs-script-editor';
import 'grapesjs-component-code-editor';
import 'grapesjs-blocks-table';

import { ApiCallBack } from '../../http/callback/api-callback';
import { ApiCallHelper } from '../../http/api-call-helper';
import { AppGlobalConstant } from '../../constants/app-global-constant';
import { LzApiService } from '../../http/lz-api.service';
import { SettingsData } from '../settings-data';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root',
})
export class GrapeEditorService implements ApiCallBack {
  public editor: any;
  constructor(
    private lzApiService: LzApiService,
    private settingsData: SettingsData,
    private cookieService: CookieService
  ) {}

  public initialize(): any {
    // console.log(this.cookieService.get('accessToken'));

    return grapesjs.init({
      container: '#gjs',
      fromElement: true,
      height: '100%',
      width: 'auto',
      autorender: true,
      forceClass: true,
      components: '',
      showOffsets: true,
      avoidInlineStyle: true,
      showDevices: false,
      storageManager: {
        type: 'remote', // Storage type. Available: local | remote
        autosave: false, // Store data automatically
        autoload: false, // Autoload stored data on init
        stepsBeforeSave: 1, // If autosave is enabled, indicates how many changes are necessary before the store method is triggered
        // ...
        // Default storage options
        // options: {
        //   local: {
        //     /* ... */
        //   },
        //   remote: {
        //     urlLoad: loadUrl,
        //     urlStore:
        //       environment.baseUrl +
        //       AppGlobalConstant.CLINICAL_FORM_EDITOR_DATA_ +
        //       formId,
        //     // The `remote` storage uses the POST method when stores data but
        //     // the json-server API requires PATCH.
        //     // fetchOptions: (opts) =>
        //     //   opts.method === 'POST' ? { method: 'PATCH' } : {},
        //     // As the API stores projects in this format `{id: 1, data: projectData }`,
        //     // we have to properly update the body before the store and extract the
        //     // project data from the response result.
        //     // onStore: (data) => {
        //     //   const pagesHtml = this.editor.Pages.getAll().map((page) => {
        //     //     const component = page.getMainComponent();
        //     //     return {
        //     //       html: this.editor.getHtml({ component }),
        //     //       css: this.editor.getCss({ component }),
        //     //     };
        //     //   });
        //     //   return { id: formId, data, pagesHtml };
        //     // },
        //     // onLoad: (result) => {
        //     //   result.data;
        //     //   console.log(result);
        //     // },

        //     headers: {
        //       Authorization: 'Bearer ' + this.cookieService.get('accessToken'),
        //     },
        //   },
        // },
      },

      panels: {},
      plugins: [
        'grapesjs-preset-webpage',
        // 'grapesjs-preset-newsletter',
        'grapesjs-plugin-forms',
        'grapesjs-script-editor',
        'grapesjs-component-code-editor',
        'gjs-blocks-basic',
        'grapesjs-blocks-table',
        // 'grapesjs-blocks-bootstrap4',
      ],
      pluginsOpts: {
        'gjs-blocks-basic': {},
        'grapesjs-preset-webpage': {
          navbarOpts: false,
          countdownOpts: {},
          formsOpts: {},
          textCleanCanvas: 'Are you sure to clean the canvas?',
          showStylesOnChange: true,
          blocksBasicOpts: {
            blocks: [
              'link-block',
              'quote',
              'image',
              'video',
              'text',
              'column1',
              'column2',
              'column3',
            ],
            flexGrid: true,
            stylePrefix: 'lala-',
          },
        },
        // 'grapesjs-preset-newsletter': {
        //   modalTitleImport: 'Import template',
        //   // ... other options
        //   modalLabelImport: '',
        //   modalLabelExport: '',
        //   importPlaceholder: '',
        //   inlineCss: true,
        //   cellStyle: { padding: 0, margin: 0, 'vertical-align': 'top' },
        //   tableStyle: {
        //     height: '150px',
        //     margin: '0 auto 10px auto',
        //     padding: '5px 5px 5px 5px',
        //     width: '100%',
        //   },
        // },
        'grapesjs-plugin-forms': {},
        'grapesjs-script-editor': {},
        'grapesjs-component-code-editor': {
          /* options */
        },
        'grapesjs-blocks-table': {
          'grapesjs-blocks-table': { containerId: '#gjs' },
        },
      },
      canvas: {
        styles: [
          'https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css',
          'https://maxcdn.bootstrapcdn.com/font-awesome/4.4.0/css/font-awesome.min.css',
          'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.1.1/css/fontawesome.min.css',
        ],
        scripts: [
          'https://code.jquery.com/jquery-3.3.1.slim.min.js',
          'https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js',
          'https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js',
        ],
      },
    });
  }

  public setOpenCode(editor: any): void {
    const pn = editor.Panels;
    const panelViews = pn.addPanel({
      id: 'views',
    });
    panelViews.get('buttons').add([
      {
        attributes: {
          title: 'Open Code',
        },
        className: 'fa fa-file-code-o',
        command: 'open-code',
        togglable: false, // do not close when button is clicked again
        id: 'open-code',
      },
    ]);
  }

  public addTraits(editor): void {
    editor.DomComponents.addType('checkbox', {
      model: {
        defaults: {
          traits: [
            {
              type: 'id',
              name: 'did',
              label: 'did',
            },
            { type: 'checkbox', name: 'required' },
            { type: 'checkbox', name: 'checked' },
            { type: 'name', name: 'name' },
            { type: 'id', name: 'id' },
            { type: 'value', name: 'value' },
          ],
        },
      },
    });
  }

  getForms(callback: ApiCallBack, id: string): void {
    const apiObject: ApiCallHelper = {} as ApiCallHelper;
    apiObject.service = AppGlobalConstant.CLINICAL_FORM_BY_ + id;
    apiObject.method = 'GET';

    this.lzApiService.getData(
      apiObject,
      callback,
      AppGlobalConstant.CLINICAL_FORM_BY_ + 'GET'
    );
  }

  onResult(data: any, type: any, other?: any): void {
    switch (type) {
      case AppGlobalConstant.CLINICAL_FORM_BY_ + 'GET':
        this.settingsData.form = [];
        this.settingsData.form = data;

        break;

      default:
        break;
    }
  }
  onError(err: any, type: any, other?: any): void {
    throw new Error('Method not implemented.');
  }
}
