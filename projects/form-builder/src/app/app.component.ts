import { HttpParams } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MessageService, PrimeNGConfig } from 'primeng/api';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [MessageService],
})
export class AppComponent implements OnInit {
  public editor: any = null;
  topbarTheme = 'blue';

  menuTheme = 'light';

  layoutMode = 'light';

  menuMode = 'static'; // 'horizontal';

  inlineMenuPosition = 'bottom';

  inputStyle = 'outlined'; // 'filled';

  ripple = true;

  isRTL = false;

  constructor(private primengConfig: PrimeNGConfig) {}

  ngOnInit() {
    this.primengConfig.ripple = true;
    const params = new HttpParams().set('typeIdentifier', '');
  }

  onResult(data: any, type: any, other?: any): void {
    switch (type) {
      default:
        break;
    }
  }
  onError(err: any, type: any, other?: any): void {
    throw new Error('Method not implemented.');
  }
}
