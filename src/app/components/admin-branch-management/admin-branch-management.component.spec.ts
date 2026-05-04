import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminBranchManagementComponent } from './admin-branch-management.component';

describe('AdminBranchManagementComponent', () => {
  let component: AdminBranchManagementComponent;
  let fixture: ComponentFixture<AdminBranchManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminBranchManagementComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminBranchManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with 3 branches', () => {
    expect(component.branches.length).toBe(3);
  });

  it('should select first branch by default', () => {
    expect(component.selectedBranchId).toBe(component.branches[0].id);
  });

  it('should filter branches by search query', () => {
    component.searchQuery = 'Mumbai';
    component.onSearchChange();
    expect(component.filteredBranches.length).toBeGreaterThan(0);
    expect(component.filteredBranches[0].city).toContain('Mumbai');
  });

  it('should select branch when clicked', () => {
    const branch = component.branches[1];
    component.selectBranch(branch.id);
    expect(component.selectedBranchId).toBe(branch.id);
  });

  it('should get selected branch correctly', () => {
    component.selectedBranchId = component.branches[0].id;
    expect(component.selectedBranch).toBe(component.branches[0]);
  });

  it('should format numbers correctly', () => {
    const result = component.formatNumber(1250);
    expect(result).toBe('1,250');
  });

  it('should unassign staff from branch', () => {
    const branch = component.selectedBranch;
    const staffCount = branch.staff.length;
    if (staffCount > 0) {
      component.unassignStaff(branch.staff[0].id);
      expect(branch.staff.length).toBe(staffCount - 1);
    }
  });

  it('should toggle room status', () => {
    const branch = component.selectedBranch;
    if (branch.rooms.length > 0) {
      const room = branch.rooms[0];
      const initialStatus = room.active;
      component.toggleRoomStatus(room.id);
      expect(room.active).toBe(!initialStatus);
    }
  });

  it('should toggle plan visibility', () => {
    const branch = component.selectedBranch;
    if (branch.plans.length > 0) {
      const plan = branch.plans[0];
      const initialVisibility = plan.visible;
      component.togglePlanVisibility(plan.id);
      expect(plan.visible).toBe(!initialVisibility);
    }
  });

  it('should open and close assign staff modal', () => {
    expect(component.isAssignStaffOpen).toBe(false);
    component.onAssignStaff();
    expect(component.isAssignStaffOpen).toBe(true);
    component.closeAssignStaffModal();
    expect(component.isAssignStaffOpen).toBe(false);
  });

  it('should open and close transfer member modal', () => {
    expect(component.isTransferMemberOpen).toBe(false);
    component.onTransferMember();
    expect(component.isTransferMemberOpen).toBe(true);
    component.closeTransferMemberModal();
    expect(component.isTransferMemberOpen).toBe(false);
  });

  it('should have all tabs available', () => {
    expect(component.tabs.includes('Details')).toBe(true);
    expect(component.tabs.includes('Staff')).toBe(true);
    expect(component.tabs.includes('Members')).toBe(true);
    expect(component.tabs.includes('Classes')).toBe(true);
    expect(component.tabs.includes('Settings')).toBe(true);
  });

  it('should start with Details tab active', () => {
    expect(component.activeTab).toBe('Details');
  });
});
