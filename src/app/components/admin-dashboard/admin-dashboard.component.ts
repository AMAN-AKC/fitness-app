import { Component, OnInit } from '@angular/core';
import { AdminApiService, BranchDto } from '../../services/admin-api.service';

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
  isLoading = false;
  errorMessage = '';

  constructor(private adminApi: AdminApiService) {}

  ngOnInit(): void {
    this.initializeData();
    this.loadBranches();
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
