import { Component, OnInit } from '@angular/core';
import { FrontdeskApiService } from '../../services/frontdesk-api.service';
import { AuthService } from '../../services/auth.service';

export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'reminder';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

@Component({
  selector: 'app-notifications-center',
  templateUrl: './notifications-center.component.html',
  styleUrls: ['./notifications-center.component.css'],
  standalone: false
})
export class NotificationsCenterComponent implements OnInit {
  notifications: Notification[] = [];
  filterType: 'all' | 'unread' = 'all';
  currentUserId = 0;
  isLoading = false;
  errorMessage = '';

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
      this.errorMessage = "Please log in to view notifications.";
    }
  }

  initializeNotifications(): void {
    this.isLoading = true;
    this.frontdeskApi.getNotifications(this.currentUserId).subscribe({
      next: (notifs) => {
        this.notifications = notifs.map(n => {
          let ntype: NotificationType = 'info';
          if (n.type === 'BILLING_SUCCESS') ntype = 'success';
          else if (n.type === 'BILLING_FAILED') ntype = 'error';
          else if (n.type === 'CLASS_REMINDER') ntype = 'reminder';
          else if (n.type === 'PLAN_EXPIRY_WARNING') ntype = 'warning';

          return {
            id: n.notifId.toString(),
            type: ntype,
            title: n.title,
            message: n.body,
            timestamp: new Date(n.createdAt).toLocaleString(),
            read: n.isRead,
          };
        });
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to load notifications';
        this.isLoading = false;
      }
    });
  }

  get filteredNotifications(): Notification[] {
    if (this.filterType === 'unread') {
      return this.notifications.filter((n) => !n.read);
    }
    return this.notifications;
  }

  get unreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  markAsRead(notification: Notification): void {
    if(!notification.read) {
       this.frontdeskApi.markNotificationAsRead(Number(notification.id)).subscribe({
         next: () => {
           notification.read = true;
         }
       });
    }
  }

  markAllAsRead(): void {
    const unread = this.notifications.filter(n => !n.read);
    unread.forEach(notification => this.markAsRead(notification));
  }

  deleteNotification(id: string): void {
    // API doesn't support deletion yet, so just hide locally
    this.notifications = this.notifications.filter((n) => n.id !== id);
  }

  deleteAllNotifications(): void {
    this.notifications = [];
  }

  getNotificationIcon(type: NotificationType): string {
    switch (type) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      case 'error':
        return '✕';
      case 'reminder':
        return '🔔';
      default:
        return 'ℹ';
    }
  }

  getNotificationBgColor(type: NotificationType): string {
    switch (type) {
      case 'success':
        return 'bg-[#F0FDF4] border-[#16A34A]';
      case 'warning':
        return 'bg-[#FFFBEB] border-[#D97706]';
      case 'error':
        return 'bg-[#FEF2F2] border-[#DC2626]';
      case 'reminder':
        return 'bg-[#EFF5FF] border-[#2563EB]';
      default:
        return 'bg-[#F8F9FC] border-[#E8ECF4]';
    }
  }

  getNotificationTextColor(type: NotificationType): string {
    switch (type) {
      case 'success':
        return 'text-[#15803D]';
      case 'warning':
        return 'text-[#B45309]';
      case 'error':
        return 'text-[#991B1B]';
      case 'reminder':
        return 'text-[#1E40AF]';
      default:
        return 'text-[#475569]';
    }
  }

  getNotificationIconColor(type: NotificationType): string {
    switch (type) {
      case 'success':
        return 'text-[#16A34A]';
      case 'warning':
        return 'text-[#D97706]';
      case 'error':
        return 'text-[#DC2626]';
      case 'reminder':
        return 'text-[#2563EB]';
      default:
        return 'text-[#94A3B8]';
    }
  }
}
