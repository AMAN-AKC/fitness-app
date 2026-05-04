import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminUserManagementComponent } from './admin-user-management.component';

describe('AdminUserManagementComponent', () => {
  let component: AdminUserManagementComponent;
  let fixture: ComponentFixture<AdminUserManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminUserManagementComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminUserManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with 6 users', () => {
    expect(component.users.length).toBe(6);
  });

  it('should filter users by search query', () => {
    component.searchQuery = 'Amit';
    component.onSearchChange();
    expect(component.filteredUsers.length).toBeGreaterThan(0);
    expect(component.filteredUsers[0].name).toContain('Amit');
  });

  it('should filter users by role', () => {
    component.roleFilter = 'Trainer';
    component.onRoleFilterChange();
    expect(component.filteredUsers.every((u) => u.role === 'Trainer')).toBe(
      true,
    );
  });

  it('should filter users by status', () => {
    component.statusFilter = 'Active';
    component.onStatusFilterChange();
    expect(component.filteredUsers.every((u) => u.status === 'Active')).toBe(
      true,
    );
  });

  it('should get correct initials', () => {
    expect(component.getInitials('Amit Patel')).toBe('AP');
    expect(component.getInitials('John Smith')).toBe('JS');
  });

  it('should toggle lock status for a user', () => {
    const user = component.users[0];
    component.handleAction(user.id, 'lock');
    expect(user.status).toBe('Locked');
  });

  it('should toggle unlock status for a user', () => {
    const user = component.users[3]; // Neha Sharma (locked)
    component.handleAction(user.id, 'unlock');
    expect(user.status).toBe('Active');
  });

  it('should edit user and update drawer state', () => {
    const user = component.users[0];
    component.handleEdit(user);
    expect(component.isDrawerOpen).toBe(true);
    expect(component.editingUser).toBe(user);
  });

  it('should close drawer', () => {
    component.isDrawerOpen = true;
    component.closeDrawer();
    expect(component.isDrawerOpen).toBe(false);
    expect(component.editingUser).toBeNull();
  });

  it('should have role colors for all roles', () => {
    const roles: string[] = [
      'Member',
      'Front-Desk',
      'Trainer',
      'Manager',
      'Admin',
    ];
    roles.forEach((role) => {
      expect(component.roleColors[role as any]).toBeDefined();
    });
  });

  it('should have role descriptions for all roles', () => {
    const roles: string[] = [
      'Member',
      'Front-Desk',
      'Trainer',
      'Manager',
      'Admin',
    ];
    roles.forEach((role) => {
      expect(component.roleDescriptions[role as any]).toBeDefined();
    });
  });
});
