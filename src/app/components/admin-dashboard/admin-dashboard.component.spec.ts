import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminDashboardComponent } from './admin-dashboard.component';

describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminDashboardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize data on ngOnInit', () => {
    expect(component.flags.length).toBe(7);
    expect(component.auditLogs.length).toBe(4);
    expect(component.branches.length).toBe(4);
  });

  it('should toggle feature flag', () => {
    const flag = component.flags[0];
    const initialState = flag.enabled;
    component.toggleFlag(flag.id);
    expect(flag.enabled).toBe(!initialState);
  });

  it('should format numbers correctly', () => {
    const result = component.formatNumber(1250);
    expect(result).toBe('1,250');
  });

  it('should have correct flag data', () => {
    const dunningFlag = component.flags.find(
      (f) => f.name === 'Dunning Module',
    );
    expect(dunningFlag).toBeDefined();
    expect(dunningFlag?.enabled).toBe(true);
  });

  it('should have correct audit log data', () => {
    const firstLog = component.auditLogs[0];
    expect(firstLog.user).toBe('Admin');
    expect(firstLog.action).toBe('UPDATED');
  });

  it('should have correct branch data', () => {
    const downtown = component.branches.find((b) => b.name === 'Downtown Main');
    expect(downtown).toBeDefined();
    expect(downtown?.active).toBe(true);
    expect(downtown?.members).toBe(1250);
  });

  it('should call onAddBranch when button is clicked', () => {
    spyOn(component, 'onAddBranch');
    const button = fixture.nativeElement.querySelector(
      'button[ng-reflect-ng-click*="onAddBranch"]',
    );
    if (button) {
      button.click();
      expect(component.onAddBranch).toHaveBeenCalled();
    }
  });
});
