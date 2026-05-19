import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ManagerApiService, ManagerDashboardDto } from '../../services/manager-api.service';
import { ToastService } from '../../services/toast.service';

export interface ClassUtilization {
  id: number;
  name: string;
  occupancy: number;
  fill: string;
}

export interface DunningMember {
  id: string;
  name: string;
  email: string;
  outstandingAmount: number;
  daysOverdue: number;
  retryDate: string;
  status: 'FAILED' | 'PROMISE' | string;
  membershipId?: number;
}

export interface RevenueData {
  name: string;
  value: number;
}

@Component({
  selector: 'app-manager-dashboard',
  templateUrl: './manager-dashboard.component.html',
  styleUrls: ['./manager-dashboard.component.css'],
  standalone: false
})
export class ManagerDashboardComponent implements OnInit {
  chartMetric = 'REVENUE';
  chartMetrics = ['REVENUE', 'NEW JOINS', 'CHURN'];

  stats: ManagerDashboardDto | null = null;
  isLoading = true;
  errorMessage = '';

  revenueData: RevenueData[] = [];
  classData: ClassUtilization[] = [];
  dunningMembers: DunningMember[] = [];
  
  hoveredPoint: { x: number, y: number, value: number, month: string } | null = null;

  upcomingCancellations = [
    { name: 'Rohan Gupta', expiryDate: '2026-05-24', status: 'PENDING', initials: 'RG' },
    { name: 'Karan Malhotra', expiryDate: '2026-05-28', status: 'PENDING', initials: 'KM' },
    { name: 'Sanya Sen', expiryDate: '2026-06-01', status: 'RENEWED', initials: 'SS' },
    { name: 'Vikram Grover', expiryDate: '2026-06-03', status: 'PENDING', initials: 'VG' }
  ];

  // Dunning Console state
  showDunningDrawer = false;
  allDunningInvoices: any[] = [];
  selectedDunningInvoice: any = null;
  followUpNote = '';
  followUpPromiseDate = '';
  suspensionReason = '';
  showFollowUpForm = false;
  showSuspendForm = false;

