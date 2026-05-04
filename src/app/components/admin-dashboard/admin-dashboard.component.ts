import { Component, OnInit } from '@angular/core';

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

  constructor() {}

  ngOnInit(): void {
    this.initializeData();
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

    this.branches = [
      {
        id: '1',
        name: 'Downtown Main',
        city: 'Mumbai',
        members: 1250,
        classes: 24,
        active: true,
      },
      {
        id: '2',
        name: 'Westside Flex',
        city: 'Mumbai',
        members: 840,
        classes: 18,
        active: true,
      },
      {
        id: '3',
        name: 'Koramangala Elite',
        city: 'Bangalore',
        members: 1020,
        classes: 20,
        active: true,
      },
      {
        id: '4',
        name: 'Pune East',
        city: 'Pune',
        members: 450,
        classes: 12,
        active: false,
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
}
