import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, Subject, timer } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import {
  LoginRequest,
  AuthSession,
  AuthErrorResponse,
} from '../models/auth-session.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly SESSION_KEY = 'fitness_auth_session';
  private sessionTimeoutSubject = new Subject<void>();
  public sessionTimeout$ = this.sessionTimeoutSubject.asObservable();
  private timeoutHandle: any;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {
    this.initializeSessionTimeout();
  }

  login(payload: LoginRequest): Observable<AuthSession> {
    return this.http
      .post<AuthSession>(`${environment.apiBaseUrl}/auth/login`, payload)
      .pipe(
        tap((session) => {
          this.storeSession(session);
          this.setupSessionTimeout(session);
        }),
        catchError((error) => {
          console.error('Login error:', error);
          return throwError(() => error);
        }),
      );
  }

  logout(): void {
    this.clearSessionTimeout();
    this.clearSession();
  }

  requestPasswordReset(email: string): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/auth/forgot-password?email=${encodeURIComponent(email)}`, {});
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/auth/reset-password?token=${encodeURIComponent(token)}&newPassword=${encodeURIComponent(newPassword)}`, {});
  }

  getCurrentSession(): AuthSession | null {
    return this.readSession();
  }

  getToken(): string | null {
    const session = this.readSession();
    return session ? session.token : null;
  }

  isAuthenticated(): boolean {
    return !!this.readSession();
  }

  hasRole(requiredRoles: string[]): boolean {
    const session = this.readSession();
    if (!session) {
      return false;
    }

    const currentRole = this.normalizeRole(session.role);
    return requiredRoles.some(
      (role) => this.normalizeRole(role) === currentRole,
    );
  }

  getDashboardRoute(role: string): string {
    switch (this.normalizeRole(role)) {
      case 'admin':
        return '/global-dashboard';
      case 'manager':
        return '/manager-dashboard';
      case 'trainer':
        return '/trainer-dashboard';
      case 'frontdesk':
        return '/frontdesk-dashboard';
      case 'member':
        return '/member-dashboard';
      default:
        return '/login';
    }
  }

  getErrorMessage(error: any): string {
    if (error?.error?.message) {
      return error.error.message;
    }
    if (error?.message) {
      return error.message;
    }
    return 'An error occurred. Please try again.';
  }

  /**
   * Get session expiration time in milliseconds from now
   * AC04: Session timeout tracking
   */
  getSessionExpirationTime(): number | null {
    const session = this.readSession();
    if (!session) {
      return null;
    }

    try {
      // Decode JWT to get expiration time
      const base64Url = session.token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join(''),
      );

      const payload = JSON.parse(jsonPayload);
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      return expirationTime - Date.now();
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  }

  /**
   * Initialize session timeout monitoring on app startup
   * AC04: Automatic session validation
   */
  private initializeSessionTimeout(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const session = this.readSession();
    if (session) {
      this.setupSessionTimeout(session);
    }
  }

  /**
   * Setup automatic session timeout check
   * AC04: Auto-logout on token expiration
   */
  private setupSessionTimeout(session: AuthSession): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.clearSessionTimeout();

    const expirationTime = this.getSessionExpirationTime();
    if (expirationTime && expirationTime > 0) {
      // Add 5-second buffer before token actually expires
      const timeoutMs = expirationTime - 5000;

      if (timeoutMs > 0) {
        this.timeoutHandle = setTimeout(() => {
          console.warn('Session expired due to timeout');
          this.logout();
          this.sessionTimeoutSubject.next();
          this.router.navigate(['/login']);
        }, timeoutMs);
      }
    }
  }

  /**
   * Clear the session timeout
   */
  private clearSessionTimeout(): void {
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
      this.timeoutHandle = null;
    }
  }

  private storeSession(session: AuthSession): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    }
  }

  private readSession(): AuthSession | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    const stored = localStorage.getItem(this.SESSION_KEY);
    if (!stored) {
      return null;
    }

    try {
      return JSON.parse(stored) as AuthSession;
    } catch {
      return null;
    }
  }

  private clearSession(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.SESSION_KEY);
    }
  }

  private normalizeRole(role: string): string {
    return role.toLowerCase().replace(/[_\s-]/g, '');
  }
}
