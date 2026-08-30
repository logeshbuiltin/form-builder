import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';

import { AuthGuardService } from './guard/auth-guard.service';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
    // canActivate: [AuthGuardService],
  },
  {
    path: 'home',
    loadChildren: () =>
      import('./modules/form-builder/form-builder.module').then(
        (m) => m.FormBuilderModule
      ),
  },
  // { path: 'error', component: AppErrorComponent },
  // { path: 'access', component: AppAccessdeniedComponent },
  // { path: 'notfound', component: AppNotfoundComponent },
  // {
  //   path: 'login',
  //   component: AppLoginComponent,
  //   canActivate: [LoginGuardService],
  // },

  // { path: '**', redirectTo: '/notfound' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
