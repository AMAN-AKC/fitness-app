import { Component, OnInit } from '@angular/core';
import {
  FrontdeskApiService,
  HealthConsentDto,
  MemberDto,
} from '../../services/frontdesk-api.service';

interface ParqQuestion {
  key: string;
  text: string;
  value: boolean | null;
}

@Component({
  selector: 'app-health-forms',
  templateUrl: './health-forms.component.html',
  styleUrls: ['./health-forms.component.css'],
})
export class HealthFormsComponent implements OnInit {
  currentMember: MemberDto | null = null;
  currentVersion = '';
  consentRequired = true;
  requiresReconfirmation = false;
  history: HealthConsentDto[] = [];
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  questions: ParqQuestion[] = [
    { key: 'heartCondition', text: 'Has a doctor ever said you have a heart condition?', value: null },
    { key: 'chestPain', text: 'Do you feel chest pain during physical activity?', value: null },
    { key: 'dizziness', text: 'Do you lose balance because of dizziness or lose consciousness?', value: null },
    { key: 'boneJointProblem', text: 'Do you have a bone or joint problem that could be made worse by activity?', value: null },
    { key: 'bloodPressureMedication', text: 'Are you currently prescribed medicine for blood pressure or a heart condition?', value: null },
    { key: 'otherReason', text: 'Do you know of any other reason you should not do physical activity?', value: null },
    { key: 'pregnancy', text: 'Are you pregnant or have you recently given birth?', value: null },
  ];

  acknowledgements = {
    medicalAcknowledged: false,
    liabilityAcknowledged: false,
    privacyAcknowledged: false,
  };

  constructor(private api: FrontdeskApiService) {}

  ngOnInit(): void {
    this.loadConsentData();
  }

  loadConsentData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.api.getCurrentMember().subscribe({
      next: (member) => {
        this.currentMember = member;
        this.loadPolicyAndHistory(member.memberId as number);
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Unable to load your member profile.';
        this.isLoading = false;
      },
    });
  }

  setAnswer(question: ParqQuestion, value: boolean): void {
    question.value = value;
  }

  canSubmit(): boolean {
    return (
      !!this.currentMember?.memberId &&
      this.questions.every((question) => question.value !== null) &&
      this.acknowledgements.medicalAcknowledged &&
      this.acknowledgements.liabilityAcknowledged &&
      this.acknowledgements.privacyAcknowledged
    );
  }

  submitForm(): void {
    if (!this.currentMember?.memberId || !this.canSubmit()) {
      this.errorMessage = 'Answer every PAR-Q item and accept all required acknowledgements.';
      return;
    }

    const parqResponses = this.questions.reduce<Record<string, boolean>>((acc, question) => {
      acc[question.key] = question.value === true;
      return acc;
    }, {});

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.api
      .submitConsent({
        memberId: this.currentMember.memberId,
        formVersion: this.currentVersion,
        parqResponses: JSON.stringify(parqResponses),
        ...this.acknowledgements,
      })
      .subscribe({
        next: () => {
          this.successMessage = 'Consent recorded with timestamp, version, and IP.';
          this.resetForm();
          this.loadPolicyAndHistory(this.currentMember?.memberId as number);
        },
        error: (error) => {
          this.errorMessage = error?.error?.message || 'Unable to submit consent.';
          this.isSubmitting = false;
        },
      });
  }

  downloadHistory(): void {
    if (!this.currentMember?.memberId) return;
    this.api.downloadConsentHistory(this.currentMember.memberId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'consent-history.pdf';
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.errorMessage = 'Unable to download consent history.';
      },
    });
  }

  maskIp(value?: string): string {
    return value ? '****' : '';
  }

  private loadPolicyAndHistory(memberId: number): void {
    this.api.getConsentPolicy().subscribe({
      next: (policy) => {
        this.currentVersion = policy.currentVersion;
        this.api.getConsentStatus(memberId).subscribe({
          next: (status) => {
            this.consentRequired = status.consentRequired;
            this.requiresReconfirmation = status.requiresReconfirmation;
          },
        });
        this.api.getConsentHistory(memberId).subscribe({
          next: (history) => {
            this.history = history;
            this.isLoading = false;
            this.isSubmitting = false;
          },
          error: (error) => {
            this.errorMessage = error?.error?.message || 'Unable to load consent history.';
            this.isLoading = false;
            this.isSubmitting = false;
          },
        });
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Unable to load consent policy.';
        this.isLoading = false;
        this.isSubmitting = false;
      },
    });
  }

  private resetForm(): void {
    this.questions = this.questions.map((question) => ({ ...question, value: null }));
    this.acknowledgements = {
      medicalAcknowledged: false,
      liabilityAcknowledged: false,
      privacyAcknowledged: false,
    };
  }
}
