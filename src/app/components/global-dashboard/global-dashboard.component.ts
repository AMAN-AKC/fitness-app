import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface NavItem {
  label: string;
  icon: string;
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
  navData: NavGroup[] = [
    {
      label: 'MAIN',
      items: [
        { label: 'Dashboard', icon: 'home', isActive: true },
        { label: 'Members', icon: 'users', isActive: false },
        { label: 'Plans', icon: 'layers', isActive: false },
        { label: 'Branches', icon: 'map-pin', isActive: false },
        { label: 'Promo Codes', icon: 'tag', isActive: false },
      ],
    },
    {
      label: 'SYSTEM',
      items: [
        { label: 'System Config', icon: 'settings', isActive: false },
        { label: 'Audit Log', icon: 'activity', isActive: false },
        { label: 'Staff', icon: 'users', isActive: false },
      ],
    },
  ];

  metricCards = [
    {
      title: 'Total Members',
      value: '1,284',
      change: '+12%',
      prevText: 'vs last month',
      badgeClass: 'badge-green',
    },
    {
      title: 'Active Subscriptions',
      value: '1,102',
      change: '-2%',
      prevText: 'vs last month',
      badgeClass: 'badge-amber',
    },
    {
      title: 'Avg. Attendance',
      value: '3.2 / wk',
      change: 'Steady',
      prevText: 'vs last month',
      badgeClass: 'badge-blue',
    },
    {
      title: 'Revenue',
      value: '$45,230',
      change: '+5.2%',
      prevText: 'vs last month',
      badgeClass: 'badge-green',
    },
  ];

  constructor() {}

  ngOnInit(): void {}

  toggleSidebar(): void {
    this.sidebarExpanded = !this.sidebarExpanded;
  }

  getIconClass(iconName: string): string {
    return `icon-${iconName}`;
  }
}
