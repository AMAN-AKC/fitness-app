import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HealthFormsComponent } from './health-forms.component';

describe('HealthFormsComponent', () => {
  let component: HealthFormsComponent;
  let fixture: ComponentFixture<HealthFormsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HealthFormsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HealthFormsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate BMI correctly', () => {
    component.formData.height = 170;
    component.formData.weight = 75;
    component.calculateBMI();
    expect(component.bmi).toBe(25.9);
  });

  it('should toggle health conditions', () => {
    component.toggleHealthCondition('Diabetes');
    expect(component.formData.healthConditions).toContain('Diabetes');
    component.toggleHealthCondition('Diabetes');
    expect(component.formData.healthConditions).not.toContain('Diabetes');
  });

  it('should get correct BMI category', () => {
    component.bmi = 22;
    expect(component.getBMICategory()).toBe('Normal');
  });

  it('should submit form', () => {
    component.submitForm();
    expect(component.submitted).toBe(true);
  });
});
