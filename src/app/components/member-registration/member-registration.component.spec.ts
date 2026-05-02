import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemberRegistrationComponent } from './member-registration.component';

describe('MemberRegistrationComponent', () => {
  let component: MemberRegistrationComponent;
  let fixture: ComponentFixture<MemberRegistrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MemberRegistrationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MemberRegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with step 1', () => {
    expect(component.step).toBe(1);
  });

  it('should initialize complete as false', () => {
    expect(component.complete).toBeFalsy();
  });

  it('should display registration title', () => {
    const title = fixture.nativeElement.querySelector('.registration-title');
    expect(title.textContent).toContain('Register New Member');
  });

  it('should have 4 steps in stepper', () => {
    expect(component.steps.length).toBe(4);
  });

  it('should move to next step when handleNext is called', () => {
    component.handleNext(new Event('submit'));
    expect(component.step).toBe(2);
  });

  it('should move to previous step when handlePrev is called', () => {
    component.step = 2;
    component.handlePrev(new Event('submit'));
    expect(component.step).toBe(1);
  });

  it('should not go below step 1', () => {
    component.step = 1;
    component.handlePrev(new Event('submit'));
    expect(component.step).toBe(1);
  });

  it('should not go above step 4', () => {
    component.step = 4;
    component.handleNext(new Event('submit'));
    expect(component.step).toBe(4);
  });

  it('should complete registration when handleFinish is called with terms agreed', () => {
    component.step = 4;
    component.termsAgreed = true;
    component.handleFinish(new Event('submit'));
    expect(component.complete).toBeTruthy();
  });

  it('should not complete if terms not agreed', () => {
    component.step = 4;
    component.termsAgreed = false;
    component.handleFinish(new Event('submit'));
    expect(component.complete).toBeFalsy();
  });

  it('should calculate age correctly', () => {
    const today = new Date();
    const birthYear = today.getFullYear() - 25;
    component.formData.dateOfBirth = `${birthYear}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    expect(component.getAge()).toBe('25');
  });

  it('should return -- when no date of birth set', () => {
    component.formData.dateOfBirth = '';
    expect(component.getAge()).toBe('--');
  });

  it('should reset form when resetForm is called', () => {
    component.step = 3;
    component.complete = true;
    component.termsAgreed = true;
    component.formData.fullName = 'John Doe';

    component.resetForm();

    expect(component.step).toBe(1);
    expect(component.complete).toBeFalsy();
    expect(component.termsAgreed).toBeFalsy();
    expect(component.formData.fullName).toBe('');
  });

  it('should return true for isStepCompleted when step is less than current', () => {
    component.step = 3;
    expect(component.isStepCompleted(1)).toBeTruthy();
    expect(component.isStepCompleted(2)).toBeTruthy();
    expect(component.isStepCompleted(3)).toBeFalsy();
  });

  it('should return true for isStepActive when step matches current', () => {
    component.step = 2;
    expect(component.isStepActive(2)).toBeTruthy();
    expect(component.isStepActive(1)).toBeFalsy();
  });

  it('should return true for isStepUpcoming when step is greater than current', () => {
    component.step = 2;
    expect(component.isStepUpcoming(3)).toBeTruthy();
    expect(component.isStepUpcoming(1)).toBeFalsy();
  });

  it('should toggle addOn selection', () => {
    const addOn = component.addOns[0];
    const initialState = addOn.selected;
    component.toggleAddOn(0);
    expect(addOn.selected).toBe(!initialState);
  });

  it('should have 3 branches', () => {
    expect(component.branches.length).toBe(3);
  });

  it('should have 3 plans', () => {
    expect(component.plans.length).toBe(3);
  });

  it('should have 2 addOns', () => {
    expect(component.addOns.length).toBe(2);
  });

  it('should update progress bar when step changes', () => {
    component.step = 2;
    component.updateProgressBar();
    expect(component.progressBarWidth).toBe(50);
  });

  it('should update progress bar width correctly for each step', () => {
    component.step = 1;
    component.updateProgressBar();
    expect(component.progressBarWidth).toBe(25);

    component.step = 2;
    component.updateProgressBar();
    expect(component.progressBarWidth).toBe(50);

    component.step = 3;
    component.updateProgressBar();
    expect(component.progressBarWidth).toBe(75);

    component.step = 4;
    component.updateProgressBar();
    expect(component.progressBarWidth).toBe(100);
  });
});
