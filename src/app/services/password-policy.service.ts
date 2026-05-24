import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface PasswordPolicy {
  minPasswordLength: number;
  requireUppercase: boolean;
  requireNumber: boolean;
  requireSpecialChar: boolean;
  sessionTimeoutMin: number;   // backend field name
  maxFailedAttempts: number;
  lockoutDurationMin: number;  // backend field name
  lastUpdatedBy?: string;
  updatedAt?: string;
}

const STORAGE_KEY = 'fitclub_password_policy';

/** Hardcoded fallback — used only when both the API and localStorage are unavailable */
const DEFAULT_POLICY: PasswordPolicy = {
  minPasswordLength: 8,
  requireUppercase: true,
  requireNumber: true,
  requireSpecialChar: true,
  sessionTimeoutMin: 60,
  maxFailedAttempts: 5,
  lockoutDurationMin: 30,
};

@Injectable({
  providedIn: 'root',
})
export class PasswordPolicyService {

  private readonly apiUrl = `${environment.apiBaseUrl}/admin/config/password-policy`;

  private _policy$ = new BehaviorSubject<PasswordPolicy>(this.loadFromStorage());

  /** Observable stream — subscribe to get live updates when admin saves */
  readonly policy$ = this._policy$.asObservable();

  /** Synchronous snapshot for template bindings */
  get policy(): PasswordPolicy {
    return this._policy$.getValue();
  }

  constructor(private http: HttpClient) {
    // Fetch from backend on startup; localStorage acts as the fast first-paint cache
    this.fetchFromApi().subscribe();
  }

  // ── Public API ───────────────────────────────────────────────────────────

  /**
   * Fetch the policy from the backend.
   * Called on service construction and can be refreshed at any time.
   */
  fetchFromApi(): Observable<PasswordPolicy> {
    return this.http.get<PasswordPolicy>(this.apiUrl).pipe(
      tap(p => this.applyAndCache(p)),
      catchError(() => {
        // Backend unavailable — keep whatever is already loaded (localStorage or default)
        return of(this._policy$.getValue());
      })
    );
  }

  /**
   * Save a new policy to the backend (ADMIN only).
   * On success the in-memory state and localStorage are both updated.
   */
  savePolicy(policy: PasswordPolicy): Observable<PasswordPolicy> {
    return this.http.put<PasswordPolicy>(this.apiUrl, policy).pipe(
      tap(saved => this.applyAndCache(saved)),
      catchError(err => {
        // Even if the PUT fails, keep local state consistent
        this.applyAndCache(policy);
        throw err;   // re-throw so the component can show an error
      })
    );
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private applyAndCache(p: PasswordPolicy): void {
    const merged = { ...DEFAULT_POLICY, ...p };
    this._policy$.next(merged);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch {
      // localStorage unavailable (SSR / private mode) — in-memory only
    }
  }

  private loadFromStorage(): PasswordPolicy {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return { ...DEFAULT_POLICY, ...JSON.parse(raw) };
      }
    } catch {
      // ignore parse errors
    }
    return { ...DEFAULT_POLICY };
  }
}
