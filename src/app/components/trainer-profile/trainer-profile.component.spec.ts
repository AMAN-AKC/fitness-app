import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrainerProfileComponent } from './trainer-profile.component';

describe('TrainerProfileComponent', () => {
  let component: TrainerProfileComponent;
  let fixture: ComponentFixture<TrainerProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TrainerProfileComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TrainerProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with 3 trainers', () => {
    expect(component.trainers.length).toBe(3);
  });

  it('should select trainer', () => {
    const trainer = component.trainers[1];
    component.selectTrainer(trainer);
    expect(component.selectedTrainer).toEqual(trainer);
  });

  it('should open and close booking drawer', () => {
    component.openBookingDrawer();
    expect(component.isBookingDrawerOpen).toBe(true);
    component.closeBookingDrawer();
    expect(component.isBookingDrawerOpen).toBe(false);
  });

  it('should book session', () => {
    component.selectedTrainer = component.trainers[0];
    component.selectedDate = '2025-05-20';
    component.selectedSlot = '06:00 AM';
    component.bookSession();
    expect(component.isBookingDrawerOpen).toBe(false);
  });
});
