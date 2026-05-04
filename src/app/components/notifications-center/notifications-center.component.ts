import { Component, OnInit } from '@angular/core';

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
})
export class NotificationsCenterComponent implements OnInit {
  notifications: Notification[] = [];
  filterType: 'all' | 'unread' = 'all';

  constructor() {}

  ngOnInit(): void {
    this.initializeNotifications();
  }

  initializeNotifications(): void {
    this.notifications = [
      {
        id: '1',
        type: 'reminder',
        title: 'Your Session is Tomorrow',
        message:
          "You have a training session with Priya Sharma tomorrow at 6:00 PM. Don't forget to prepare!",
        timestamp: 'Today at 2:30 PM',
        read: false,
      },
      {
        id: '2',
        type: 'success',
        title: 'Payment Successful',
        message:
          "Your membership renewal has been processed successfully. You're all set for another month!",
        timestamp: 'Yesterday at 5:15 PM',
        read: false,
      },
      {
        id: '3',
        type: 'info',
        title: 'New Class Added',
        message:
          'Check out our new "Advanced Yoga" class starting next Monday at 7:00 AM.',
        timestamp: '2 days ago',
        read: true,
      },
      {
        id: '4',
        type: 'warning',
        title: 'Membership Expiring Soon',
        message:
          'Your membership will expire in 5 days. Renew now to avoid interruption.',
        timestamp: '3 days ago',
        read: true,
      },
      {
        id: '5',
        type: 'error',
        title: 'Payment Failed',
        message:
          'Your last membership payment failed. Please update your payment method.',
        timestamp: '1 week ago',
        read: true,
      },
      {
        id: '6',
        type: 'info',
        title: 'Workout Achievement Unlocked',
        message:
          "You've completed 10 consecutive workouts! 🎉 Keep up the great work.",
        timestamp: '1 week ago',
        read: true,
      },
    ];
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
    notification.read = true;
  }

  markAllAsRead(): void {
    this.notifications.forEach((n) => (n.read = true));
  }

  deleteNotification(id: string): void {
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
