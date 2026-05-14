import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
  userRole: string = '';
  userName: string = 'User';
  navData: NavGroup[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const session = this.authService.getCurrentSession();
    if (session) {
      this.userRole = session.role.toLowerCase();
      this.userName = session.fullName || session.username;
      this.initNavData();
    }
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
        ],
      },
    ];

    const frontdeskNav: NavGroup[] = [
      {
        label: 'FRONT DESK',
        items: [
          { label: 'Check-In', icon: '⚡', route: '/frontdesk/dashboard' },
          { label: 'Registration', icon: '📝', route: '/frontdesk/registration' },
        ],
      },
    ];

    const managerNav: NavGroup[] = [
      {
        label: 'MANAGEMENT',
        items: [
          { label: 'Branch Stats', icon: '📊', route: '/manager/dashboard' },
        ],
      },
    ];

    const trainerNav: NavGroup[] = [
      {
        label: 'TRAINING',
        items: [
          { label: 'My Classes', icon: '🏋️', route: '/trainer/dashboard' },
        ],
      },
    ];

    const memberNav: NavGroup[] = [
      {
        label: 'MEMBER PORTAL',
        items: [
          { label: 'Home', icon: '🏠', route: '/member/dashboard' },
          { label: 'Buy Membership', icon: '💳', route: '/member/plans' },
          { label: 'Health & Consent', icon: '📝', route: '/member/health-forms' },
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
    this.router.navigate(['/admin/notifications']);
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
    if (url.includes('/trainer/dashboard')) return 'My Classes';
    if (url.includes('/member/dashboard')) return 'Member Home';
    if (url.includes('/member/health-forms')) return 'Health & Consent';
    if (url.includes('/member/plans')) return 'Membership Plans';
    if (url.includes('/member/checkout')) return 'Billing & Checkout';
    return 'Dashboard';
  }

  getIconClass(iconName: string): string {
    return `icon-${iconName}`;
  }
}
