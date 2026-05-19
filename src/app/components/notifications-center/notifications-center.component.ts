import { Component, OnInit } from '@angular/core';
import { FrontdeskApiService } from '../../services/frontdesk-api.service';
import { AuthService } from '../../services/auth.service';

export type NotificationCategory = 'BOOKING' | 'PAYMENT' | 'RENEWAL' | 'SYSTEM' | 'ALERT';

export interface Notification {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  timeAgo: string;
}

@Component({
  selector: 'app-notifications-center',
  templateUrl: './notifications-center.component.html',
  styleUrls: ['./notifications-center.component.css'],
  standalone: false
})
export class NotificationsCenterComponent implements OnInit {
  notifications: Notification[] = [];
  currentTab: 'ALL' | 'UNREAD' | 'BOOKINGS' | 'PAYMENTS' | 'RENEWALS' | 'SYSTEM' = 'ALL';
  currentUserId = 0;
  isLoading = false;
  errorMessage = '';
  isPreferencesOpen = false;

  // Preferences Toggles
  preferences = {
    bookingConfirmations: { inApp: true, email: true },
    cancellations: { inApp: true, email: true },
    renewalReminders: { inApp: true, email: true },
    scheduleChanges: { inApp: true, email: true },
    dunningAlerts: { inApp: true, email: true },
    systemAnnouncements: { inApp: true, email: true }
  };

  constructor(
    private frontdeskApi: FrontdeskApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const session = this.authService.getCurrentSession();
    if (session) {
      this.currentUserId = Number(session.userId);
      this.initializeNotifications();
    } else {
      this.errorMessage = "PLEASE LOG IN TO VIEW NOTIFICATIONS.";
    }
  }

  initializeNotifications(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.frontdeskApi.getNotifications(this.currentUserId).subscribe({
      next: (notifs) => {
        this.notifications = notifs.map(n => {
          let category: NotificationCategory = 'SYSTEM';
          
          // Map backend type to category
          const type = String(n.type).toUpperCase();
          if (type.includes('BOOKING')) {
            category = 'BOOKING';
          } else if (type.includes('PAYMENT') || type.includes('BILLING')) {
            category = 'PAYMENT';
          } else if (type.includes('MEMBERSHIP') || type.includes('RENEWAL') || type.includes('EXPIRY')) {
            category = 'RENEWAL';
          } else if (type.includes('ALERT') || type.includes('WARNING') || type.includes('DUNNING')) {
            category = 'ALERT';
          } else {
            category = 'SYSTEM';
          }

          return {
            id: n.notifId.toString(),
            category: category,
            title: n.title,
            message: n.body,
            timestamp: new Date(n.createdAt).toLocaleString(),
            read: n.isRead,
            timeAgo: this.calculateTimeAgo(new Date(n.createdAt))
          };
        });
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'FAILED TO LOAD NOTIFICATIONS.';
        this.isLoading = false;
      }
    });
  }

  private calculateTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'JUST NOW';
    if (diffMins < 60) return `${diffMins} MINS AGO`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'HOUR' : 'HOURS'} AGO`;
    return `${diffDays} ${diffDays === 1 ? 'DAY' : 'DAYS'} AGO`;
  }

  get filteredNotifications(): Notification[] {
    return this.notifications.filter(n => {
      if (this.currentTab === 'UNREAD') return !n.read;
      if (this.currentTab === 'BOOKINGS') return n.category === 'BOOKING';
      if (this.currentTab === 'PAYMENTS') return n.category === 'PAYMENT';
      if (this.currentTab === 'RENEWALS') return n.category === 'RENEWAL';
      if (this.currentTab === 'SYSTEM') return n.category === 'SYSTEM' || n.category === 'ALERT';
      return true; // 'ALL'
    });
  }

  getTabCount(tab: string): number {
    switch (tab) {
      case 'UNREAD':
        return this.notifications.filter(n => !n.read).length;
      case 'BOOKINGS':
        return this.notifications.filter(n => n.category === 'BOOKING').length;
      case 'PAYMENTS':
        return this.notifications.filter(n => n.category === 'PAYMENT').length;
      case 'RENEWALS':
        return this.notifications.filter(n => n.category === 'RENEWAL').length;
      case 'SYSTEM':
        return this.notifications.filter(n => n.category === 'SYSTEM' || n.category === 'ALERT').length;
      default:
        return this.notifications.length;
    }
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  markAsRead(notification: Notification): void {
    if (!notification.read) {
      this.frontdeskApi.markNotificationAsRead(Number(notification.id)).subscribe({
        next: () => {
          notification.read = true;
        },
        error: () => {
          // Fallback UI update
          notification.read = true;
        }
      });
    }
  }

  markAllAsRead(): void {
    const unread = this.notifications.filter(n => !n.read);
    unread.forEach(n => this.markAsRead(n));
  }

  togglePreferences(): void {
    this.isPreferencesOpen = !this.isPreferencesOpen;
  }

  closePreferences(): void {
    this.isPreferencesOpen = false;
  }

  savePreferences(): void {
    this.closePreferences();
    console.log('Saved preferences:', this.preferences);
  }

  getUnicodeIcon(category: NotificationCategory): string {
    switch (category) {
      case 'BOOKING': return '📅';
      case 'PAYMENT': return '💰';
      case 'RENEWAL': return '🔄';
      case 'ALERT': return '🚨';
      default: return '📢';
    }
  }
}
