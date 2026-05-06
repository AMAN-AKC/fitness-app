import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
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

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  login(payload: LoginRequest): Observable<AuthSession> {
    return this.http
      .post<AuthSession>(`${environment.apiBaseUrl}/auth/login`, payload)
      .pipe(
        tap((session) => this.storeSession(session)),
        catchError((error) => {
          console.error('Login error:', error);
          return throwError(() => error);
        }),
      );
  }

  logout(): void {
    this.clearSession();
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
