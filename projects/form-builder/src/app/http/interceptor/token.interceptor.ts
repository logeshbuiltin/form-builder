import { catchError, map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
  HttpResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { AppUtils } from '../../common/app-utils';
import { CookieConstant } from '../../common/constant/cookie-constant';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor(
    // private authService: AuthService,
    private cookieService: CookieService
  ) {}
  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // const accessToken = this.cookieService.get('accessToken');
    const encodedToken = this.cookieService.get(btoa(CookieConstant.ACCESS_TOKEN));
    const accessToken = encodedToken ? atob(encodedToken) : '';

    console.log('Token Interceptor - Token present:', !!accessToken);
    console.log('Cookie value:', encodedToken);

    if (accessToken) {
      request = request.clone({
        headers: request.headers.set('Authorization', 'Bearer ' + accessToken),
      });
      console.log('Authorization header added');
    } else {
      console.warn('No access token found in cookies!');
    }

    return next.handle(request).pipe(
      map((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
        }
        return event;
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          if (error.statusText === 'Unauthorized') {
            // this.authService.logout();
            // this.authService.navigateToLogin();
          }
        }
        return throwError(error);
      })
    );
  }
}
