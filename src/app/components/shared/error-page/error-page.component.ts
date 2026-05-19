import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

export interface ErrorState {
  code: string;
  status: string;
  icon: string;
  title: string;
  body: string;
  button: string;
  action: () => void;
}

@Component({
  selector: 'app-error-page',
  templateUrl: './error-page.component.html',
  styleUrls: ['./error-page.component.css'],
  standalone: false,
})
export class ErrorPageComponent implements OnInit, OnDestroy {
  activeErrorCode = '404';
  activeError: ErrorState | null = null;
  retryCountdown = 15;
  countdownInterval: any;
  isBrowser = false;

  private errorsMap: Record<string, ErrorState> = {
    '401': {
      code: '401',
      status: 'UNAUTHORIZED',
      icon: '🔒',
      title: 'AUTHENTICATION REQUIRED',
      body: 'YOUR SESSION HAS EXPIRED OR IS INVALID. PLEASE SIGN IN TO CONTINUE.',
      button: 'LOG IN →',
      action: () => this.router.navigate(['/login']),
    },
    '403': {
      code: '403',
      status: 'FORBIDDEN',
      icon: '🛡️',
      title: 'ACCESS IS RESTRICTED',
      body: 'YOUR ASSIGNED ROLE LACKS REQUIRED SCOPES TO VIEW THIS RESOURCE.',
      button: 'BACK TO SAFETY',
      action: () => this.router.navigate(['/']),
    },
    '404': {
      code: '404',
      status: 'NOT FOUND',
      icon: '🧭',
      title: 'PAGE NOT FOUND',
      body: 'THE URL PATH SPECIFIED COULD NOT BE FOUND IN ROOT ROUTING CONFIGS.',
      button: 'GO HOME',
      action: () => this.router.navigate(['/']),
    },
    '500': {
      code: '500',
      status: 'SERVER ERROR',
      icon: '🔧',
      title: 'INTERNAL SERVER ERROR',
      body: 'THE SERVICE ENCOUNTERED AN UNEXPECTED EXCEPTION DURING PROVISIONING.',
      button: 'RETRY CONNECTION',
      action: () => this.handleReload(),
    },
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.route.data.subscribe((data) => {
      this.activeErrorCode =
        data['code'] || this.route.snapshot.queryParams['code'] || '404';
      this.activeError =
        this.errorsMap[this.activeErrorCode] || this.errorsMap['404'];

      if (this.activeErrorCode === '500' && this.isBrowser) {
        this.startCountdown();
      }
    });
  }

  ngOnDestroy(): void {
    this.stopCountdown();
  }

  handleReload(): void {
    if (this.isBrowser && typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  startCountdown(): void {
    if (!this.isBrowser) return;
    this.retryCountdown = 15;
    this.countdownInterval = setInterval(() => {
      this.retryCountdown--;
      if (this.retryCountdown <= 0) {
        this.stopCountdown();
        if (this.activeError) {
          this.activeError.action();
        }
      }
    }, 1000);
  }

  stopCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  resetCountdown(): void {
    this.stopCountdown();
    this.startCountdown();
  }
}
