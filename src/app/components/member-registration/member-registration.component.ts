import { Component, OnInit } from '@angular/core';

interface Plan {
  name: string;
  duration: string;
  price: string;
  features: string;
}

interface Branch {
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
  step: number = 1;
  complete: boolean = false;
  currentDateTime: string = '';

  // Form data
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
    branch: 'Indiranagar',
    plan: 'Gold Annual',
  };

  steps = [
    'Personal Details',
    'Contact & Emergency',
    'Plan & Branch',
    'Consent & Finish',
  ];

  branches: Branch[] = [
    { name: 'Indiranagar', address: '12th Main Road, Bangalore', active: 247 },
    { name: 'Koramangala', address: '12th Main Road, Bangalore', active: 189 },
    { name: 'HSR Layout', address: '12th Main Road, Bangalore', active: 156 },
  ];

  plans: Plan[] = [
    {
      name: 'Basic Starter',
      duration: 'Monthly',
      price: '₹1,499',
      features: 'Gym Access Only',
    },
    {
      name: 'Gold Annual',
      duration: 'Annual',
      price: '₹24,999',
      features: 'All Access + Pool',
    },
    {
      name: 'Platinum Pro',
      duration: 'Annual',
      price: '₹41,988',
      features: 'All Access + PT',
    },
  ];

  addOns: AddOn[] = [
    { label: 'PT Package (10 Sessions)', price: '+₹6,500', selected: false },
    { label: 'Locker Storage (Monthly)', price: '+₹300/mo', selected: false },
  ];

  termsAgreed: boolean = false;

  progressBarWidth: number = 0;
  stepperLineWidth: number = 0;

  constructor() {
    this.updateDateTime();
  }

  ngOnInit(): void {
    this.updateProgressBar();
  }

  updateDateTime(): void {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    };
    this.currentDateTime = now.toISOString();
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

  handleFinish(event: Event): void {
    event.preventDefault();
    if (this.termsAgreed) {
      this.complete = true;
    }
  }

  resetForm(): void {
    this.complete = false;
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
      branch: 'Indiranagar',
      plan: 'Gold Annual',
    };
    this.termsAgreed = false;
    this.updateProgressBar();
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
}
