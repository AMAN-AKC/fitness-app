import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NavigationService } from '../../services/navigation.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  showPassword = false;
  errorMessage = '';

  features = [
    'Secure role-based access control (RBAC)',
    'JWT session management with auto-timeout',
    'Personalised dashboard per role',
    'Audit trail on every action',
  ];

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private navigationService: NavigationService,
  ) {}

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    const session = this.authService.getCurrentSession();
    if (session) {
      this.router.navigate([this.authService.getDashboardRoute(session.role)]);
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    const payload = {
      username: this.loginForm.get('username')?.value,
      password: this.loginForm.get('password')?.value,
    };

    this.authService.login(payload).subscribe({
      next: (session) => {
        this.isLoading = false;
        const dashboardRoute = this.authService.getDashboardRoute(session.role);
        this.router.navigate([dashboardRoute]);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = this.authService.getErrorMessage(error);
      },
    });
  }

  goToLanding(): void {
    this.navigationService.navigateTo('landing');
  }

  goToForgetPassword(): void {
    this.navigationService.navigateTo('resetpassword');
  }
}
