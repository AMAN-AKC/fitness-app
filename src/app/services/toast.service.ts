import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface Toast {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toastSubject = new Subject<Toast>();

  get toasts$(): Observable<Toast> {
    return this.toastSubject.asObservable();
  }

  show(
    type: 'success' | 'warning' | 'error' | 'info',
    title: string,
    message: string,
    duration = 4000,
  ): void {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.toastSubject.next({ id, type, title, message, duration });
  }

  success(message: string, duration = 4000): void {
    this.show('success', 'SUCCESS', message, duration);
  }

  warning(message: string, duration = 4000): void {
    this.show('warning', 'WARNING', message, duration);
  }

  error(message: string, duration = 4000): void {
    this.show('error', 'ERROR', message, duration);
  }

  info(message: string, duration = 4000): void {
    this.show('info', 'INFO', message, duration);
  }
}
