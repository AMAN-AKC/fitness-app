import { Component } from '@angular/core';

export type ErrorState = '404' | '500' | 'no-data' | 'network';

@Component({
  selector: 'app-error-states-view',
  templateUrl: './error-states-view.component.html',
  styleUrls: ['./error-states-view.component.css'],
})
export class ErrorStatesViewComponent {
  selectedError: ErrorState = '404';
  errorStates: ErrorState[] = ['404', '500', 'no-data', 'network'];

  errors: {
    [key in ErrorState]: { icon: string; title: string; message: string };
  } = {
    '404': {
      icon: '🔍',
      title: 'Page Not Found',
      message: "The page you're looking for doesn't exist or has been moved.",
    },
    '500': {
      icon: '⚙️',
      title: 'Server Error',
      message: 'Something went wrong on our end. Please try again later.',
    },
    'no-data': {
      icon: '📭',
      title: 'No Data Found',
      message: 'No results match your search. Try adjusting your filters.',
    },
    network: {
      icon: '🌐',
      title: 'Network Error',
      message: 'Unable to connect. Please check your internet connection.',
    },
  };

  selectError(error: ErrorState): void {
    this.selectedError = error;
  }

  getErrorDetails(): { icon: string; title: string; message: string } {
    return this.errors[this.selectedError];
  }
}
