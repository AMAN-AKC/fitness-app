import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  AdminApiService,
  BranchDto,
} from '../../services/admin-api.service';
import { FrontdeskApiService, MemberDto } from '../../services/frontdesk-api.service';
import { PasswordPolicyService, PasswordPolicy } from '../../services/password-policy.service';
import { ToastService } from '../../services/toast.service';

export interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  lastModified: string;
  by: string;
}

export interface ConfigAuditLog {
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

export interface MemberTransfer {
  memberId: number;
  targetBranchId: number;
  reason: string;
}

export interface BranchInventory {
  itemName: string;
  quantity: number;
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule],
})
export class AdminDashboardComponent implements OnInit {
  activeTab = 'SECURITY';
  tabs = ['GENERAL', 'SECURITY', 'BILLING', 'FEATURE_FLAGS', 'BRANDING', 'POLICIES', 'BRANCHES', 'AUDIT_LOGS'];

  flags: FeatureFlag[] = [];
  auditLogs: ConfigAuditLog[] = [];
  branches: Branch[] = [];
  
  systemConfigs: { [key: string]: string } = {
    'session.timeout': '30',
    'password.minLength': '8',
    'billing.currency': 'INR',
    'billing.dateFormat': 'DD/MM/YYYY',
    'branding.primaryColor': '#2563EB',
    'branding.logoUrl': '',
    'policy.cancellationWindowHours': '2'
  };

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Stats
  totalPlansCount = 0;
  activePlansCount = 0;
  totalMembers = 0;

  // Audit log filter
  selectedFilter = 'ALL';
  filteredLogs: any[] = [];

  transferData: MemberTransfer = { memberId: 0, targetBranchId: 0, reason: '' };
  newInventory: BranchInventory = { itemName: '', quantity: 1 };
  selectedBranchId: string = '';
  branchInventory: BranchInventory[] = [];

  // Password Policy
  passwordPolicy!: PasswordPolicy;

  constructor(
    private adminApi: AdminApiService, 
    private frontdeskApi: FrontdeskApiService,
    private policyService: PasswordPolicyService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    // Sync local copy from service
    this.passwordPolicy = { ...this.policyService.policy };
    this.policyService.policy$.subscribe(p => this.passwordPolicy = { ...p });

    this.loadBranches();
    this.loadSystemConfigs();
    this.loadFeatureFlags();
    this.loadAuditLogs();
  }

  switchTab(tab: string) {
    this.activeTab = tab;
    this.errorMessage = '';
    this.successMessage = '';
  }

  private loadSystemConfigs(): void {
    this.adminApi.getSystemConfigs().subscribe({
      next: (configs) => {
        configs.forEach((c: any) => {
          this.systemConfigs[c.configKey] = c.configValue;
        });
        this.applyBranding();
      },
      error: (err) => console.error(err)
    });
  }

  saveConfigs(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    this.adminApi.updateSystemConfigs(this.systemConfigs).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'SYSTEM CONFIGURATION UPDATED SUCESSFULLY.';
        this.applyBranding();
        this.loadAuditLogs();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'FAILED TO UPDATE CONFIGURATION.';
      }
    });
  }

  onLogoUpload(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.systemConfigs['branding.logoUrl'] = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  applyBranding(): void {
    if (this.systemConfigs['branding.primaryColor']) {
      document.documentElement.style.setProperty('--primary-color', this.systemConfigs['branding.primaryColor']);
      document.documentElement.style.setProperty('--blue', this.systemConfigs['branding.primaryColor']);
    }
  }

  private loadFeatureFlags(): void {
    this.adminApi.getFeatureFlags().subscribe({
      next: (flags) => {
        if (flags && flags.length > 0) {
          this.flags = flags.map((f: any) => {
            let parsedDate = 'N/A';
            if (f.updatedAt) {
              let dateObj;
              if (Array.isArray(f.updatedAt)) {
                // Handle Spring Boot LocalDateTime array [YYYY, MM, DD, HH, mm, ss]
                dateObj = new Date(f.updatedAt[0], f.updatedAt[1] - 1, f.updatedAt[2], f.updatedAt[3] || 0, f.updatedAt[4] || 0, f.updatedAt[5] || 0);
              } else {
                dateObj = new Date(f.updatedAt);
              }
              if (!isNaN(dateObj.getTime())) {
                parsedDate = dateObj.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
              }
            }
            return {
              id: String(f.flagId),
              name: f.flagName.toUpperCase(),
              enabled: f.enabled,
              lastModified: parsedDate,
              by: f.lastModifiedBy || 'ADMIN',
            };
          });
        } else {
          this.flags = [];
        }
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

  toggleFlag(name: string, currentEnabled: boolean): void {
    const flag = this.flags.find((f) => f.name === name.toUpperCase());
    if (flag) {
      const newStatus = !currentEnabled;
      this.adminApi.updateFeatureFlag(name, newStatus).subscribe({
        next: () => {
          flag.enabled = newStatus;
          flag.lastModified = 'JUST NOW';
          flag.by = 'ADMIN';
        },
        error: () => {
          // Local fallback toggle
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

  // Multi-Branch Transfers & Inventory integration
  transferMember(): void {
    if (!this.transferData.memberId || !this.transferData.targetBranchId) {
      this.errorMessage = 'PLEASE PROVIDE MEMBER ID AND TARGET BRANCH.';
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    this.adminApi.transferMember(this.transferData.memberId, this.transferData.targetBranchId, this.transferData.reason || 'Requested by Admin').subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = `MEMBER ${this.transferData.memberId} TRANSFERRED SUCCESSFULLY.`;
        this.transferData = { memberId: 0, targetBranchId: 0, reason: '' };
        this.loadMembers(); // Refresh branch member counts
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'FAILED TO TRANSFER MEMBER.';
      }
    });
  }

  loadInventory(): void {
    if (!this.selectedBranchId) {
      this.branchInventory = [];
      return;
    }
    this.adminApi.getBranchInventory(this.selectedBranchId).subscribe({
      next: (inventory) => {
        this.branchInventory = inventory || [];
      },
      error: () => {
        this.branchInventory = [];
      }
    });
  }

  addInventory(): void {
    if (!this.selectedBranchId) {
      this.errorMessage = 'PLEASE SELECT A BRANCH FIRST.';
      return;
    }
    if (!this.newInventory.itemName || this.newInventory.quantity <= 0) {
      this.errorMessage = 'PLEASE PROVIDE A VALID ITEM NAME AND QUANTITY.';
      return;
    }
    
    this.isLoading = true;
    const inventoryPayload = {
      itemName: this.newInventory.itemName,
      quantity: this.newInventory.quantity,
      branch: { branchId: Number(this.selectedBranchId) }
    };

    this.adminApi.addBranchInventory(this.selectedBranchId, inventoryPayload).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = `ADDED ${this.newInventory.quantity} ${this.newInventory.itemName.toUpperCase()} TO INVENTORY.`;
        this.newInventory = { itemName: '', quantity: 1 };
        this.loadInventory(); // Refresh the list from the DB
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'FAILED TO ADD INVENTORY.';
      }
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
}
