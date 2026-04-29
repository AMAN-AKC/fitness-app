import { Component, OnInit, OnDestroy } from '@angular/core';

export interface Toast {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  duration?: number;
}

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css'],
  standalone: false,
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  private toastQueue: Toast[] = [];

  constructor() {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.toasts = [];
  }

  /**
   * Show a toast notification
   * @param type - Type of toast: success, warning, error, info
   * @param message - Toast message text
   * @param duration - Duration in ms before auto-dismiss (default 4000ms)
   */
  show(
    type: 'success' | 'warning' | 'error' | 'info',
    message: string,
    duration: number = 4000,
  ): void {
    const id = this.generateId();
    const toast: Toast = { id, type, message, duration };

    this.toasts.push(toast);

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }
  }

  success(message: string, duration?: number): void {
    this.show('success', message, duration);
  }

  warning(message: string, duration?: number): void {
    this.show('warning', message, duration);
  }

  error(message: string, duration?: number): void {
    this.show('error', message, duration);
  }

  info(message: string, duration?: number): void {
    this.show('info', message, duration);
  }

  dismiss(id: string): void {
    this.toasts = this.toasts.filter((toast) => toast.id !== id);
  }

  dismissAll(): void {
    this.toasts = [];
  }

  getIcon(type: string): string {
    const icons: any = {
      success: '✓',
      warning: '⚠',
      error: '✗',
      info: 'ℹ',
    };
    return icons[type] || '•';
  }

  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