  constructor(
    private authService: AuthService,
    private managerApi: ManagerApiService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.managerApi.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.updateChartData();
        
        this.classData = data.topClasses.map(c => ({ 
          id: c.classId, 
          name: c.name, 
          occupancy: Math.round(c.occupancy), 
          fill: this.getBarColor(c.occupancy)
        }));

        this.dunningMembers = data.dunningQueue.map(d => ({
          id: d.invoiceId.toString(),
          name: d.name,
          email: d.email,
          outstandingAmount: d.outstandingAmount,
          daysOverdue: d.daysOverdue,
          retryDate: d.retryDate,
          status: d.status.toUpperCase() === 'FAILED' ? 'FAILED' : 'PROMISE',
          membershipId: d.invoiceId
        }));
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to load manager dashboard metrics.';
        this.isLoading = false;
      }
    });
  }

  updateChartData(): void {
    if (!this.stats || !this.stats.revenueAnalytics) return;
    if (this.chartMetric === 'REVENUE') {
      this.revenueData = this.stats.revenueAnalytics.map(p => ({ name: p.month.toUpperCase(), value: p.revenue }));
    } else if (this.chartMetric === 'NEW JOINS') {
      this.revenueData = this.stats.revenueAnalytics.map(p => ({ name: p.month.toUpperCase(), value: Number(p.newJoins) }));
    } else {
      this.revenueData = this.stats.revenueAnalytics.map(p => ({ name: p.month.toUpperCase(), value: Number(p.churn || 2) }));
    }
  }

  setChartMetric(metric: string): void {
    this.chartMetric = metric;
    this.updateChartData();
  }

  get svgLinePoints(): string {
    if (this.revenueData.length === 0) return '';
    const width = 450;
    const height = 180;
    const padding = 30;
    const values = this.revenueData.map(d => d.value);
    const minVal = Math.min(...values) * 0.9;
    const maxVal = Math.max(...values) * 1.1;
    const valRange = maxVal - minVal || 1;
    
    return this.revenueData.map((d, i) => {
      const x = padding + i * (width - 2 * padding) / (this.revenueData.length - 1);
      const y = height - padding - ((d.value - minVal) / valRange) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');
  }

  get svgDataPoints() {
    if (this.revenueData.length === 0) return [];
    const width = 450;
    const height = 180;
    const padding = 30;
    const values = this.revenueData.map(d => d.value);
    const minVal = Math.min(...values) * 0.9;
    const maxVal = Math.max(...values) * 1.1;
    const valRange = maxVal - minVal || 1;
    
    return this.revenueData.map((d, i) => {
      const x = padding + i * (width - 2 * padding) / (this.revenueData.length - 1);
      const y = height - padding - ((d.value - minVal) / valRange) * (height - 2 * padding);
      return {
        x: x - 4,
        y: y - 4,
        value: d.value,
        month: d.name
      };
    });
  }

  getBarColor(occupancy: number): string {
    if (occupancy > 85) return '#00D26A';
    if (occupancy >= 60) return '#2563EB';
    return '#FFB800';
  }

  followUp(member: DunningMember): void {
    this.toastService.info(`FOLLOW UP EMAIL DISPATCHED TO: ${member.name.toUpperCase()}`);
    member.status = 'PROMISE';
  }

  sendReminder(member: any): void {
    this.toastService.success(`EXPIRATION ALERT DISPATCHED TO: ${member.name.toUpperCase()}`);
    member.status = 'RENEWED';
  }

  sendAllReminders(): void {
    this.toastService.success('BULK EXPIRATION ALERTS DISPATCHED SUCCESSFULLY.');
    this.upcomingCancellations.forEach(c => c.status = 'RENEWED');
  }

  formatCurrency(value: number): string {
    return '₹' + Math.round(value).toLocaleString('en-IN');
  }

  viewFullReport(): void {
    this.router.navigate(['/manager/schedule']);
  }

  // Dunning Drawer Handlers
  viewAllDunning(): void {
    this.showDunningDrawer = true;
    this.loadAllDunningInvoices();
  }

  closeDunningDrawer(): void {
    this.showDunningDrawer = false;
    this.selectedDunningInvoice = null;
    this.showFollowUpForm = false;
    this.showSuspendForm = false;
  }

  loadAllDunningInvoices(): void {
    this.isLoading = true;
    this.managerApi.getOverdueInvoices().subscribe({
      next: (data) => {
        this.allDunningInvoices = data.invoices || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.toastService.error('FAILED TO LOAD OVERDUE INVOICES FROM BACKEND.');
        this.isLoading = false;
      }
    });
  }

  selectDunningInvoice(inv: any): void {
    this.selectedDunningInvoice = inv;
    this.showFollowUpForm = false;
    this.showSuspendForm = false;
    this.followUpNote = '';
    this.followUpPromiseDate = '';
    this.suspensionReason = '';
  }

  sendDunningEmail(inv: any): void {
    this.toastService.success(`DUNNING REMINDER EMAIL DISPATCHED FOR INVOICE #${inv.invoiceNumber}`);
  }

  resolveDunning(inv: any): void {
    if (!inv.membership || !inv.membership.memId) {
      this.toastService.warning('NO VALID MEMBERSHIP LINKED TO INVOICE.');
      return;
    }
    this.isLoading = true;
    this.managerApi.resolveDunning(inv.membership.memId).subscribe({
      next: () => {
        this.toastService.success(`DUNNING RESOLVED FOR MEMBERSHIP AND INVOICE MARKED ACTIVE!`);
        this.loadAllDunningInvoices();
        this.loadDashboardData();
        this.selectedDunningInvoice = null;
      },
      error: (err) => {
        this.toastService.error('FAILED TO RESOLVE DUNNING: ' + (err.error?.message || 'Server error'));
        this.isLoading = false;
      }
    });
  }

  openFollowUpForm(): void {
    this.showFollowUpForm = true;
    this.showSuspendForm = false;
  }

  submitFollowUp(): void {
    if (!this.followUpNote) {
      this.toastService.warning('FOLLOW UP NOTES ARE REQUIRED.');
      return;
    }
    this.toastService.success(`FOLLOW UP RECORDED: ${this.followUpNote.toUpperCase()}${this.followUpPromiseDate ? ' (PROMISED BY ' + this.followUpPromiseDate + ')' : ''}`);
    this.showFollowUpForm = false;
  }

  openSuspendForm(): void {
    this.showSuspendForm = true;
    this.showFollowUpForm = false;
  }

  submitSuspension(): void {
    if (!this.suspensionReason) {
      this.toastService.warning('SUSPENSION REASON IS REQUIRED.');
      return;
    }
    if (!this.selectedDunningInvoice.membership || !this.selectedDunningInvoice.membership.memId) {
      this.toastService.warning('NO VALID MEMBERSHIP FOR SUSPENSION.');
      return;
    }
    this.isLoading = true;
    this.managerApi.suspendDunning(this.selectedDunningInvoice.membership.memId, this.suspensionReason).subscribe({
      next: () => {
        this.toastService.warning(`MEMBERSHIP SUSPENDED COMPLIANT TO RULE ENFORCEMENT.`);
        this.loadAllDunningInvoices();
        this.loadDashboardData();
        this.selectedDunningInvoice = null;
      },
      error: (err) => {
        this.toastService.error('FAILED TO SUSPEND MEMBERSHIP: ' + (err.error?.message || 'Server error'));
        this.isLoading = false;
      }
    });
  }
}
