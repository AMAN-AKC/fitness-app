import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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

  revenueData: RevenueData[] = [
    { name: 'Nov', value: 310000 },
    { name: 'Dec', value: 340000 },
    { name: 'Jan', value: 380000 },
    { name: 'Feb', value: 410000 },
    { name: 'Mar', value: 395000 },
    { name: 'Apr', value: 428500 },
  ];

  classData: ClassUtilization[] = [
    { id: 1, name: 'Morning Yoga Flow', occupancy: 92, fill: '#16A34A' },
    { id: 2, name: 'HIIT Intensity', occupancy: 88, fill: '#16A34A' },
    { id: 3, name: 'Core Strength', occupancy: 75, fill: '#2563EB' },
    { id: 4, name: 'Zumba Party', occupancy: 70, fill: '#2563EB' },
    { id: 5, name: 'Pilates Basics', occupancy: 55, fill: '#D97706' },
  ];

  dunningMembers: DunningMember[] = [
    {
      id: '1',
      name: 'Rajesh Kumar',
      email: 'rajesh.k@email.com',
      outstandingAmount: 4999,
      daysOverdue: 12,
      retryDate: '15 May',
      status: 'failed',
    },
    {
      id: '2',
      name: 'Priya Singh',
      email: 'priya.s@email.com',
      outstandingAmount: 3500,
      daysOverdue: 8,
      retryDate: '18 May',
      status: 'attempted',
    },
    {
      id: '3',
      name: 'Amit Patel',
      email: 'amit.p@email.com',
      outstandingAmount: 12499,
      daysOverdue: 5,
      retryDate: '20 May',
      status: 'pending',
    },
    {
      id: '4',
      name: 'Neha Sharma',
      email: 'neha.sharma@email.com',
      outstandingAmount: 17202,
      daysOverdue: 3,
      retryDate: '22 May',
      status: 'pending',
    },
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {}

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
