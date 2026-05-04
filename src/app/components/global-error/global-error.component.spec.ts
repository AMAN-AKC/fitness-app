import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GlobalErrorComponent } from './global-error.component';

describe('GlobalErrorComponent', () => {
  let component: GlobalErrorComponent;
  let fixture: ComponentFixture<GlobalErrorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GlobalErrorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GlobalErrorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should add alert', () => {
    const initialCount = component.alerts.length;
    component.addAlert('Test error', 'error');
    expect(component.alerts.length).toBe(initialCount + 1);
  });

  it('should remove alert', () => {
    component.addAlert('Test', 'error');
    const id = component.alerts[0].id;
    component.removeAlert(id);
    expect(component.alerts.find((a) => a.id === id)).toBeUndefined();
  });

  it('should get alert colors', () => {
    expect(component.getAlertBgColor('error')).toBe('bg-[#FEF2F2]');
    expect(component.getAlertBorderColor('warning')).toBe('border-[#D97706]');
  });
});
