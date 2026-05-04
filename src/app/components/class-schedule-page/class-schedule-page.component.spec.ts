import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClassSchedulePageComponent } from './class-schedule-page.component';

describe('ClassSchedulePageComponent', () => {
  let component: ClassSchedulePageComponent;
  let fixture: ComponentFixture<ClassSchedulePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClassSchedulePageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ClassSchedulePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with 4 classes', () => {
    expect(component.classes.length).toBe(4);
  });

  it('should calculate class height', () => {
    expect(component.getClassHeight(60)).toBe(80);
    expect(component.getClassHeight(45)).toBe(60);
  });

  it('should get classes for hour', () => {
    const sixAmClasses = component.getClassesForTime(6);
    expect(sixAmClasses.length).toBeGreaterThan(0);
  });

  it('should book class', () => {
    const cls = component.classes[0];
    const initialBooked = cls.booked;
    component.bookClass(cls);
    expect(cls.booked).toBe(initialBooked + 1);
  });
});
