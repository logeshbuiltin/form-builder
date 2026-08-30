import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { Injectable } from '@angular/core';
import { AppUtils } from '../common/app-utils';
import { CookieService } from 'ngx-cookie-service';
import { CookieConstant } from '../common/constant/cookie-constant';

@Injectable({
  providedIn: 'root',
})
export class AuthGuardService implements CanActivate {
  isInternal: boolean = false;
  isExternal: boolean = false;

  constructor(private router: Router, private cookieService: CookieService) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    if (
      AppUtils.isNull(
        atob(this.cookieService.get(btoa(CookieConstant.ACCESS_TOKEN)))
      )
    ) {
      this.logout(state);
      return false;
    } else {
      const expiry = new Date(
        atob(
          this.cookieService.get(btoa(CookieConstant.ACCESS_TOKEN_EXPIRY_DATE))
        )
      );
      const now = new Date();
      if (expiry < now) {
        this.logout(state);
        return false;
      }
    }
    return true;
  }

  logout(state: any): void {
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: state.url },
    });
  }
}
