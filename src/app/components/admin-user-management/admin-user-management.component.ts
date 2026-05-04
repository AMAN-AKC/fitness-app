import { Component, OnInit } from '@angular/core';

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
  searchQuery = '';
  roleFilter: RoleType | 'All' = 'All';
  statusFilter: StatusType | 'All' = 'All';

  editingUser: User | null = null;
  isDrawerOpen = false;
  drawerRole: RoleType = 'Member';
  drawerActive = true;

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
    Member: 'bg-[#EFF5FF] text-[#2563EB] border-[#2563EB]/20',
    'Front-Desk': 'bg-[#F0FDFA] text-[#0D9488] border-[#0D9488]/20',
    Trainer: 'bg-[#FAF5FF] text-[#9333EA] border-[#9333EA]/20',
    Manager: 'bg-[#FFFBEB] text-[#D97706] border-[#D97706]/20',
    Admin: 'bg-[#FEF2F2] text-[#DC2626] border-[#DC2626]/20',
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

  constructor() {}

  ngOnInit(): void {
    this.initializeUsers();
    this.filterUsers();
  }

  initializeUsers(): void {
    this.users = [
      {
        id: '1',
        name: 'Amit Patel',
        email: 'amit.p@example.com',
        role: 'Member',
        branch: 'Downtown Main',
        lastLogin: '2 hours ago',
        status: 'Active',
        memberId: 'MEM-29384',
      },
      {
        id: '2',
        name: 'Priya Singh',
        email: 'priya.s@fitclub.com',
        role: 'Trainer',
        branch: 'Westside Flex',
        lastLogin: '1 day ago',
        status: 'Active',
        memberId: 'TRN-1029',
      },
      {
        id: '3',
        name: 'Rajesh Kumar',
        email: 'rajesh.k@fitclub.com',
        role: 'Manager',
        branch: 'All Branches',
        lastLogin: '15 mins ago',
        status: 'Active',
        memberId: 'MGR-0042',
      },
      {
        id: '4',
        name: 'Neha Sharma',
        email: 'neha.sharma@example.com',
        role: 'Member',
        branch: 'Pune East',
        lastLogin: '5 days ago',
        status: 'Locked',
        lockedDetail: 'Locked until 14:30 — 5 failed attempts',
        memberId: 'MEM-11928',
      },
      {
        id: '5',
        name: 'Sunil Dutt',
        email: 'sunil.d@fitclub.com',
        role: 'Front-Desk',
        branch: 'Westside Flex',
        lastLogin: '1 month ago',
        status: 'Deactivated',
        memberId: 'STF-8832',
      },
      {
        id: '6',
        name: 'Admin Super',
        email: 'admin@fitclub.com',
        role: 'Admin',
        branch: 'System',
        lastLogin: 'Just now',
        status: 'Active',
        memberId: 'ADM-0001',
      },
    ];
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
    this.drawerRole = user.role;
    this.drawerActive = user.status === 'Active';
    this.isDrawerOpen = true;
  }

  handleAction(
    userId: string,
    action: 'lock' | 'unlock' | 'deactivate' | 'activate',
  ): void {
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      if (action === 'lock') {
        user.status = 'Locked';
        user.lockedDetail = 'Manually locked by Admin';
      } else if (action === 'unlock') {
        user.status = 'Active';
        user.lockedDetail = undefined;
      } else if (action === 'deactivate') {
        user.status = 'Deactivated';
      } else if (action === 'activate') {
        user.status = 'Active';
      }
      this.filterUsers();
    }
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
    if (this.editingUser) {
      this.editingUser.role = this.drawerRole;
      this.editingUser.status = this.drawerActive ? 'Active' : 'Deactivated';
      this.filterUsers();
    }
    this.closeDrawer();
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
}
