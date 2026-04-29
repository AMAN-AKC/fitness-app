import { Component, OnInit, HostListener } from '@angular/core';
import { NavigationService } from '../../services/navigation.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css'],
})
export class LandingComponent implements OnInit {
  scrolled = false;

  features = [
    {
      icon: '👥',
      title: 'Member Management',
      description:
        'Onboard members, assign plans, manage health consent forms, and track the full member lifecycle across branches.',
    },
    {
      icon: '📅',
      title: 'Class Scheduling',
      description:
        'Create recurring schedules, manage bookings and waitlists, auto-notify members on changes, handle substitutions.',
    },
    {
      icon: '💳',
      title: 'Billing & Invoicing',
      description:
        'Automated dunning flows, promo codes, multi-method payments, GST-compliant PDF invoices emailed on every transaction.',
    },
    {
      icon: '✓',
      title: 'Attendance Tracking',
      description:
        'QR-based check-in, manual override, real-time logs per class, and per-member attendance analytics exportable to CSV.',
    },
    {
      icon: '💪',
      title: 'Trainer Management',
      description:
        'Assign trainers to classes and PT sessions, track certifications, manage availability calendars, and collect session ratings.',
    },
    {
      icon: '📊',
      title: 'Analytics Dashboard',
      description:
        'Revenue trends, churn predictions, class utilization heatmaps, and branch comparison reports — all in real time.',
    },
  ];

  roles = [
    {
      name: 'Member',
      emoji: '👤',
      description: 'Book classes & track progress',
    },
    {
      name: 'Front Desk',
      emoji: '🎫',
      description: 'Quick check-ins & registration',
    },
    {
      name: 'Trainer',
      emoji: '🏋️',
      description: 'Manage sessions & schedules',
    },
    { name: 'Manager', emoji: '📊', description: 'Analytics & operations' },
    { name: 'Admin', emoji: '⚙️', description: 'Full system control' },
  ];

  metrics = [
    { value: '500+', label: 'Clubs Onboarded' },
    { value: '1.2M', label: 'Members Managed' },
    { value: '99.9%', label: 'Uptime SLA' },
    { value: '★ 4.9', label: 'Rating' },
  ];

  stats = [
    { label: 'Active Members', value: '1,248', trend: '+12%' },
    { label: 'Revenue MTD', value: '₹4.2L', trend: '+8%' },
    { label: 'Classes Today', value: '42', trend: '87%' },
  ];

  chartBars = [40, 65, 55, 80, 70, 90];

  constructor(private navigationService: NavigationService) {}

  ngOnInit(): void {}

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled = window.scrollY > 100;
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  goToLogin(): void {
    this.navigationService.navigateTo('login');
  }
}
