import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService, Toast } from '../../services/toast.service';

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
  userRole: string = '';
  userName: string = 'User';
  navData: NavGroup[] = [];
  toasts: Toast[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    const session = this.authService.getCurrentSession();
    if (session) {
      this.userRole = session.role.toLowerCase();
      this.userName = session.fullName || session.username;
      this.initNavData();
    }

    this.toastService.toasts$.subscribe((toast) => {
      this.toasts.push(toast);
      if (toast.duration && toast.duration > 0) {
        setTimeout(() => {
          this.dismissToast(toast.id);
        }, toast.duration);
      }
    });
  }

  dismissToast(id: string): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }

  private initNavData(): void {
    const adminNav: NavGroup[] = [
      {
        label: 'ADMINISTRATION',
        items: [
          { label: 'Dashboard', icon: '🏠', route: '/admin/dashboard' },
          { label: 'Users', icon: '👥', route: '/admin/users' },
          { label: 'Plans', icon: '📋', route: '/admin/plans' },
          { label: 'Branches', icon: '📍', route: '/admin/branches' },
          { label: 'Audit Logs', icon: '📜', route: '/admin/audit-logs' },
          { label: 'Bulk Data', icon: '📦', route: '/admin/import-export' }
        ],
      },
    ];

    const frontdeskNav: NavGroup[] = [
      {
        label: 'FRONT DESK',
        items: [
          { label: 'Check-In', icon: '⚡', route: '/frontdesk/dashboard' },
          { label: 'Registration', icon: '📝', route: '/frontdesk/registration' },
          { label: 'Notifications', icon: '🔔', route: '/frontdesk/notifications' },
        ],
      },
    ];

    const managerNav: NavGroup[] = [
      {
        label: 'MANAGEMENT',
        items: [
          { label: 'Branch Stats', icon: '📊', route: '/manager/dashboard' },
          { label: 'Class Schedule', icon: '📅', route: '/manager/schedule' },
          { label: 'Audit Logs', icon: '📜', route: '/manager/audit-logs' },
          { label: 'Bulk Data', icon: '📦', route: '/manager/import-export' },
          { label: 'Notifications', icon: '🔔', route: '/manager/notifications' },
        ],
      },
    ];

    const trainerNav: NavGroup[] = [
      {
        label: 'TRAINING',
        items: [
          { label: 'My Classes', icon: '🏋️', route: '/trainer/dashboard' },
          { label: 'Notifications', icon: '🔔', route: '/trainer/notifications' },
        ],
      },
    ];

    const memberNav: NavGroup[] = [
      {
        label: 'MEMBER PORTAL',
        items: [
          { label: 'Home', icon: '🏠', route: '/member/dashboard' },
          { label: 'Book Classes', icon: '📅', route: '/member/class-booking' },
          { label: 'Find Trainer', icon: '🏋️', route: '/member/trainers' },
          { label: 'Buy Membership', icon: '💳', route: '/member/plans' },
          { label: 'Health & Consent', icon: '📝', route: '/member/health-forms' },
          { label: 'Notifications', icon: '🔔', route: '/member/notifications' },
        ],
      },
    ];

    if (this.userRole === 'admin') {
      this.navData = adminNav;
    } else if (this.userRole === 'front_desk' || this.userRole === 'frontdesk') {
      this.navData = frontdeskNav;
    } else if (this.userRole === 'manager') {
      this.navData = managerNav;
    } else if (this.userRole === 'trainer') {
      this.navData = trainerNav;
    } else if (this.userRole === 'member') {
      this.navData = memberNav;
    }
  }

  toggleSidebar(): void {
    this.sidebarExpanded = !this.sidebarExpanded;
  }

  navigateTo(item: NavItem): void {
    this.router.navigate([item.route]);
  }

  isRouteActive(route: string): boolean {
    return this.router.url === route;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  onNotificationsClick(): void {
    const rolePrefix = this.userRole === 'front_desk' || this.userRole === 'frontdesk' ? 'frontdesk' : this.userRole;
    this.router.navigate([`/${rolePrefix}/notifications`]);
  }

  onProfileClick(): void {
    console.log('Profile clicked');
    // In a real app, this would toggle a dropdown or navigate to /profile
  }

  getCurrentPageTitle(): string {
    const url = this.router.url;
    if (url.includes('/admin/dashboard')) return 'Admin Dashboard';
    if (url.includes('/admin/users')) return 'User Management';
    if (url.includes('/admin/plans')) return 'Plan Catalog';
    if (url.includes('/admin/branches')) return 'Branch Management';
    if (url.includes('/frontdesk/dashboard')) return 'Check-In';
    if (url.includes('/frontdesk/registration')) return 'Member Registration';
    if (url.includes('/manager/dashboard')) return 'Branch Statistics';
    if (url.includes('/manager/schedule')) return 'Class Schedule';
    if (url.includes('/trainer/dashboard')) return 'My Classes';
    if (url.includes('/member/dashboard')) return 'Member Home';
    if (url.includes('/member/class-booking')) return 'Book Classes';
    if (url.includes('/member/trainers')) return 'Find Trainer';
    if (url.includes('/member/health-forms')) return 'Health & Consent';
    if (url.includes('/member/plans')) return 'Membership Plans';
    if (url.includes('/member/checkout')) return 'Billing & Checkout';
    if (url.includes('notifications')) return 'Notifications Center';
    if (url.includes('audit-logs')) return 'System Audit Logs';
    if (url.includes('import-export')) return 'Bulk Data Operations';
    return 'Dashboard';
  }

  getIconClass(iconName: string): string {
    return `icon-${iconName}`;
  }
}
