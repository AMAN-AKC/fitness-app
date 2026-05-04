import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ErrorStatesViewComponent } from './error-states-view.component';

describe('ErrorStatesViewComponent', () => {
  let component: ErrorStatesViewComponent;
  let fixture: ComponentFixture<ErrorStatesViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ErrorStatesViewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorStatesViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should select error', () => {
    component.selectError('500');
    expect(component.selectedError).toBe('500');
  });

  it('should get error details', () => {
    component.selectedError = '404';
    const details = component.getErrorDetails();
    expect(details.title).toBe('Page Not Found');
  });
});
