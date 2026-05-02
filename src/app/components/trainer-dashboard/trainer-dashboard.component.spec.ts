import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrainerDashboardComponent } from './trainer-dashboard.component';

describe('TrainerDashboardComponent', () => {
  let component: TrainerDashboardComponent;
  let fixture: ComponentFixture<TrainerDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TrainerDashboardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TrainerDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display header title', () => {
    const title = fixture.nativeElement.querySelector('.header-title');
    expect(title.textContent).toContain('Trainer Dashboard');
  });

  it('should display KPI values', () => {
    expect(component.classesThisWeek).toBe(8);
    expect(component.ptSessionsToday).toBe(3);
  });

  it('should initialize alert as open', () => {
    expect(component.subAlertOpen).toBeTruthy();
  });

  it('should close alert when closeSubAlert is called', () => {
    component.closeSubAlert();
    expect(component.subAlertOpen).toBeFalsy();
  });

  it('should toggle class expanded', () => {
    component.toggleClassExpanded(1);
    expect(component.expandedClass).toBe(1);

    component.toggleClassExpanded(1);
    expect(component.expandedClass).toBeNull();
  });

  it('should toggle notes editor', () => {
    component.toggleNotes(1);
    expect(component.activeNotes).toBe(1);

    component.toggleNotes(1);
    expect(component.activeNotes).toBeNull();
  });

  it('should have initial PT requests', () => {
    expect(component.ptRequests.length).toBe(2);
  });

  it('should accept PT request', () => {
    const request = component.ptRequests[0];
    component.handleRequestAction(request.id, 'accepted');
    expect(request.status).toBe('accepted');
  });

  it('should decline PT request', () => {
    const request = component.ptRequests[0];
    component.handleRequestAction(request.id, 'declined');
    expect(request.status).toBe('declined');
  });

  it('should get pending requests count', () => {
    expect(component.getPendingRequests()).toBe(2);

    component.ptRequests[0].status = 'accepted';
    expect(component.getPendingRequests()).toBe(1);
  });

  it('should have completed sessions data', () => {
    expect(component.completedSessions.length).toBe(3);
  });

  it('should get rating stars array', () => {
    const stars = component.getRatingStars(5);
    expect(stars.length).toBe(5);

    const starsNone = component.getRatingStars(null);
    expect(starsNone.length).toBe(0);
  });

  it('should get empty stars array', () => {
    const emptyStars = component.getEmptyStars(3);
    expect(emptyStars.length).toBe(2);

    const emptyStarsNone = component.getEmptyStars(null);
    expect(emptyStarsNone.length).toBe(0);
  });

  it('should save notes and close editor', () => {
    component.activeNotes = 1;
    component.saveNotes(1);
    expect(component.activeNotes).toBeNull();
  });

  it('should cancel notes and close editor', () => {
    component.activeNotes = 1;
    component.cancelNotes();
    expect(component.activeNotes).toBeNull();
  });

  it('should have 7 week days', () => {
    expect(component.weekDays.length).toBe(7);
  });

  it('should have session times', () => {
    expect(component.sessionTimes.length).toBe(3);
    expect(component.sessionTimes).toContain('10:00 AM');
    expect(component.sessionTimes).toContain('2:00 PM');
    expect(component.sessionTimes).toContain('5:00 PM');
  });

  it('should have chart data', () => {
    expect(component.chartData.length).toBe(7);
  });

  it('should display PT request notes', () => {
    const requestWithNote = component.ptRequests.find((r) => r.note);
    expect(requestWithNote?.note).toBeTruthy();
  });

  it('should have completed sessions with ratings', () => {
    const sessionWithRating = component.completedSessions.find((s) => s.rating);
    expect(sessionWithRating?.rating).toBeTruthy();
  });
});
