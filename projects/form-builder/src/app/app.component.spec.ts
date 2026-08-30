import { AppMenuComponent } from './app.menu.component';
import { AppFooterComponent } from './app.footer.component';
import { AppTopBarComponent } from './app.topbar.component';
import { MenuService } from './app.menu.service';
import { TestBed, async } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { ProgressBarModule } from 'primeng/progressbar';

describe('AppComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, ProgressBarModule],
      declarations: [
        AppComponent,
        AppMenuComponent,
        AppTopBarComponent,
        AppFooterComponent,
      ],
      providers: [MenuService],
    });
    TestBed.compileComponents();
  });

  it('should create the app', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));
});
