import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClassBookingComponent } from './class-booking.component';

describe('ClassBookingComponent', () => {
  let component: ClassBookingComponent;
  let fixture: ComponentFixture<ClassBookingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClassBookingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ClassBookingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with classes', () => {
    expect(component.classes.length).toBe(5);
  });

  it('should filter classes by level', () => {
    component.filterLevel = 'Beginner';
    component.filterClasses();
    expect(component.filteredClasses.every((c) => c.level === 'Beginner')).toBe(
      true,
    );
  });

  it('should book class', () => {
    const cls = component.classes[0];
    const initialBooked = cls.booked;
    component.selectedClass = cls;
    component.bookClass();
    expect(cls.booked).toBe(initialBooked + 1);
  });
});
