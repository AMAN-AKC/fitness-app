import { Component } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-error-states-view',
  templateUrl: './error-states-view.component.html',
  styleUrls: ['./error-states-view.component.css'],
  standalone: false
})
export class ErrorStatesViewComponent {

  constructor(private toastService: ToastService) {}

  triggerToast(type: 'success' | 'warning' | 'error' | 'info'): void {
    let title = 'SUCCESS';
    let message = 'OPERATION COMPLETED SUCCESSFULLY.';

    if (type === 'warning') {
      title = 'WARNING';
      message = 'MEMBERSHIP STATUS EXPIRES IN 3 DAYS.';
    } else if (type === 'error') {
      title = 'ERROR';
      message = 'FAILED TO SAVE CHANGES. CONNECTION TIMEOUT.';
    } else if (type === 'info') {
      title = 'INFO';
      message = 'NEW VERSION 2.4.0 IS NOW AVAILABLE.';
    }

    this.toastService.show(type, title, message);
  }

  triggerAllToasts(): void {
    const types: ('success' | 'warning' | 'error' | 'info')[] = ['success', 'info', 'warning', 'error'];
    types.forEach((type, idx) => {
      setTimeout(() => {
        this.triggerToast(type);
      }, idx * 250);
    });
  }

  dismissToast(id: number): void {
    // Handled globally now
  }
}
