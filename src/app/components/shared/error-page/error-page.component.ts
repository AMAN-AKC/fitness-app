import { Component, OnInit, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-error-page',
  templateUrl: './error-page.component.html',
  styleUrls: ['./error-page.component.css'],
  standalone: false,
})
export class ErrorPageComponent implements OnInit, OnDestroy {
  retryCountdown = 15;
  countdownInterval: any;

  errors = [
    {
      code: '401',
      title: 'Session Expired',
      body: 'Your session timed out for security. Please sign in again.',
      iconBg: '#EFF5FF',
      iconColor: '#2563EB',
      icon: 'lock',
      button: 'Go to Login',
    },
    {
      code: '403',
      title: 'Access Denied',
      body: "You don't have permission to view this page. Contact your admin.",
      iconBg: '#FEF2F2',
      iconColor: '#DC2626',
      icon: 'shield',
      button: 'Go to Dashboard',
    },
    {
      code: '404',
      title: 'Page Not Found',
      body: "The page you're looking for has moved or doesn't exist.",
      iconBg: '#FFFBEB',
      iconColor: '#D97706',
      icon: 'compass',
      button: 'Go Home',
      secondaryText: 'Report this issue',
    },
    {
      code: '500',
      title: 'Something went wrong',
      body: 'Our team has been notified. Please try again in a moment.',
      iconBg: '#FEF2F2',
      iconColor: '#DC2626',
      icon: 'lightning',
      button: 'Retry',
      secondaryButton: 'Support',
      showCountdown: true,
    },
    {
      code: 'EMPTY',
      title: 'No classes match your filters',
      body: 'Try adjusting your category, day, or time filters.',
      iconBg: '#F0F4FF',
      iconColor: '#CBD5E1',
      icon: 'search',
      button: 'Clear All Filters',
      isGhost: true,
    },
  ];

  toasts = [
    {
      type: 'success',
      message: 'Booking confirmed! Yoga Basics — Thu 7:00 AM',
      icon: '✓',
    },
    {
      type: 'warning',
      message: 'Membership expiring in 3 days. Renew now.',
      icon: '⚠',
    },
    {
      type: 'error',
      message: 'Payment failed. Please try a different method.',
      icon: '✗',
    },
    {
      type: 'info',
      message: 'Class roster updated by trainer Anand.',
      icon: 'ℹ',
    },
  ];

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.startCountdown();
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  startCountdown(): void {
    this.retryCountdown = 15;
    this.countdownInterval = setInterval(() => {
      this.retryCountdown--;
      if (this.retryCountdown <= 0) {
        clearInterval(this.countdownInterval);
      }
    }, 1000);
  }

  resetCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.startCountdown();
  }

  getIconSvg(icon: string): SafeHtml {
    const icons: any = {
      lock: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
      shield:
        '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="9" y1="12" x2="15" y2="18"/><line x1="15" y1="12" x2="9" y2="18"/></svg>',
      compass:
        '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 7.76 16.24 12 12"/></svg>',
      lightning:
        '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
      search:
        '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    };
    const svg = icons[icon] || '';
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }
}
