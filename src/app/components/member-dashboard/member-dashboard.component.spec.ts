import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MemberDashboardComponent } from './member-dashboard.component';

describe('MemberDashboardComponent', () => {
  let component: MemberDashboardComponent;
  let fixture: ComponentFixture<MemberDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MemberDashboardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MemberDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with alert shown', () => {
    expect(component.showAlert).toBe(true);
  });

  it('should close alert when closeAlert() is called', () => {
    component.showAlert = true;
    component.closeAlert();
    expect(component.showAlert).toBe(false);
  });

  it('should have 3 upcoming classes', () => {
    expect(component.upcomingClasses.length).toBe(3);
  });

  it('should have correct upcoming class names', () => {
    expect(component.upcomingClasses[0].name).toBe('Hatha Yoga Basics');
    expect(component.upcomingClasses[1].name).toBe('Power Lifting 101');
    expect(component.upcomingClasses[2].name).toBe('HIIT Challenge');
  });

  it('should have correct trainer information', () => {
    expect(component.trainerName).toBe('Rahul Kumar');
    expect(component.trainerInitials).toBe('RK');
    expect(component.trainerRating).toBe(4.2);
  });

  it('should have 4 invoices', () => {
    expect(component.invoices.length).toBe(4);
  });

  it('should have correct invoice statuses', () => {
    expect(component.invoices[0].status).toBe('PAID');
    expect(component.invoices[3].status).toBe('PENDING');
  });

  it('should return correct status background color', () => {
    expect(component.getStatusColor('PAID')).toBe('#F0FDF4');
    expect(component.getStatusColor('PENDING')).toBe('#FFFBEB');
    expect(component.getStatusColor('FAILED')).toBe('#FEF2F2');
  });

  it('should return correct status text color', () => {
    expect(component.getStatusTextColor('PAID')).toBe('#14532D');
    expect(component.getStatusTextColor('PENDING')).toBe('#78350F');
    expect(component.getStatusTextColor('FAILED')).toBe('#7F1D1D');
  });

  it('should return correct bar height for chart', () => {
    expect(component.getBarHeight(75)).toBe('75%');
    expect(component.getBarHeight(100)).toBe('100%');
  });

  it('should alternate row colors correctly', () => {
    expect(component.alternateRowColor(0)).toBe('#FFFFFF');
    expect(component.alternateRowColor(1)).toBe('#F8F9FC');
    expect(component.alternateRowColor(2)).toBe('#FFFFFF');
  });

  it('should have correct membership status', () => {
    expect(component.membershipStatus).toBe('ACTIVE');
    expect(component.currentPlan).toBe('Gold Annual');
    expect(component.daysRemaining).toBe(47);
  });

  it('should have correct trainer specialties', () => {
    expect(component.trainerSpecialties.length).toBe(2);
    expect(component.trainerSpecialties[0]).toBe('Strength');
    expect(component.trainerSpecialties[1]).toBe('CrossFit');
  });

  it('should have correct trainer certifications', () => {
    expect(component.trainerCertifications.length).toBe(2);
    expect(component.trainerCertifications[0]).toBe('ACSM Certified');
    expect(component.trainerCertifications[1]).toBe('CrossFit L2');
  });

  it('should have correct sessions remaining', () => {
    expect(component.sessionsRemaining).toBe(3);
  });

  it('should have correct chart data', () => {
    expect(component.chartData.classesCount).toBe(6);
    expect(component.chartData.chartData.length).toBe(4);
  });

  it('should have first two classes cancellable', () => {
    expect(component.upcomingClasses[0].canCancel).toBe(true);
    expect(component.upcomingClasses[1].canCancel).toBe(true);
    expect(component.upcomingClasses[2].canCancel).toBe(false);
  });
});
