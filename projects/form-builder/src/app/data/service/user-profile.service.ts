import { Injectable } from '@angular/core';
import { LzApiService } from '../../http/lz-api.service';
import { UserProfile } from '../model/user-profile';

@Injectable({
  providedIn: 'root',
})
export class UserProfileService {
  constructor(private lzApiService: LzApiService) {}

  public userProfile: UserProfile;

  public getCustomerBusinessId(): any {
    return atob(localStorage.getItem(btoa('customerBusinessId')));
  }

  public getCustomerId(): any {
    return atob(localStorage.getItem(btoa('customerId')));
  }

  public getSiteId(): any {
    return atob(localStorage.getItem(btoa('siteId')));
  }
}
