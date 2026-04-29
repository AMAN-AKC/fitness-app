import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavigationService } from '../../services/navigation.service';

@Component({
  selector: 'app-resetpassword',
  templateUrl: './resetpassword.component.html',
  styleUrls: ['./resetpassword.component.css'],
})
export class ResetpasswordComponent implements OnInit {
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

  passwordStrength = { level: 0, label: '', color: '' };
  passwordChecks = [
    { label: 'Minimum 8 characters', met: false },
    { label: 'At least one uppercase letter', met: false },
    { label: 'At least one number', met: false },
    { label: 'At least one special character (@, #, !, etc.)', met: false },
  ];

  constructor(
    private formBuilder: FormBuilder,
    private navigationService: NavigationService,
  ) {}

  ngOnInit(): void {
    this.resetForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
    });

    this.passwordForm = this.formBuilder.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    });
  }

  getPasswordStrength(password: string): {
    level: number;
    label: string;
    color: string;
  } {
    if (password.length === 0) return { level: 0, label: '', color: '' };
    if (password.length < 4)
      return { level: 1, label: 'Weak', color: '#DC2626' };
    if (password.length < 8)
      return { level: 2, label: 'Fair', color: '#D97706' };
    if (password.length < 12)
      return { level: 3, label: 'Good', color: '#2563EB' };
    return { level: 4, label: 'Strong', color: '#16A34A' };
  }

  onNewPasswordChange(password: string): void {
    this.newPassword = password;
    this.passwordStrength = this.getPasswordStrength(password);

    // Update password checks
    this.passwordChecks[0].met = password.length >= 8;
    this.passwordChecks[1].met = /[A-Z]/.test(password);
    this.passwordChecks[2].met = /[0-9]/.test(password);
    this.passwordChecks[3].met = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  }

  onSendResetLink(): void {
    if (this.resetEmail) {
      this.resetSent = true;
      console.log('Reset link sent to:', this.resetEmail);
    }
  }

  onUpdatePassword(): void {
    if (this.passwordForm.valid && this.newPassword === this.confirmPassword) {
      this.passwordSuccess = true;
      console.log('Password updated successfully');
    }
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
