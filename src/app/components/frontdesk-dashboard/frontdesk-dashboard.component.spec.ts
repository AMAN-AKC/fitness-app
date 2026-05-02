import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FrontdeskDashboardComponent } from './frontdesk-dashboard.component';

describe('FrontdeskDashboardComponent', () => {
  let component: FrontdeskDashboardComponent;
  let fixture: ComponentFixture<FrontdeskDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FrontdeskDashboardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FrontdeskDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display header title', () => {
    const titleElement = fixture.nativeElement.querySelector('.header-title');
    expect(titleElement.textContent).toContain('Front Desk');
  });

  it('should display KPI cards with initial values', () => {
    const kpiValues = fixture.nativeElement.querySelectorAll('.kpi-value');
    expect(kpiValues[0].textContent).toContain('247'); // Check-Ins Today
    expect(kpiValues[1].textContent).toContain('14'); // New Members
    expect(kpiValues[2].textContent).toContain('7'); // Pending Consents
    expect(kpiValues[3].textContent).toContain('12'); // Expiring Plans
  });

  it('should search for members and display result', () => {
    component.searchValue = 'test';
    component.handleSearch(new Event('submit'));
    fixture.detectChanges();

    expect(component.memberFound).toBeTruthy();
    expect(component.memberFound?.name).toBe('Priya Singh');
  });

  it('should show blocked member when searching with exp', () => {
    component.searchValue = 'exp';
    component.handleSearch(new Event('submit'));
    fixture.detectChanges();

    expect(component.memberFound).toBeTruthy();
    expect(component.memberFound?.status).toBe('blocked');
  });

  it('should clear search and member found', () => {
    component.searchValue = 'test';
    component.memberFound = {
      id: 'TEST',
      name: 'Test',
      plan: 'Test',
      branch: 'Test',
      avatar: 'T',
      status: 'ok',
    };

    component.clearSearch();
    fixture.detectChanges();

    expect(component.searchValue).toBe('');
    expect(component.memberFound).toBeNull();
  });

  it('should toggle class expansion', () => {
    component.expandedClass = null;
    component.toggleClassExpanded(1);

    expect(component.expandedClass).toBe(1);

    component.toggleClassExpanded(1);

    expect(component.expandedClass).toBeNull();
  });

  it('should display recent check-ins', () => {
    const checkInItems =
      fixture.nativeElement.querySelectorAll('.checkin-item');
    expect(checkInItems.length).toBe(5);
  });

  it('should display todays classes', () => {
    const classItems = fixture.nativeElement.querySelectorAll('.class-item');
    expect(classItems.length).toBe(3);
  });

  it('should update date time on initialization', () => {
    expect(component.currentDateTime).toBeTruthy();
    expect(component.currentDateTime).toMatch(/\d+:\d+/); // Should contain time
  });

  it('should mark member status as present', () => {
    const member = component.classMembers[0];
    component.markMemberStatus(member, 'present');

    expect(member.status).toBe('present');
  });

  it('should mark all members as present', () => {
    component.markAllPresent();

    component.classMembers.forEach((member) => {
      expect(member.status).toBe('present');
    });
  });
});
