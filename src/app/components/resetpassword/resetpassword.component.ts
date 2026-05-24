import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { NavigationService } from '../../services/navigation.service';
import { AuthService } from '../../services/auth.service';
import { PasswordPolicyService, PasswordPolicy } from '../../services/password-policy.service';

@Component({
  selector: 'app-resetpassword',
  templateUrl: './resetpassword.component.html',
  styleUrls: ['./resetpassword.component.css'],
})
export class ResetpasswordComponent implements OnInit, OnDestroy {
  resetForm!: FormGroup;
  passwordForm!: FormGroup;

  resetSent = false;
  passwordSuccess = false;
  showNewPassword = false;
  showConfirmPassword = false;
  showLockout = false;
  countdown = 45;

  resetEmail = '';
  newPassword = '';
  confirmPassword = '';

  hasToken = false;
  token = '';
  otp = '';
  otpSent = false;
  errorMessage = '';
  isSubmitting = false;

  // Live policy from admin settings
  policy!: PasswordPolicy;
  private policySub!: Subscription;

  // Strength display (0–5 score)
  passwordStrength = { level: 0, label: '', color: '' };

  constructor(
    private formBuilder: FormBuilder,
    private navigationService: NavigationService,
    private route: ActivatedRoute,
    private authService: AuthService,
    private policyService: PasswordPolicyService
  ) {}

  ngOnInit(): void {
    // Subscribe to live policy updates
    this.policySub = this.policyService.policy$.subscribe(p => {
      this.policy = { ...p };
      // Rebuild form validators dynamically whenever policy changes
      if (this.passwordForm) {
        this.passwordForm.get('newPassword')?.setValidators([
          Validators.required,
          Validators.minLength(this.policy.minPasswordLength),
        ]);
        this.passwordForm.get('newPassword')?.updateValueAndValidity();
      }
    });

    this.route.queryParams.subscribe(params => {
      if (params['token']) {
        this.hasToken = true;
        this.token = params['token'];
      }
    });

    this.resetForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
    });

    this.passwordForm = this.formBuilder.group({
      newPassword: ['', [Validators.required, Validators.minLength(this.policy.minPasswordLength)]],
      confirmPassword: ['', Validators.required],
    });
  }

  ngOnDestroy(): void {
    this.policySub?.unsubscribe();
  }

  // ── Policy-driven checklist ────────────────────────────────────────────

  get policyChecks(): { label: string; met: boolean }[] {
    const p = this.newPassword;
    const checks = [
      {
        label: `Minimum ${this.policy.minPasswordLength} characters`,
        met: p.length >= this.policy.minPasswordLength,
      },
    ];
    if (this.policy.requireUppercase) {
      checks.push({ label: 'At least one uppercase letter', met: /[A-Z]/.test(p) });
    }
    if (this.policy.requireNumber) {
      checks.push({ label: 'At least one number', met: /[0-9]/.test(p) });
    }
    if (this.policy.requireSpecialChar) {
      checks.push({
        label: 'At least one special character (@, #, !, etc.)',
        met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p),
      });
    }
    return checks;
  }

  get allChecksMet(): boolean {
    return this.policyChecks.every(c => c.met);
  }

  // ── Strength bar (5-segment, policy-aware) ────────────────────────────

  get strengthScore(): number {
    const p = this.newPassword;
    if (!p) return 0;
    let score = 0;
    if (p.length >= this.policy.minPasswordLength) score++;
    if (p.length >= this.policy.minPasswordLength + 4) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p)) score++;
    return score;
  }

  get strengthLabel(): string {
    const s = this.strengthScore;
    if (s <= 1) return 'Weak';
    if (s <= 3) return 'Fair';
    if (s === 4) return 'Strong';
    return 'Very Strong';
  }

  get strengthColor(): string {
    const s = this.strengthScore;
    if (s <= 1) return '#DC2626';
    if (s <= 3) return '#D97706';
    if (s === 4) return '#2563EB';
    return '#16A34A';
  }

  // Kept for template compatibility
  get passwordStrengthLegacy() {
    return {
      level: this.strengthScore,
      label: this.strengthLabel,
      color: this.strengthColor,
    };
  }

  // ── Events ────────────────────────────────────────────────────────────

  onNewPasswordChange(password: string): void {
    this.newPassword = password;
  }

  onSendResetLink(): void {
    if (this.resetEmail) {
      this.isSubmitting = true;
      this.errorMessage = '';
      this.authService.requestPasswordReset(this.resetEmail).subscribe({
        next: () => {
          this.resetSent = true;
          this.otpSent = true;
          this.isSubmitting = false;
          this.startCountdown();
        },
        error: (err) => {
          this.errorMessage = this.authService.getErrorMessage(err);
          this.isSubmitting = false;
        }
      });
    }
  }

  startCountdown(): void {
    this.countdown = 60;
    const interval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(interval);
      }
    }, 1000);
  }

  onVerifyOTP(): void {
    if (this.otp.length === 6) {
      this.token = this.otp;
      this.hasToken = true;
    } else {
      this.errorMessage = 'Please enter a valid 6-digit code.';
    }
  }

  onUpdatePassword(): void {
    if (!this.allChecksMet) {
      this.errorMessage = 'Password does not meet the security policy requirements.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }
    if (!this.passwordForm.valid) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.authService.resetPassword(this.token, this.newPassword).subscribe({
      next: () => {
        this.passwordSuccess = true;
        this.isSubmitting = false;
      },
      error: (err) => {
        this.errorMessage = this.authService.getErrorMessage(err);
        this.isSubmitting = false;
      }
    });
  }

  togglePasswordVisibility(field: 'new' | 'confirm'): void {
    if (field === 'new') {
      this.showNewPassword = !this.showNewPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  goToLogin(): void {
    this.navigationService.navigateTo('login');
  }

  goToLanding(): void {
    this.navigationService.navigateTo('landing');
  }
}
