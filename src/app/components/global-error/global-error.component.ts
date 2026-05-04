import { Component, OnInit } from '@angular/core';

export interface GlobalErrorAlert {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  dismissible: boolean;
}

@Component({
  selector: 'app-global-error',
  templateUrl: './global-error.component.html',
  styleUrls: ['./global-error.component.css'],
})
export class GlobalErrorComponent implements OnInit {
  alerts: GlobalErrorAlert[] = [];

  constructor() {}

  ngOnInit(): void {
    this.addAlert(
      'Connection lost. Please check your internet.',
      'error',
      true,
    );
    this.addAlert('Your session will expire in 5 minutes.', 'warning', true);
  }

  addAlert(
    message: string,
    type: 'error' | 'warning' | 'info',
    dismissible = true,
  ): void {
    const alert: GlobalErrorAlert = {
      id: Date.now().toString(),
      message,
      type,
      dismissible,
    };
    this.alerts.push(alert);

    if (type === 'info') {
      setTimeout(() => this.removeAlert(alert.id), 5000);
    }
  }

  removeAlert(id: string): void {
    this.alerts = this.alerts.filter((a) => a.id !== id);
  }

  getAlertBgColor(type: string): string {
    return type === 'error'
      ? 'bg-[#FEF2F2]'
      : type === 'warning'
        ? 'bg-[#FFFBEB]'
        : 'bg-[#EFF5FF]';
  }

  getAlertBorderColor(type: string): string {
    return type === 'error'
      ? 'border-[#DC2626]'
      : type === 'warning'
        ? 'border-[#D97706]'
        : 'border-[#2563EB]';
  }

  getAlertTextColor(type: string): string {
    return type === 'error'
      ? 'text-[#991B1B]'
      : type === 'warning'
        ? 'text-[#B45309]'
        : 'text-[#1E40AF]';
  }

  getAlertIcon(type: string): string {
    return type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ';
  }
}
