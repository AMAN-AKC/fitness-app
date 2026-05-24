import { Component, OnInit } from '@angular/core';
import {
  AdminApiService,
  BackendRole,
  SystemUserDto,
} from '../../services/admin-api.service';
import { FrontdeskApiService } from '../../services/frontdesk-api.service';
import { PasswordPolicyService, PasswordPolicy } from '../../services/password-policy.service';
import { ToastService } from '../../services/toast.service';

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

// PasswordPolicy type is imported from PasswordPolicyService

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
  drawerBranch = 'ALL';
  drawerMode: 'edit' | 'create' = 'edit';
  drawerPassword = '';
  drawerUsername = '';
  drawerEmail = '';

  // Validation error state
  drawerErrors: { username?: string; email?: string; password?: string } = {};
  showPasswordStrength = false;

  branches: { id: number, name: string }[] = [];

  // CSV Bulk Upload
  isBulkUploading = false;
  bulkUploadReport: any[] = [];
  showBulkUploadReport = false;

  // Loaded from PasswordPolicyService — always reflects what admin last saved
  passwordPolicy!: PasswordPolicy;

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
    private policyService: PasswordPolicyService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    // Sync local copy from service (service loads from localStorage on first call)
    this.passwordPolicy = { ...this.policyService.policy };
    // Stay in sync with any future updates (e.g. another tab changes the policy)
    this.policyService.policy$.subscribe(p => this.passwordPolicy = { ...p });
    this.loadUsers();
    this.loadBranches();
  }

  loadBranches(): void {
    this.adminApi.getBranches().subscribe({
      next: (branches) => {
        this.branches = (branches || []).map(b => ({
          id: b.branchId || 0,
          name: b.branchName.toUpperCase()
        }));
      },
      error: (error) => {
        console.error('Unable to load branches', error);
      }
    });
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
    this.drawerBranch = user.branch === 'System HQ' || user.branch === 'Unassigned' ? 'ALL' : user.branch;
    this.drawerActive = user.status !== 'Deactivated';
    this.isDrawerOpen = true;
  }

  onCreateStaff(): void {
    this.editingUser = null;
    this.drawerMode = 'create';
    this.drawerUsername = '';
    this.drawerEmail = '';
    this.drawerRole = 'Front-Desk';
    this.drawerBranch = 'ALL';
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
      this.adminApi.lockUser(Number(user.id)).subscribe({
        next: () => {
          user.status = 'Locked';
          user.lockedDetail = 'Manually locked by Admin';
          this.filterUsers();
        },
        error: (error) => {
          this.errorMessage = error?.error?.message || 'Unable to lock user.';
        }
      });
      return;
    }

    if (action === 'unlock') {
      this.adminApi.unlockUser(Number(user.id)).subscribe({
        next: () => {
          user.status = 'Active';
          user.lockedDetail = undefined;
          this.filterUsers();
        },
        error: (error) => {
          this.errorMessage = error?.error?.message || 'Unable to unlock user.';
        }
      });
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
    this.drawerErrors = {};
    this.showPasswordStrength = false;
  }

  // ── Validation Helpers ─────────────────────────────────────────────────

  validateUsername(): boolean {
    if (!this.drawerUsername || !this.drawerUsername.trim()) {
      this.drawerErrors.username = 'USERNAME / FULL NAME IS REQUIRED.';
      return false;
    }
    if (this.drawerUsername.trim().length < 3) {
      this.drawerErrors.username = 'NAME MUST BE AT LEAST 3 CHARACTERS.';
      return false;
    }
    this.drawerErrors.username = undefined;
    return true;
  }

  validateEmail(): boolean {
    if (!this.drawerEmail || !this.drawerEmail.trim()) {
      this.drawerErrors.email = 'EMAIL ADDRESS IS REQUIRED.';
      return false;
    }
    const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(this.drawerEmail.trim())) {
      this.drawerErrors.email = 'ENTER A VALID EMAIL ADDRESS (E.G. USER@DOMAIN.COM).';
      return false;
    }
    this.drawerErrors.email = undefined;
    return true;
  }

  validatePassword(): boolean {
    if (this.drawerMode !== 'create') return true;
    const p = this.drawerPassword;
    if (!p) {
      this.drawerErrors.password = 'PASSWORD IS REQUIRED.';
      return false;
    }
    if (p.length < this.passwordPolicy.minPasswordLength) {
      this.drawerErrors.password = `PASSWORD MUST BE AT LEAST ${this.passwordPolicy.minPasswordLength} CHARACTERS.`;
      return false;
    }
    if (this.passwordPolicy.requireUppercase && !/[A-Z]/.test(p)) {
      this.drawerErrors.password = 'PASSWORD MUST CONTAIN AT LEAST ONE UPPERCASE LETTER.';
      return false;
    }
    if (this.passwordPolicy.requireNumber && !/[0-9]/.test(p)) {
      this.drawerErrors.password = 'PASSWORD MUST CONTAIN AT LEAST ONE NUMBER.';
      return false;
    }
    if (this.passwordPolicy.requireSpecialChar && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p)) {
      this.drawerErrors.password = 'PASSWORD MUST CONTAIN AT LEAST ONE SPECIAL CHARACTER (!@#$%^&* etc.)';
      return false;
    }
    this.drawerErrors.password = undefined;
    return true;
  }

  get passwordStrengthScore(): number {
    const p = this.drawerPassword;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p)) score++;
    return score;
  }

  get passwordStrengthLabel(): string {
    const s = this.passwordStrengthScore;
    if (s <= 1) return 'WEAK';
    if (s <= 3) return 'FAIR';
    if (s === 4) return 'STRONG';
    return 'VERY STRONG';
  }

  get passwordStrengthColor(): string {
    const s = this.passwordStrengthScore;
    if (s <= 1) return '#FF3B30';
    if (s <= 3) return '#FFB800';
    if (s === 4) return '#2563EB';
    return '#00D26A';
  }

  // Password policy hint helpers (no regex in templates — Angular parser rejects them)
  get pwHintLength(): boolean {
    return this.drawerPassword.length >= this.passwordPolicy.minPasswordLength;
  }
  get pwHintUpper(): boolean {
    return /[A-Z]/.test(this.drawerPassword);
  }
  get pwHintNumber(): boolean {
    return /[0-9]/.test(this.drawerPassword);
  }
  get pwHintSpecial(): boolean {
    return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(this.drawerPassword);
  }

  // ── Save Changes ────────────────────────────────────────────────────────


  saveChanges(): void {
    // Run all validations first
    const usernameOk = this.validateUsername();
    const emailOk = this.validateEmail();
    const passwordOk = this.validatePassword();
    if (!usernameOk || !emailOk || !passwordOk) {
      return;
    }

    if (this.drawerMode === 'create') {
      const newUser: SystemUserDto = {
        username: this.drawerUsername.trim(),
        email: this.drawerEmail.trim(),
        role: this.toBackendRole(this.drawerRole),
        isActive: this.drawerActive,
        branchName: this.drawerBranch === 'ALL' ? undefined : this.drawerBranch,
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
      status: this.drawerActive ? (this.editingUser.status === 'Locked' ? 'Locked' : 'Active') : 'Deactivated',
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
    this.policyService.savePolicy({ ...this.passwordPolicy }).subscribe({
      next: (saved) => {
        this.toastService.success(
          `PASSWORD POLICY SAVED — MIN ${saved.minPasswordLength} CHARS, ` +
          `SESSION TIMEOUT ${saved.sessionTimeoutMin} MIN, ` +
          `MAX ATTEMPTS ${saved.maxFailedAttempts}.`
        );
      },
      error: (err) => {
        this.toastService.error(
          err?.error?.message || 'FAILED TO SAVE PASSWORD POLICY TO SERVER.'
        );
      }
    });
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
    
    let userStatus: StatusType = 'Active';
    if (user.isActive === false) {
      userStatus = 'Deactivated';
    } else if (user.isLocked) {
      userStatus = 'Locked';
    }

    return {
      id: String(user.userId),
      name: user.username,
      email: user.email,
      role,
      branch: user.branchName || (user.role === 'ADMIN' ? 'System HQ' : 'Unassigned'),
      lastLogin: user.lastLogin ? this.formatDate(user.lastLogin) : 'NEVER',
      status: userStatus,
      memberId: `${role.slice(0, 3).toUpperCase()}-${user.userId}`,
    };
  }

  private formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private toDto(user: User): SystemUserDto {
    return {
      userId: Number(user.id),
      username: user.name,
      email: user.email,
      role: this.toBackendRole(user.role),
      isActive: user.status === 'Active' || user.status === 'Locked',
      isLocked: user.status === 'Locked'
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
