import { Component, OnInit } from '@angular/core';
import { AdminApiService, AuditLogDto } from '../../services/admin-api.service';

@Component({
  selector: 'app-audit-log-viewer',
  templateUrl: './audit-log-viewer.component.html',
  styleUrls: ['./audit-log-viewer.component.css'],
  standalone: false
})
export class AuditLogViewerComponent implements OnInit {
  logs: AuditLogDto[] = [];
  filteredLogs: AuditLogDto[] = [];
  isLoading = false;
  errorMessage = '';

  // Filter bindings
  performedBySearch = '';
  selectedEntity = 'ALL';
  selectedAction = 'ALL';
  dateFrom = '';
  dateTo = '';

  // Detail drawer
  selectedRecord: AuditLogDto | null = null;
  isDrawerOpen = false;
  parsedOldValue: any = null;
  parsedNewValue: any = null;

  constructor(private adminApi: AdminApiService) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.adminApi.getAuditLogs().subscribe({
      next: (data) => {
        // Enforce role assignment for visual styling based on username or user ID mock patterns
        this.logs = data.map(l => {
          let role = 'ADMIN';
          const name = (l.username || '').toUpperCase();
          if (name.includes('MEMBER') || name.includes('RAHUL') || name.includes('PRIYA')) {
            role = 'MEMBER';
          } else if (name.includes('FRONT') || name.includes('RECEPTION')) {
            role = 'FRONT_DESK';
          } else if (name.includes('TRAINER') || name.includes('COACH')) {
            role = 'TRAINER';
          } else if (name.includes('MANAGER')) {
            role = 'MANAGER';
          }
          return {
            ...l,
            performedByRole: role
          };
        });
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'FAILED TO LOAD AUDIT LOGS FROM SERVER.';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredLogs = this.logs.filter(l => {
      // Performed by search
      if (this.performedBySearch) {
        const query = this.performedBySearch.toLowerCase();
        const matchesUser = (l.username || '').toLowerCase().includes(query);
        const matchesRole = (l.performedByRole || '').toLowerCase().includes(query);
        if (!matchesUser && !matchesRole) return false;
      }

      // Entity filter
      if (this.selectedEntity !== 'ALL') {
        const entity = (l.entityName || '').toUpperCase();
        if (entity !== this.selectedEntity) return false;
      }

      // Action filter
      if (this.selectedAction !== 'ALL') {
        const action = (l.action || '').toUpperCase();
        if (action !== this.selectedAction) return false;
      }

      // Date range filter
      if (l.timestamp) {
        const logDate = new Date(l.timestamp);
        if (this.dateFrom) {
          const fromDate = new Date(this.dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          if (logDate < fromDate) return false;
        }
        if (this.dateTo) {
          const toDate = new Date(this.dateTo);
          toDate.setHours(23, 59, 59, 999);
          if (logDate > toDate) return false;
        }
      }

      return true;
    });
  }

  resetFilters(): void {
    this.performedBySearch = '';
    this.selectedEntity = 'ALL';
    this.selectedAction = 'ALL';
    this.dateFrom = '';
    this.dateTo = '';
    this.applyFilters();
  }

  openDetail(record: AuditLogDto): void {
    this.selectedRecord = record;
    this.isDrawerOpen = true;

    // Parse JSON values for comparison diff
    this.parsedOldValue = this.parseJsonString(record.oldValue);
    this.parsedNewValue = this.parseJsonString(record.newValue);
  }

  closeDetail(): void {
    this.isDrawerOpen = false;
    this.selectedRecord = null;
    this.parsedOldValue = null;
    this.parsedNewValue = null;
  }

  private parseJsonString(val: string | undefined): any {
    if (!val) return null;
    try {
      // Try parsing if it is a valid JSON string
      const parsed = JSON.parse(val);
      if (typeof parsed === 'object') return parsed;
      return { value: parsed };
    } catch {
      return { value: val };
    }
  }

  getDiffKeys(): string[] {
    const keys = new Set<string>();
    if (this.parsedOldValue && typeof this.parsedOldValue === 'object') {
      Object.keys(this.parsedOldValue).forEach(k => keys.add(k));
    }
    if (this.parsedNewValue && typeof this.parsedNewValue === 'object') {
      Object.keys(this.parsedNewValue).forEach(k => keys.add(k));
    }
    return Array.from(keys);
  }

  exportCsv(): void {
    if (this.filteredLogs.length === 0) {
      alert('NO LOGS TO EXPORT.');
      return;
    }

    const headers = ['TIMESTAMP', 'PERFORMED BY', 'ROLE', 'ENTITY', 'ENTITY ID', 'ACTION', 'BEFORE', 'AFTER'];
    const rows = this.filteredLogs.map(l => [
      l.timestamp || '',
      l.username || '',
      l.performedByRole || '',
      l.entityName || '',
      l.entityId || '',
      l.action || '',
      l.oldValue || '',
      l.newValue || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  getRoleColor(role: string): string {
    switch (role) {
      case 'ADMIN': return '#FF3B30';
      case 'MANAGER': return '#FFB800';
      case 'TRAINER': return '#7C3AED';
      case 'FRONT_DESK': return '#2563EB';
      default: return '#00D26A';
    }
  }

  getFormattedDateRange(): string {
    if (this.dateFrom && this.dateTo) {
      return `${this.dateFrom} – ${this.dateTo}`;
    }
    if (this.dateFrom) {
      return `SINCE ${this.dateFrom}`;
    }
    if (this.dateTo) {
      return `UNTIL ${this.dateTo}`;
    }
    return 'ALL TIME';
  }
}
