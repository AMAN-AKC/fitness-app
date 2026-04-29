import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ErrorPageComponent } from './error-page.component';

describe('ErrorPageComponent', () => {
  let component: ErrorPageComponent;
  let fixture: ComponentFixture<ErrorPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ErrorPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start countdown on init', () => {
    expect(component.retryCountdown).toBe(15);
  });

  it('should decrement countdown', (done) => {
    component.startCountdown();
    setTimeout(() => {
      expect(component.retryCountdown).toBeLessThan(15);
      done();
    }, 1100);
  });

  it('should reset countdown', () => {
    component.retryCountdown = 5;
    component.resetCountdown();
    expect(component.retryCountdown).toBe(15);
  });

  it('should provide correct number of error screens', () => {
    expect(component.errors.length).toBe(5);
  });

  it('should provide all 4 toast types', () => {
    expect(component.toasts.length).toBe(4);
  });
});
