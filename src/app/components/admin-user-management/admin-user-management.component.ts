import { Component, OnInit } from '@angular/core';
import {
  AdminApiService,
  BackendRole,
  SystemUserDto,
} from '../../services/admin-api.service';
import { FrontdeskApiService } from '../../services/frontdesk-api.service';

export type RoleType =
  | 'Member'
  | 'Front-Desk'
  | 'Trainer'
  | 'Manager'
  | 'Admin';
export type StatusType = 'Active' | 'Locked' | 'Deactivated';

export interface User {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  branch: string;
  lastLogin: string;
  status: StatusType;
  lockedDetail?: string;
  memberId?: string;
}

export interface PasswordPolicy {
  minPasswordLength: number;
  requireUppercase: boolean;
  requireNumber: boolean;
  requireSpecialChar: boolean;
  sessionTimeout: string;
  maxFailedAttempts: number;
  lockoutDuration: number;
}

@Component({
  selector: 'app-admin-user-management',
  templateUrl: './admin-user-management.component.html',
  styleUrls: ['./admin-user-management.component.css'],
})
export class AdminUserManagementComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  isLoading = false;
  errorMessage = '';
  searchQuery = '';
  roleFilter: RoleType | 'All' = 'All';
  statusFilter: StatusType | 'All' = 'All';

  editingUser: User | null = null;
  isDrawerOpen = false;
  drawerRole: RoleType = 'Member';
  drawerActive = true;
  drawerMode: 'edit' | 'create' = 'edit';
  drawerPassword = '';
  drawerUsername = '';
  drawerEmail = '';

  // CSV Bulk Upload
  isBulkUploading = false;
  bulkUploadReport: any[] = [];
  showBulkUploadReport = false;

  passwordPolicy: PasswordPolicy = {
    minPasswordLength: 12,
    requireUppercase: true,
    requireNumber: true,
    requireSpecialChar: true,
    sessionTimeout: '60',
    maxFailedAttempts: 5,
    lockoutDuration: 30,
  };

  roleColors: Record<RoleType, string> = {
    Member: 'bg-blue-soft',
    'Front-Desk': 'bg-teal-soft',
    Trainer: 'bg-pink-soft',
    Manager: 'bg-amber-soft',
    Admin: 'bg-admin-dark',
  };

  roleDescriptions: Record<RoleType, string> = {
    Member:
      'Standard app access for gym members. Can book classes, view plans, and manage their profile.',
    'Front-Desk':
      'Access to member check-ins, POS, and basic scheduling. Cannot alter plans or system settings.',
    Trainer:
      'Can view assigned classes, manage personal clients, and view their schedule.',
    Manager:
      'Full access to a specific branch. Can manage staff, view all members, and edit schedules.',
    Admin:
      'Global system access. Can modify plans, system settings, RBAC, and all branches.',
  };

  constructor(
    private adminApi: AdminApiService,
    private frontdeskApi: FrontdeskApiService,
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.adminApi.getUsers().subscribe({
      next: (users) => {
        this.users = users.map((user) => this.fromDto(user));
        this.filterUsers();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage =
          error?.error?.message || 'Unable to load users from the backend.';
        this.isLoading = false;
      },
    });
  }

  filterUsers(): void {
    this.filteredUsers = this.users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesRole =
        this.roleFilter === 'All' || u.role === this.roleFilter;
      const matchesStatus =
        this.statusFilter === 'All' || u.status === this.statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }

  onSearchChange(): void {
    this.filterUsers();
  }

  onRoleFilterChange(): void {
    this.filterUsers();
  }

  onStatusFilterChange(): void {
    this.filterUsers();
  }

  handleEdit(user: User): void {
    this.editingUser = user;
    this.drawerMode = 'edit';
    this.drawerUsername = user.name;
    this.drawerEmail = user.email;
    this.drawerRole = user.role;
    this.drawerActive = user.status === 'Active';
    this.isDrawerOpen = true;
  }

  onCreateStaff(): void {
    this.editingUser = null;
    this.drawerMode = 'create';
    this.drawerUsername = '';
    this.drawerEmail = '';
    this.drawerRole = 'Front-Desk';
    this.drawerActive = true;
    this.drawerPassword = 'Staff@' + Math.floor(1000 + Math.random() * 9000);
    this.isDrawerOpen = true;
  }

  handleAction(
    userId: string,
    action: 'lock' | 'unlock' | 'deactivate' | 'activate',
  ): void {
    const user = this.users.find((u) => u.id === userId);
    if (!user) {
      return;
    }

    if (action === 'lock') {
      user.status = 'Locked';
      user.lockedDetail = 'Manually locked by Admin';
      this.filterUsers();
      return;
    }

    if (action === 'unlock') {
      user.status = 'Active';
      user.lockedDetail = undefined;
      this.filterUsers();
      return;
    }

    if (action === 'deactivate') {
      this.adminApi.deactivateUser(Number(user.id)).subscribe({
        next: () => {
          user.status = 'Deactivated';
          this.filterUsers();
        },
        error: (error) => {
          this.errorMessage =
            error?.error?.message || 'Unable to deactivate user.';
        },
      });
      return;
    }

    const updated = { ...user, status: 'Active' as StatusType };
    this.adminApi.updateUser(Number(user.id), this.toDto(updated)).subscribe({
      next: (savedUser) => {
        Object.assign(user, this.fromDto(savedUser));
        this.filterUsers();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Unable to activate user.';
      },
    });
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  closeDrawer(): void {
    this.isDrawerOpen = false;
    this.editingUser = null;
  }

  saveChanges(): void {
    if (this.drawerMode === 'create') {
      const newUser: SystemUserDto = {
        username: this.drawerUsername,
        email: this.drawerEmail,
        role: this.toBackendRole(this.drawerRole),
        isActive: this.drawerActive,
      };

      this.adminApi.createUser(newUser, this.drawerPassword).subscribe({
        next: (savedUser) => {
          this.users.push(this.fromDto(savedUser));
          this.filterUsers();
          this.closeDrawer();
        },
        error: (error) => {
          this.errorMessage =
            error?.error?.message || 'Unable to create staff account.';
        },
      });
      return;
    }

    if (!this.editingUser) {
      this.closeDrawer();
      return;
    }

    const updatedUser: User = {
      ...this.editingUser,
      name: this.drawerUsername,
      email: this.drawerEmail,
      role: this.drawerRole,
      status: this.drawerActive ? 'Active' : 'Deactivated',
    };

    this.adminApi
      .updateUser(Number(updatedUser.id), this.toDto(updatedUser))
      .subscribe({
        next: (savedUser) => {
          const index = this.users.findIndex(
            (user) => user.id === updatedUser.id,
          );
          if (index !== -1) {
            this.users[index] = this.fromDto(savedUser);
          }
          this.filterUsers();
          this.closeDrawer();
        },
        error: (error) => {
          this.errorMessage =
            error?.error?.message || 'Unable to save user changes.';
        },
      });
  }

  decrementFailedAttempts(): void {
    this.passwordPolicy.maxFailedAttempts = Math.max(
      1,
      this.passwordPolicy.maxFailedAttempts - 1,
    );
  }

  incrementFailedAttempts(): void {
    this.passwordPolicy.maxFailedAttempts = Math.min(
      20,
      this.passwordPolicy.maxFailedAttempts + 1,
    );
  }

  savePasswordPolicy(): void {
    console.log('Password policy saved:', this.passwordPolicy);
  }

  triggerCsvUpload(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (event: Event) => this.onCsvFileSelected(event);
    input.click();
  }

  onCsvFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.isBulkUploading = true;
    this.bulkUploadReport = [];
    this.showBulkUploadReport = false;
    this.errorMessage = '';

    this.frontdeskApi.bulkUploadMembers(file).subscribe({
      next: (report) => {
        this.bulkUploadReport = report;
        this.showBulkUploadReport = true;
        this.isBulkUploading = false;
        // Reload users to reflect newly created members
        this.loadUsers();
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.message || 'Bulk upload failed. Check your CSV format.';
        this.isBulkUploading = false;
      },
    });
  }

  closeBulkReport(): void {
    this.showBulkUploadReport = false;
    this.bulkUploadReport = [];
  }

  private fromDto(user: SystemUserDto): User {
    const role = this.toUiRole(user.role);
    return {
      id: String(user.userId),
      name: user.username,
      email: user.email,
      role,
      branch: user.role === 'ADMIN' ? 'System' : 'Assigned in branch module',
      lastLogin: 'Backend controlled',
      status: user.isActive === false ? 'Deactivated' : 'Active',
      memberId: `${role.slice(0, 3).toUpperCase()}-${user.userId}`,
    };
  }

  private toDto(user: User): SystemUserDto {
    return {
      userId: Number(user.id),
      username: user.name,
      email: user.email,
      role: this.toBackendRole(user.role),
      isActive: user.status === 'Active',
    };
  }

  private toUiRole(role: BackendRole): RoleType {
    const roleMap: Record<BackendRole, RoleType> = {
      MEMBER: 'Member',
      FRONT_DESK: 'Front-Desk',
      TRAINER: 'Trainer',
      MANAGER: 'Manager',
      ADMIN: 'Admin',
    };
    return roleMap[role];
  }

  private toBackendRole(role: RoleType): BackendRole {
    const roleMap: Record<RoleType, BackendRole> = {
      Member: 'MEMBER',
      'Front-Desk': 'FRONT_DESK',
      Trainer: 'TRAINER',
      Manager: 'MANAGER',
      Admin: 'ADMIN',
    };
    return roleMap[role];
  }
}
