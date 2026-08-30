import { Injectable } from '@angular/core';
import { SystemMaster } from './system-master';

@Injectable({
  providedIn: 'root',
})
export class SystemMasterData {
  public systemMaster: SystemMaster[] = [];
  public uomClass: SystemMaster[];
}
