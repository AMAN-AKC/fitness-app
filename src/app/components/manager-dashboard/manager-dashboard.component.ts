import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ManagerApiService } from '../../services/manager-api.service';

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
  status: 'pending' | 'attempted' | 'failed';
}

export interface RevenueData {
  name: string;
  value: number;
}

@Component({
  selector: 'app-manager-dashboard',
  templateUrl: './manager-dashboard.component.html',
  styleUrls: ['./manager-dashboard.component.css'],
})
export class ManagerDashboardComponent implements OnInit {
  chartMetric = 'Revenue';
  chartMetrics = ['Revenue', 'New Joins', 'Churn'];

  stats: any = null;
  isLoading = true;

  revenueData: RevenueData[] = [];
  classData: ClassUtilization[] = [];
  dunningMembers: DunningMember[] = [];

  constructor(
    private authService: AuthService,
    private managerApi: ManagerApiService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.managerApi.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.revenueData = data.revenueAnalytics.map(p => ({ name: p.month, value: p.revenue }));
        this.classData = data.topClasses.map(c => ({ 
          id: c.classId, 
          name: c.name, 
          occupancy: Math.round(c.occupancy), 
          fill: c.fill 
        }));
        this.dunningMembers = data.dunningQueue.map(d => ({
          id: d.invoiceId.toString(),
          name: d.name,
          email: d.email,
          outstandingAmount: d.outstandingAmount,
          daysOverdue: d.daysOverdue,
          retryDate: d.retryDate,
          status: d.status as any
        }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading dashboard stats', err);
        this.isLoading = false;
      }
    });
  }

  setChartMetric(metric: string): void {
    this.chartMetric = metric;
  }

  exportReport(): void {
    console.log('Export report clicked');
  }

  retryPayment(member: DunningMember): void {
    console.log('Retry payment for', member.name);
    member.status = 'attempted';
  }

  viewFullReport(): void {
    console.log('View full class report');
  }

  formatCurrency(value: number): string {
    if (value >= 100000) {
      return '₹' + (value / 100000).toFixed(2) + 'L';
    }
    return '₹' + value.toLocaleString('en-IN');
  }

  formatRevenue(value: number): string {
    return '₹' + (value / 1000).toFixed(0) + 'k';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'bg-yellow-light text-orange border-orange';
      case 'attempted':
        return 'bg-blue-light text-blue border-blue';
      case 'failed':
        return 'bg-red-light text-red border-red';
      default:
        return '';
    }
  }
}
