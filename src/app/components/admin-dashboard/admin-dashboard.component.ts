import { Component, OnInit } from '@angular/core';
import {
  AdminApiService,
  BranchDto,
  AuditLogDto,
} from '../../services/admin-api.service';
import {
  FrontdeskApiService,
  MemberDto,
} from '../../services/frontdesk-api.service';

export interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  lastModified: string;
  by: string;
}

export interface AuditLog {
  id: string;
  user: string;
  entity: string;
  action: string;
  time: string;
  color: string;
}

export interface Branch {
  id: string;
  name: string;
  city: string;
  members: number;
  classes: number;
  active: boolean;
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
})
export class AdminDashboardComponent implements OnInit {
  flags: FeatureFlag[] = [];
  auditLogs: AuditLog[] = [];
  branches: Branch[] = [];
  staffCount = 0;
  lockedStaffCount = 0;
  activePlansCount = 0;
  totalPlansCount = 0;
  totalMembers = 0;
  Math = Math;
  isLoading = false;
  errorMessage = '';

  constructor(
    private adminApi: AdminApiService,
    private frontdeskApi: FrontdeskApiService,
  ) {}

  ngOnInit(): void {
    this.initializeData();
    this.loadBranches();
    this.loadAuditLogs();
    this.loadUsers();
    this.loadPlans();
    this.loadMembers();
  }

  initializeData(): void {
    this.flags = [
      {
        id: '1',
        name: 'Dunning Module',
        enabled: true,
        lastModified: 'Apr 10',
        by: 'Admin',
      },
      {
        id: '2',
        name: 'PT Sessions',
        enabled: true,
        lastModified: 'Apr 08',
        by: 'Admin',
      },
      {
        id: '3',
        name: 'Biometric Access',
        enabled: false,
        lastModified: 'Mar 22',
        by: 'System',
      },
      {
        id: '4',
        name: 'CSV Import/Export',
        enabled: true,
        lastModified: 'Apr 12',
        by: 'Admin',
      },
      {
        id: '5',
        name: 'Guest Pass',
        enabled: false,
        lastModified: 'Mar 15',
        by: 'Admin',
      },
      {
        id: '6',
        name: 'Promo Codes',
        enabled: true,
        lastModified: 'Apr 01',
        by: 'Admin',
      },
      {
        id: '7',
        name: 'Health Form Requirement',
        enabled: true,
        lastModified: 'Jan 10',
        by: 'System',
      },
    ];

    this.auditLogs = [
      {
        id: '1',
        user: 'Admin',
        entity: 'System Settings',
        action: 'UPDATED',
        time: '10 mins ago',
        color: '#2563EB',
      },
      {
        id: '2',
        user: 'JD Manager',
        entity: 'Branch B',
        action: 'CREATED',
        time: '2 hours ago',
        color: '#16A34A',
      },
      {
        id: '3',
        user: 'System',
        entity: 'User Auth',
        action: 'LOCKED',
        time: '5 hours ago',
        color: '#DC2626',
      },
      {
        id: '4',
        user: 'Sarah Staff',
        entity: 'Billing Config',
        action: 'DELETED',
        time: '1 day ago',
        color: '#D97706',
      },
    ];
  }

  private loadUsers(): void {
    this.adminApi.getUsers().subscribe({
      next: (users) => {
        this.staffCount = users.length;
        this.lockedStaffCount = users.filter(
          (u) => u.isActive === false,
        ).length;
      },
      error: () => {
        // keep defaults on error
      },
    });
  }

  private loadPlans(): void {
    this.adminApi.getPlans().subscribe({
      next: (plans) => {
        this.totalPlansCount = plans.length;
        this.activePlansCount = plans.filter(
          (p) => p.isActive !== false,
        ).length;
      },
      error: () => {
        // keep defaults on error
      },
    });
  }

  private loadMembers(): void {
    this.frontdeskApi.getMembers().subscribe({
      next: (list: MemberDto[]) => {
        this.totalMembers = Array.isArray(list) ? list.length : 0;
        const byBranch = new Map<number, number>();
        (list || []).forEach((m) => {
          const bid = Number(
            (m as any).homeBranchId || (m as any).branchId || 0,
          );
          byBranch.set(bid, (byBranch.get(bid) || 0) + 1);
        });
        this.branches = this.branches.map((b) => ({
          ...b,
          members: byBranch.get(Number(b.id)) || b.members || 0,
        }));
      },
      error: () => {
        // keep defaults on error
      },
    });
  }

  private loadAuditLogs(): void {
    this.adminApi.getAuditLogs().subscribe({
      next: (logs) => {
        this.auditLogs = logs.map((l) => ({
          id: String(l.id || ''),
          user: l.username || 'System',
          entity: l.entity || 'Unknown',
          action: l.action || 'UNKNOWN',
          time: l.timestamp ? new Date(l.timestamp).toLocaleString() : 'N/A',
          color: '#6B7280',
        }));
      },
      error: () => {
        // keep existing mocked audit logs when backend call fails
      },
    });
  }

  toggleFlag(id: string): void {
    const flag = this.flags.find((f) => f.id === id);
    if (flag) {
      flag.enabled = !flag.enabled;
    }
  }

  formatNumber(num: number): string {
    return num.toLocaleString('en-IN');
  }

  onAddBranch(): void {
    console.log('Add Branch clicked');
    // Implement add branch functionality
  }

  private loadBranches(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.adminApi.getBranches().subscribe({
      next: (branches) => {
        this.branches = branches.map((branch) => this.fromBranchDto(branch));
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage =
          error?.error?.message || 'Unable to load branches from the backend.';
        this.isLoading = false;
      },
    });
  }

  private fromBranchDto(branch: BranchDto): Branch {
    return {
      id: String(branch.branchId),
      name: branch.branchName,
      city: this.extractCity(branch.address),
      members: 0,
      classes: 0,
      active: branch.isActive !== false,
    };
  }

  private extractCity(address: string): string {
    const parts = address.split(',').map((part) => part.trim());
    return parts.length > 1 ? parts[parts.length - 2] : '';
  }
}
