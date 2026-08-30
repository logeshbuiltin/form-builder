import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FormBuilderComponent } from './form-builder/form-builder.component';
import { FormViewComponent } from './form-view/form-view.component';

const routes: Routes = [
  { path: '', redirectTo: 'form-builder', pathMatch: 'full' },
  { path: 'form-builder', component: FormBuilderComponent },
  { path: 'form-view', component: FormViewComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FormBuilderRoutingModule {}
