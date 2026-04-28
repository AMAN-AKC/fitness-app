import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { NavigationService } from "../../services/navigation.service";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.css"],
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  showPassword = false;
  emailError = "";
  passwordError = "";

  features = [
    "Secure role-based access control (RBAC)",
    "JWT session management with auto-timeout",
    "Personalised dashboard per role",
    "Audit trail on every action",
  ];

  constructor(
    private formBuilder: FormBuilder,
    private navigationService: NavigationService,
  ) {}

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(6)]],
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.emailError = "";
    this.passwordError = "";

    if (!this.loginForm.get("email")?.value) {
      this.emailError = "Email is required";
    } else if (!this.isValidEmail(this.loginForm.get("email")?.value)) {
      this.emailError = "Please enter a valid email";
    }

    if (!this.loginForm.get("password")?.value) {
      this.passwordError = "Password is required";
    }

    if (this.emailError || this.passwordError) {
      return;
    }

    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = false;
      console.log("Login successful:", this.loginForm.value);
    }, 2000);
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  goToLanding(): void {
    this.navigationService.navigateTo("landing");
  }

  goToForgetPassword(): void {
    this.navigationService.navigateTo("restpassword");
  }
}
