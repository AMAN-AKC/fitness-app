import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  FrontdeskApiService,
  MemberDto,
} from '../../services/frontdesk-api.service';
import { BranchDto, PlanDto } from '../../services/admin-api.service';

interface Plan {
  id: number;
  name: string;
  duration: string;
  price: string;
  features: string;
}

interface Branch {
  id: number;
  name: string;
  address: string;
  active: number;
}

interface AddOn {
  label: string;
  price: string;
  selected: boolean;
}

@Component({
  selector: 'app-member-registration',
  templateUrl: './member-registration.component.html',
  styleUrls: ['./member-registration.component.css'],
  standalone: false,
})
export class MemberRegistrationComponent implements OnInit {
  step = 1;
  complete = false;
  currentDateTime = '';
  createdMember: MemberDto | null = null;
  isLoading = false;
  errorMessage = '';
  selectedPhotoFile: File | null = null;
  photoError = '';

  formData = {
    fullName: '',
    gender: 'Male',
    dateOfBirth: '',
    notes: '',
    email: '',
    phone: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    referralCode: '',
    corporateCode: '',
    branch: '',
    plan: '',
  };

  steps = [
    'Personal Details',
    'Contact & Emergency',
    'Plan & Branch',
    'Consent & Finish',
  ];

  branches: Branch[] = [];
  plans: Plan[] = [];

  addOns: AddOn[] = [
    { label: 'PT Package (10 Sessions)', price: '+₹6,500', selected: false },
    { label: 'Locker Storage (Monthly)', price: '+₹300/mo', selected: false },
  ];

  termsAgreed = false;

  progressBarWidth = 0;
  stepperLineWidth = 0;

  constructor(
    private frontdeskApi: FrontdeskApiService,
    private router: Router,
  ) {
    this.updateDateTime();
  }

  ngOnInit(): void {
    this.updateProgressBar();
    this.loadCatalogData();
  }

  loadCatalogData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.frontdeskApi.getBranches().subscribe({
      next: (branches) => {
        this.branches = branches.map((branch) => this.fromBranchDto(branch));
        this.formData.branch = this.branches[0]?.name || '';
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage =
          error?.error?.message || 'Unable to load branches from backend.';
        this.isLoading = false;
      },
    });

