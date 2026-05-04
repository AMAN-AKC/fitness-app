import { Component, OnInit } from '@angular/core';

export interface AuditLog {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details: string;
  type: 'create' | 'update' | 'delete' | 'login' | 'export';
}

@Component({
  selector: 'app-audit-log-viewer',
  templateUrl: './audit-log-viewer.component.html',
  styleUrls: ['./audit-log-viewer.component.css'],
})
export class AuditLogViewerComponent implements OnInit {
  logs: AuditLog[] = [];
  filterType = 'all';
  searchText = '';

  constructor() {}

  ngOnInit(): void {
    this.initializeLogs();
  }

  initializeLogs(): void {
    this.logs = [
      {
        id: '1',
        action: 'Member Created',
        user: 'Admin',
        timestamp: 'Today 10:30 AM',
        details: 'New member Rahul Singh added',
        type: 'create',
      },
      {
        id: '2',
        action: 'Membership Renewed',
        user: 'System',
        timestamp: 'Today 09:15 AM',
        details: 'Auto-renewal for 5 members',
        type: 'update',
      },
      {
        id: '3',
        action: 'User Login',
        user: 'Priya Sharma',
        timestamp: 'Today 08:45 AM',
        details: 'Trainer logged in',
        type: 'login',
      },
      {
        id: '4',
        action: 'Data Exported',
        user: 'Manager',
        timestamp: 'Yesterday 03:20 PM',
        details: 'Members list exported (CSV)',
        type: 'export',
      },
      {
        id: '5',
        action: 'Member Deleted',
        user: 'Admin',
        timestamp: 'Yesterday 02:00 PM',
        details: 'Inactive member removed',
        type: 'delete',
      },
    ];
  }

  get filteredLogs(): AuditLog[] {
    return this.logs.filter((log) => {
      const typeMatch =
        this.filterType === 'all' || log.type === this.filterType;
      const searchMatch =
        log.action.toLowerCase().includes(this.searchText.toLowerCase()) ||
        log.user.toLowerCase().includes(this.searchText.toLowerCase());
      return typeMatch && searchMatch;
    });
  }

  getTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      create: '✚',
      update: '✎',
      delete: '✕',
      login: '🔓',
      export: '📥',
    };
    return icons[type] || '•';
  }

  getTypeColor(type: string): string {
    const colors: { [key: string]: string } = {
      create: 'bg-[#F0FDF4] text-[#16A34A]',
      update: 'bg-[#EFF5FF] text-[#2563EB]',
      delete: 'bg-[#FEF2F2] text-[#DC2626]',
      login: 'bg-[#FFFBEB] text-[#D97706]',
      export: 'bg-[#F5F3FF] text-[#7C3AED]',
    };
    return colors[type] || 'bg-[#F8F9FC] text-[#475569]';
  }
}
