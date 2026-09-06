import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { FormViewComponent } from './form-view.component';
import { SettingsData } from '../../../data/settings-data';

describe('FormViewComponent', () => {
  let component: FormViewComponent;
  let fixture: ComponentFixture<FormViewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, TranslateModule.forRoot()],
      declarations: [FormViewComponent],
      providers: [MessageService, SettingsData],
    }).compileComponents();
  }));

  beforeEach(() => {
    try {
      sessionStorage.clear();
      window.history.replaceState(null, '');
    } catch (e) {}
    fixture = TestBed.createComponent(FormViewComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
