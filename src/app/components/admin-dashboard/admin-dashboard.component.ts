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
  standalone: false
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
    this.loadFeatureFlags();
    this.loadRevenue();
  }

  private loadFeatureFlags(): void {
    this.adminApi.getFeatureFlags().subscribe({
      next: (flags) => {
        if (flags && flags.length > 0) {
          this.flags = flags.map((f) => ({
            id: String(f.flagId),
            name: f.flagName.toUpperCase(),
            enabled: f.enabled,
            lastModified: f.updatedAt ? new Date(f.updatedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }).toUpperCase() : 'N/A',
            by: f.lastModifiedBy || 'ADMIN',
          }));
        } else {
          this.flags = [];
        }
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to load feature flags';
        this.flags = [];
      },
    });
  }



  private loadRevenue(): void {
    this.adminApi.getRevenueMTD().subscribe({
      next: (rev) => {
        this.revenueMTD = rev || 0;
      },
      error: () => {
        this.revenueMTD = 0;
      },
    });
  }

  private loadUsers(): void {
    this.adminApi.getUsers().subscribe({
      next: (users) => {
        this.staffCount = users ? users.length : 0;
        this.lockedStaffCount = users ? users.filter((u) => u.isActive === false).length : 0;
      },
      error: () => {
        this.staffCount = 0;
        this.lockedStaffCount = 0;
      },
    });
  }

  private loadPlans(): void {
    this.adminApi.getPlans().subscribe({
      next: (plans) => {
        this.totalPlansCount = plans ? plans.length : 0;
        this.activePlansCount = plans ? plans.filter((p) => p.isActive !== false).length : 0;
      },
      error: () => {
        this.totalPlansCount = 0;
        this.activePlansCount = 0;
      },
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
      error: () => {
        this.totalMembers = 0;
        this.branches = this.branches.map((b) => ({
          ...b,
          members: 0,
        }));
      },
    });
  }

  private loadClassesForBranches(): void {
    this.frontdeskApi.getClasses().subscribe({
      next: (classes) => {
        const byBranch = new Map<number, number>();
        (classes || []).forEach((c) => {
          if (c.status !== 'CANCELLED') {
            const bid = Number(c.branchId || 0);
            byBranch.set(bid, (byBranch.get(bid) || 0) + 1);
          }
        });
        
        this.branches = this.branches.map((b) => ({
          ...b,
          classes: byBranch.get(Number(b.id)) || 0,
        }));
      },
      error: () => {
        this.branches = this.branches.map((b) => ({ ...b, classes: 0 }));
      }
    });
  }

  private loadAuditLogs(): void {
    this.adminApi.getAuditLogs().subscribe({
      next: (logs) => {
        if (logs && logs.length > 0) {
          this.auditLogs = logs.map((l) => {
            const rawTime = l.timestamp || (l as any).createdAt;
            return {
              id: String(l.auditId || ''),
              user: (l.username || 'SYSTEM').toUpperCase(),
              entity: (l.entity || (l as any).entityName || 'UNKNOWN').toUpperCase(),
              action: (l.action || 'UNKNOWN').toUpperCase(),
              time: rawTime ? this.getTimeAgo(rawTime).toUpperCase() : 'N/A',
              color: this.getActionColor(l.action),
            };
          });
        } else {
          this.auditLogs = [];
        }
        this.applyFilter();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to load audit logs';
        this.auditLogs = [];
        this.applyFilter();
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
    if (act.includes('CREATE')) return '#00D26A';
    if (act.includes('UPDATE')) return '#2563EB';
    if (act.includes('DELETE')) return '#FF3B30';
    if (act.includes('OVERRIDE')) return '#FFB800';
    return '#555';
  }

  toggleFlag(id: string): void {
    const flag = this.flags.find((f) => f.id === id);
    if (flag) {
      const newStatus = !flag.enabled;
      this.adminApi.updateFeatureFlag(Number(id), newStatus, 'ADMIN').subscribe({
        next: (updated) => {
          flag.enabled = updated.enabled;
          flag.lastModified = 'JUST NOW';
          flag.by = 'ADMIN';
        },
        error: () => {
          // Local fallback toggle in case API doesn't exist
          flag.enabled = newStatus;
          flag.lastModified = 'JUST NOW';
          flag.by = 'ADMIN';
        },
      });
    }
  }

  formatCurrency(num: number): string {
    return '₹' + Math.round(num).toLocaleString('en-IN');
  }

  formatNumber(num: number): string {
    return num.toLocaleString('en-IN');
  }

  onAddBranch(): void {
    alert('NAVIGATING TO BRANCH MANAGEMENT CONSOLE TO REGISTER A NEW BRANCH.');
  }

  private loadBranches(): void {
    this.isLoading = true;
    this.adminApi.getBranches().subscribe({
      next: (branches) => {
        if (branches && branches.length > 0) {
          this.branches = branches.map((branch) => this.fromBranchDto(branch));
        } else {
          this.branches = [];
        }
        this.isLoading = false;
        this.loadMembers();
        this.loadClassesForBranches();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to load branches';
        this.branches = [];
        this.isLoading = false;
        this.loadMembers();
        this.loadClassesForBranches();
      },
    });
  }



  private fromBranchDto(branch: BranchDto): Branch {
    return {
      id: String(branch.branchId),
      name: branch.branchName.toUpperCase(),
      city: this.extractCity(branch.address).toUpperCase(),
      members: branch.activeMembersCount || 0,
      classes: 0,
      active: branch.isActive !== false,
    };
  }

  private extractCity(address: string): string {
    if (!address) return 'BANGALORE';
    const parts = address.split(',').map((part) => part.trim());
    return parts.length > 1 ? parts[parts.length - 2] : address;
  }
}