    this.frontdeskApi.getPlans().subscribe({
      next: (plans) => {
        this.plans = plans.map((plan) => this.fromPlanDto(plan));
        this.formData.plan = this.plans[0]?.name || '';
      },
      error: (error) => {
        this.errorMessage =
          error?.error?.message || 'Unable to load plans from backend.';
      },
    });
  }

  updateDateTime(): void {
    this.currentDateTime = new Date().toISOString();
  }

  updateProgressBar(): void {
    this.progressBarWidth = (this.step / 4) * 100;
    this.stepperLineWidth = (this.step - 1) * 33.33;
  }

  handleNext(event: Event): void {
    event.preventDefault();
    if (this.step < 4) {
      this.step++;
      this.updateProgressBar();
    }
  }

  handlePrev(event: Event): void {
    event.preventDefault();
    if (this.step > 1) {
      this.step--;
      this.updateProgressBar();
    }
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.photoError = '';
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        this.photoError = 'Only JPG and PNG files are allowed.';
        this.selectedPhotoFile = null;
        return;
      }
      if (file.size > maxSize) {
        this.photoError = 'File size must be under 5MB.';
        this.selectedPhotoFile = null;
        return;
      }
      this.selectedPhotoFile = file;
    }
  }

  handleFinish(event: Event): void {
    event.preventDefault();
    if (!this.termsAgreed) {
      return;
    }

    const member = this.toMemberDto();
    this.isLoading = true;
    this.errorMessage = '';

    this.frontdeskApi.createMember(member).subscribe({
      next: (createdMember) => {
        // Upload photo if selected (AC06)
        if (this.selectedPhotoFile && createdMember.memberId) {
          this.frontdeskApi
            .uploadMemberPhoto(createdMember.memberId, this.selectedPhotoFile)
            .subscribe({
              next: () => {},
              error: () => {
                // Photo upload failure is non-blocking
                console.warn('Photo upload failed, but member was created.');
              },
            });
        }

        const selectedPlan = this.plans.find(
          (plan) => plan.name === this.formData.plan,
        );
        const selectedBranch = this.branches.find(
          (branch) => branch.name === this.formData.branch,
        );

        if (!selectedPlan || !selectedBranch || !createdMember.memberId) {
          this.createdMember = createdMember;
          this.complete = true;
          this.isLoading = false;
          return;
        }

        this.frontdeskApi
          .createMembership({
            memberId: createdMember.memberId,
            planId: selectedPlan.id,
            branchId: selectedBranch.id,
          })
          .subscribe({
            next: () => {
              this.createdMember = { ...createdMember, status: 'ACTIVE' };
              this.complete = true;
              this.isLoading = false;
            },
            error: (error) => {
              this.createdMember = createdMember;
              this.complete = true;
              this.errorMessage =
                error?.error?.message ||
                'Member created, but membership activation failed.';
              this.isLoading = false;
            },
          });
      },
      error: (error) => {
        this.errorMessage =
          error?.error?.message || 'Unable to create member account.';
        this.isLoading = false;
      },
    });
  }

  resetForm(): void {
    this.complete = false;
    this.createdMember = null;
    this.step = 1;
    this.formData = {
      fullName: '',
      gender: 'Male',
      dateOfBirth: '',
      notes: '',
      email: '',
      phone: '',
      address: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      referralCode: '',
      corporateCode: '',
      branch: this.branches[0]?.name || '',
      plan: this.plans[0]?.name || '',
    };
    this.termsAgreed = false;
    this.updateProgressBar();
  }

  goToFrontdesk(): void {
    this.router.navigate(['/frontdesk-dashboard']);
  }

  getAge(): string {
    if (!this.formData.dateOfBirth) return '--';
    const birthDate = new Date(this.formData.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age.toString();
  }

  isStepCompleted(stepNumber: number): boolean {
    return stepNumber < this.step;
  }

  isStepActive(stepNumber: number): boolean {
    return stepNumber === this.step;
  }

  isStepUpcoming(stepNumber: number): boolean {
    return stepNumber > this.step;
  }

  toggleAddOn(index: number): void {
    this.addOns[index].selected = !this.addOns[index].selected;
  }

  private toMemberDto(): MemberDto {
    const branch = this.branches.find((item) => item.name === this.formData.branch);
    return {
      memName: this.formData.fullName,
      email: this.formData.email,
      phone: this.normalizePhone(this.formData.phone),
      dob: this.formData.dateOfBirth,
      address: this.formData.address,
      emgContact: this.formData.emergencyContactName,
      emgPhone: this.normalizePhone(this.formData.emergencyContactPhone),
      referralCode: this.formData.referralCode || undefined,
      corporateCode: this.formData.corporateCode || undefined,
      notes: this.formData.notes || undefined,
      homeBranchId: branch?.id || this.branches[0]?.id || 0,
    };
  }

  private fromBranchDto(branch: BranchDto): Branch {
    return {
      id: Number(branch.branchId),
      name: branch.branchName,
      address: branch.address,
      active: 0,
    };
  }

  private fromPlanDto(plan: PlanDto): Plan {
    return {
      id: Number(plan.planId),
      name: plan.planName,
      duration:
        plan.durationDays >= 365
          ? 'Annual'
          : plan.durationDays >= 90
            ? 'Quarterly'
            : 'Monthly',
      price: `₹${Number(plan.price).toLocaleString('en-IN')}`,
      features: `${plan.accessStart}-${plan.accessEnd} access`,
    };
  }

  private normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    return digits.length > 10 ? digits.slice(-10) : digits;
  }
}
