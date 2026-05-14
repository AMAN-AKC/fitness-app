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
  revenueMTD = 0;
  selectedFilter = 'ALL';
  filteredLogs: AuditLog[] = [];

  constructor(
    private adminApi: AdminApiService,
    private frontdeskApi: FrontdeskApiService,
  ) {}

  ngOnInit(): void {
    this.loadBranches();
    this.loadAuditLogs();
    this.loadUsers();
    this.loadPlans();
    this.loadMembers();
    this.loadFeatureFlags();
    this.loadRevenue();
  }

  private loadFeatureFlags(): void {
    this.adminApi.getFeatureFlags().subscribe({
      next: (flags) => {
        this.flags = flags.map((f) => ({
          id: String(f.flagId),
          name: f.flagName,
          enabled: f.enabled,
          lastModified: f.updatedAt ? new Date(f.updatedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'N/A',
          by: f.lastModifiedBy || 'System',
        }));
      },
      error: () => {
        this.flags = [];
      },
    });
  }

  private loadRevenue(): void {
    this.adminApi.getRevenueMTD().subscribe({
      next: (rev) => {
        this.revenueMTD = rev;
      },
      error: () => {
        this.revenueMTD = 0;
      },
    });
  }

  private loadUsers(): void {
    this.adminApi.getUsers().subscribe({
      next: (users) => {
        this.staffCount = users.length;
        this.lockedStaffCount = users.filter((u) => u.isActive === false).length;
      },
      error: () => {},
    });
  }

  private loadPlans(): void {
    this.adminApi.getPlans().subscribe({
      next: (plans) => {
        this.totalPlansCount = plans.length;
        this.activePlansCount = plans.filter((p) => p.isActive !== false).length;
      },
      error: () => {},
    });
  }

  private loadMembers(): void {
    this.frontdeskApi.getMembers().subscribe({
      next: (list: MemberDto[]) => {
        this.totalMembers = Array.isArray(list) ? list.length : 0;
        const byBranch = new Map<number, number>();
        (list || []).forEach((m) => {
          const bid = Number((m as any).homeBranchId || (m as any).branchId || 0);
          byBranch.set(bid, (byBranch.get(bid) || 0) + 1);
        });
        this.branches = this.branches.map((b) => ({
          ...b,
          members: byBranch.get(Number(b.id)) || 0,
        }));
      },
      error: () => {},
    });
  }

  private loadAuditLogs(): void {
    this.adminApi.getAuditLogs().subscribe({
      next: (logs) => {
        console.log('Audit logs received:', logs);
        this.auditLogs = (logs || []).map((l) => {
          const rawTime = l.timestamp || (l as any).createdAt;
          return {
            id: String(l.auditId || ''),
            user: l.username || 'System',
            entity: l.entity || (l as any).entityName || 'Unknown',
            action: l.action || 'UNKNOWN',
            time: rawTime ? this.getTimeAgo(rawTime) : 'N/A',
            color: this.getActionColor(l.action),
          };
        });
        this.applyFilter();
      },
      error: (err) => {
        console.error('Audit log fetch error:', err);
        this.auditLogs = [];
      },
    });
  }

  setFilter(filter: string): void {
    this.selectedFilter = filter;
    this.applyFilter();
  }

  private applyFilter(): void {
    const search = this.selectedFilter.toUpperCase();
    if (search === 'ALL') {
      this.filteredLogs = this.auditLogs.slice(0, 6);
    } else if (search === 'SECURITY') {
      this.filteredLogs = this.auditLogs
        .filter((l) => {
          const e = l.entity.toUpperCase();
          const a = l.action.toUpperCase();
          return e.includes('USER') || e.includes('MEMBER') || a.includes('LOGIN') || a.includes('AUTH');
        })
        .slice(0, 6);
    } else if (search === 'BILLING') {
      this.filteredLogs = this.auditLogs
        .filter((l) => {
          const e = l.entity.toUpperCase();
          return e.includes('INVOICE') || e.includes('PAYMENT') || e.includes('PLAN') || e.includes('PROMO') || e.includes('MEMBERSHIP');
        })
        .slice(0, 6);
    }
  }

  private getTimeAgo(timestamp: string): string {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} mins ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${Math.floor(diffHours / 24)} days ago`;
  }

  private getActionColor(action?: string): string {
    const act = (action || '').toUpperCase();
    if (act.includes('CREATE')) return '#16A34A';
    if (act.includes('UPDATE')) return '#2563EB';
    if (act.includes('DELETE')) return '#DC2626';
    if (act.includes('LOCK')) return '#D97706';
    return '#6B7280';
  }

  toggleFlag(id: string): void {
    const flag = this.flags.find((f) => f.id === id);
    if (flag) {
      const newStatus = !flag.enabled;
      this.adminApi.updateFeatureFlag(Number(id), newStatus, 'Admin').subscribe({
        next: (updated) => {
          flag.enabled = updated.enabled;
          flag.lastModified = 'Just now';
          flag.by = 'Admin';
        },
        error: () => {},
      });
    }
  }

  formatCurrency(num: number): string {
    if (num >= 100000) {
      return '₹' + (num / 100000).toFixed(1) + 'L';
    }
    return '₹' + num.toLocaleString('en-IN');
  }

  formatNumber(num: number): string {
    return num.toLocaleString('en-IN');
  }

  onAddBranch(): void {
    console.log('Add Branch clicked');
  }

  private loadBranches(): void {
    this.isLoading = true;
    this.adminApi.getBranches().subscribe({
      next: (branches) => {
        this.branches = branches.map((branch) => this.fromBranchDto(branch));
        this.isLoading = false;
        this.loadMembers();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Unable to load branches.';
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
