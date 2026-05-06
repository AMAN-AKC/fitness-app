import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AdminApiService } from '../../services/admin-api.service';
import { AuthService } from '../../services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  isActive?: boolean;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

@Component({
  selector: 'app-global-dashboard',
  templateUrl: './global-dashboard.component.html',
  styleUrls: ['./global-dashboard.component.css'],
  standalone: false,
})
export class GlobalDashboardComponent implements OnInit {
  sidebarExpanded = true;
  isLoading = false;
  errorMessage = '';
  navData: NavGroup[] = [
    {
      label: 'MAIN',
      items: [
        {
          label: 'Dashboard',
          icon: 'home',
          route: '/global-dashboard',
          isActive: true,
        },
        {
          label: 'Users',
          icon: 'users',
          route: '/admin-users',
          isActive: false,
        },
        {
          label: 'Plans',
          icon: 'layers',
          route: '/admin-plans',
          isActive: false,
        },
        {
          label: 'Branches',
          icon: 'map-pin',
          route: '/admin-branches',
          isActive: false,
        },
      ],
    },
    {
      label: 'SYSTEM',
      items: [
        {
          label: 'System Config',
          icon: 'settings',
          route: '/admin-dashboard',
          isActive: false,
        },
        {
          label: 'Staff',
          icon: 'users',
          route: '/admin-users',
          isActive: false,
        },
      ],
    },
  ];

  metricCards = [
    {
      title: 'Total Members',
      value: '0',
      change: 'Live',
      prevText: 'from backend',
      badgeClass: 'badge-green',
    },
    {
      title: 'System Users',
      value: '0',
      change: 'Live',
      prevText: 'from backend',
      badgeClass: 'badge-amber',
    },
    {
      title: 'Active Plans',
      value: '0',
      change: 'Live',
      prevText: 'from backend',
      badgeClass: 'badge-blue',
    },
    {
      title: 'Admin APIs',
      value: '3',
      change: 'OK',
      prevText: 'users, branches, plans',
      badgeClass: 'badge-green',
    },
  ];

  constructor(
    private adminApi: AdminApiService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadAdminSummary();
  }

  toggleSidebar(): void {
    this.sidebarExpanded = !this.sidebarExpanded;
  }

  navigateTo(item: NavItem): void {
    this.router.navigate([item.route]);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getIconClass(iconName: string): string {
    return `icon-${iconName}`;
  }

  private loadAdminSummary(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      users: this.adminApi.getUsers(),
      branches: this.adminApi.getBranches(),
      plans: this.adminApi.getPlans(),
    }).subscribe({
      next: ({ users, branches, plans }) => {
        this.metricCards = [
          {
            title: 'Active Branches',
            value: this.formatNumber(branches.length),
            change: 'Live',
            prevText: 'from backend',
            badgeClass: 'badge-green',
          },
          {
            title: 'System Users',
            value: this.formatNumber(users.length),
            change: 'Live',
            prevText: 'from backend',
            badgeClass: 'badge-amber',
          },
          {
            title: 'Active Plans',
            value: this.formatNumber(plans.length),
            change: 'Live',
            prevText: 'from backend',
            badgeClass: 'badge-blue',
          },
          {
            title: 'Admin APIs',
            value: '3',
            change: 'OK',
            prevText: 'users, branches, plans',
            badgeClass: 'badge-green',
          },
        ];
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage =
          error?.error?.message || 'Unable to load admin dashboard summary.';
        this.isLoading = false;
      },
    });
  }

  private formatNumber(value: number): string {
    return value.toLocaleString('en-IN');
  }
}
