import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormBuilderRoutingModule } from './form-builder-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ThirdPartyModule } from '../third-party/third-party.module';
import { FormBuilderComponent } from './form-builder/form-builder.component';
import { MessageService } from 'primeng/api';
import { FormViewComponent } from './form-view/form-view.component';

@NgModule({
  declarations: [FormBuilderComponent, FormViewComponent],
  imports: [
    CommonModule,
    FormBuilderRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    ThirdPartyModule,
  ],
  providers: [MessageService],
})
export class FormBuilderModule {}
