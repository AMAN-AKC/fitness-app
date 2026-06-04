import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { forkJoin } from 'rxjs';
import {
  ClassBookingDto,
  ClassesDto,
  FrontdeskApiService,
  InvoiceDto,
  MemberDto,
  MembershipDto,
  PaymentMethod,
  PtSessionDto,
  TrainerDto,
} from '../../services/frontdesk-api.service';
import { BranchDto, PlanDto } from '../../services/admin-api.service';

interface UpcomingClass {
  bookingId: number;
  category: string;
  categoryColor: string;
  name: string;
  trainer: string;
  room: string;
  date: string;
  rawDate: string;
  time: string;
  canCancel: boolean;
}

interface Invoice {
  id: string;
  invoiceId?: number;
  plan: string;
  date: string;
  amount: string;
  status: string;
}

interface KPIData {
  classesCount: number;
  chartData: number[];
}

@Component({
  selector: 'app-member-dashboard',
  templateUrl: './member-dashboard.component.html',
  styleUrls: ['./member-dashboard.component.css'],
  standalone: false,
})
export class MemberDashboardComponent implements OnInit {
  showAlert = true;
  currentUserName: string = 'Guest';
  isLoading = false;
  errorMessage = '';

  upcomingClasses: UpcomingClass[] = [];
  pastClasses: UpcomingClass[] = [];
  allBookings: UpcomingClass[] = [];
  showPastClasses = false;

  invoices: Invoice[] = [];

  membershipStatus = 'PENDING';
  currentPlan = 'Loading';
  planDescription = 'Loading membership details';
  renewalDate = '';
  daysRemaining = 0;
  daysRemainingProgress = 0;
  expirationDate = '';
  classesBooked = 0;
  upcomingCount = 0;
  trainerName = 'No trainer assigned';
  trainerInitials = 'NA';
  trainerColor = '#64748B';
  trainerSpecialties: string[] = [];
  trainerRating = 0;
  trainerCertifications: string[] = [];
  sessionsRemaining = 0;

  chartData: KPIData = {
    classesCount: 0,
    chartData: [0, 0, 0, 0],
  };

  private  currentMember: MemberDto | null = null;
  
  // Payment Modal State
  showPaymentModal = false;
  invoiceToPay: any = null;
  paymentAmount: number = 0;

  consentAlertText = 'You must complete your Health Consent and PAR-Q form to activate your membership and book classes.';

  constructor(
    private authService: AuthService,
    private frontdeskApi: FrontdeskApiService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const session = this.authService.getCurrentSession();
    if (session) {
      this.currentUserName = session.username;
    }
    this.loadMemberSummary();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  goToUpgrade(): void {
    this.router.navigate(['/plans'], { queryParams: { upgrade: 'true' } });
  }

  goToTrainers(): void {
    this.router.navigate(['/member/trainers']);
  }

  getMembershipStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return '#00D26A';
      case 'SUSPENDED':
        return '#F59E0B';
      case 'DUNNING':
        return '#EF4444';
      case 'DEACTIVATED':
        return '#6B7280';
      case 'PENDING':
        return '#3B82F6';
      default:
        return '#00D26A';
    }
  }

  loadMemberData(): void {
    this.showAlert = false;
  }



  toggleClasses(showPast: boolean): void {
    this.showPastClasses = showPast;
    this.upcomingClasses = this.allBookings.filter((b: UpcomingClass) => !this.isPast(b.rawDate));
    this.pastClasses = this.allBookings.filter((b: UpcomingClass) => this.isPast(b.rawDate));
  }

  private isPast(dateStr: string): boolean {
    if (!dateStr || dateStr === 'TBD') return false;
    const d = new Date(dateStr);
    d.setHours(23, 59, 59, 999);
    return d < new Date();
  }

  closeAlert(): void {
    this.showAlert = false;
  }

  openHealthForms(): void {
    this.router.navigate(['/health-forms']);
  }

  cancelBooking(booking: UpcomingClass): void {
    if (!confirm(`Are you sure you want to cancel your booking for ${booking.name}?`)) {
      return;
    }

    this.isLoading = true;
    this.frontdeskApi.cancelBooking(booking.bookingId).subscribe({
      next: () => {
        this.loadMemberSummary(); // Refresh data
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Cancellation failed. You may be within the 2-hour cutoff.';
        this.isLoading = false;
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'PAID':
        return '#F0FDF4';
      case 'PENDING':
        return '#FFFBEB';
      case 'FAILED':
        return '#FEF2F2';
      default:
        return '#F8F9FC';
    }
  }

  getStatusTextColor(status: string): string {
    switch (status) {
      case 'PAID':
        return '#14532D';
      case 'PENDING':
        return '#78350F';
      case 'FAILED':
        return '#7F1D1D';
      default:
        return '#0F172A';
    }
  }

  getBarHeight(value: number): string {
    return `${value}%`;
  }

  alternateRowColor(index: number): string {
    return index % 2 === 0 ? '#FFFFFF' : '#F8F9FC';
  }

  private loadMemberSummary(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.frontdeskApi.getCurrentMember().subscribe({
      next: (member) => {
        this.currentMember = member;
        const memberId = Number(member.memberId);
        this.frontdeskApi.getConsentStatus(memberId).subscribe({
          next: (status) => {
            this.showAlert = status.consentRequired;
            this.consentAlertText = status.requiresReconfirmation
              ? `Health consent must be re-confirmed for policy ${status.currentVersion}.`
              : 'Health consent is missing or expired. Please complete it to activate your membership and book classes.';
          },
        });
        this.loadMemberDetails(member, memberId);
      },
      error: (error) => {
        this.errorMessage =
          error?.error?.message || 'Unable to load member data from backend.';
        this.isLoading = false;
      },
    });
  }

  private applyMemberSummary(member: MemberDto): void {
    this.membershipStatus = member.status || 'ACTIVE';
    this.planDescription = `Member ID ${member.memberId || 'N/A'}`;
    this.renewalDate = 'N/A';
    this.daysRemaining = 0;
    this.daysRemainingProgress = 0;
    this.expirationDate = 'Not available';
  }

  private loadMemberDetails(member: MemberDto, memberId: number): void {
    forkJoin({
      memberships: this.frontdeskApi.getMembershipsByMember(memberId),
      invoices: this.frontdeskApi.getInvoicesByMember(memberId),
      bookings: this.frontdeskApi.getBookingsByMember(memberId),
      sessions: this.frontdeskApi.getPtSessionsByMember(memberId),
      classes: this.frontdeskApi.getClasses(),
      trainers: this.frontdeskApi.getTrainers(),
      branches: this.frontdeskApi.getBranches(),
      plans: this.frontdeskApi.getPlans(),
    }).subscribe({
      next: ({
        memberships,
        invoices,
        bookings,
        sessions,
        classes,
        trainers,
        branches,
        plans,
      }) => {
        this.applyMemberSummary(member);
        this.applyMembershipSummary(memberships, plans, branches, member);
        this.invoices = this.mapInvoices(invoices);
        this.allBookings = this.mapUpcomingClasses(
          bookings,
          classes,
          trainers,
          branches,
        );
        
        const mappedSessions = sessions
          .filter((s) => s.status !== 'CANCELLED' && s.status !== 'DECLINED')
          .map((s, index) => {
            const tName = s.trainerName || trainers.find(t => Number(t.trainerId) === Number(s.trainerId))?.trainerName || `Trainer #${s.trainerId}`;
            const scheduled = new Date(s.scheduledAt);
            const statusLabel = s.status === 'REQUESTED' ? ' (Pending)' : '';
            return {
              bookingId: s.sessionId || 0,
              category: 'PT',
              categoryColor: '#94A3B8',
              name: `Personal Training${statusLabel}`,
              trainer: tName,
              room: 'PT Area',
              date: this.formatShortDate(s.scheduledAt.split('T')[0]),
              rawDate: s.scheduledAt.split('T')[0],
              time: scheduled.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              canCancel: false,
              isPtSession: true
            };
          });

        this.allBookings = [...this.allBookings, ...mappedSessions].sort((a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime());
        this.upcomingClasses = this.allBookings.filter((b: UpcomingClass) => !this.isPast(b.rawDate)).slice(0, 5);
        this.pastClasses = this.allBookings.filter((b: UpcomingClass) => this.isPast(b.rawDate)).slice(0, 5);
        
        this.chartData = {
          classesCount: bookings.length,
          chartData: this.buildChartData(bookings),
        };
        this.classesBooked = bookings.length;
        this.upcomingCount = this.upcomingClasses.length;
        this.applyTrainerSummary(sessions, trainers, branches);
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage =
          error?.error?.message || 'Unable to load member dashboard data.';
        this.isLoading = false;
      },
    });
  }

  private applyMembershipSummary(
    memberships: MembershipDto[],
    plans: PlanDto[],
    branches: BranchDto[],
    member: MemberDto,
  ): void {
    const activeMembership =
      memberships.find((item) => item.status === 'ACTIVE') || memberships[0];
    if (!activeMembership) {
      this.currentPlan = 'No Active Plan';
      this.planDescription = `Member ID ${member.memberId || 'N/A'}`;
      this.membershipStatus = member.status || 'ACTIVE';
      return;
    }

    const plan = plans.find(
      (item) => Number(item.planId) === Number(activeMembership.planId),
    );
    const branchIdToUse = activeMembership.branchId || member.homeBranchId;
    const branch = branchIdToUse ? branches.find(
      (item) => Number(item.branchId) === Number(branchIdToUse),
    ) : null;
    
    this.membershipStatus =
      activeMembership.status || member.status || 'ACTIVE';
    this.currentPlan = plan?.planName || 'Active Membership';
    
    const branchText = branch ? branch.branchName : (branchIdToUse ? `Branch ${branchIdToUse}` : 'Global Access');
    
    this.planDescription = [
      plan ? `${plan.accessStart}-${plan.accessEnd} access` : 'Plan active',
      branchText
    ]
      .filter(Boolean)
      .join(' · ');

    if (activeMembership.startDate) {
      this.renewalDate = this.formatDate(activeMembership.startDate);
    }

    if (activeMembership.endDate) {
      const daysLeft = this.daysUntil(activeMembership.endDate);
      this.daysRemaining = daysLeft;
      
      // Attempt to calculate total days from start to end date for progress bar
      let totalDays = 30;
      if (activeMembership.startDate) {
        const start = new Date(activeMembership.startDate).getTime();
        const end = new Date(activeMembership.endDate).getTime();
        if (!Number.isNaN(start) && !Number.isNaN(end) && end > start) {
          totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        }
      }
      
      this.daysRemainingProgress = Math.max(
        0,
        Math.min(100, Math.round((daysLeft / Math.max(1, totalDays)) * 100)),
      );
      this.expirationDate =
        daysLeft > 0 ? `${daysLeft} days remaining` : 'Expired';
    } else {
      this.daysRemaining = 0;
      this.daysRemainingProgress = 0;
      this.expirationDate = 'No expiry date';
    }
  }

  private mapInvoices(invoices: InvoiceDto[]): Invoice[] {
    return [...invoices]
      .sort((left, right) => {
        const leftDate = left.createdAt
          ? new Date(left.createdAt).getTime()
          : 0;
        const rightDate = right.createdAt
          ? new Date(right.createdAt).getTime()
          : 0;
        return rightDate - leftDate;
      })
      .slice(0, 4)
      .map((invoice) => ({
        invoiceId: invoice.invoiceId,
        id: invoice.invoiceNumber || `INV-${invoice.invoiceId || ''}`,
        plan: invoice.membershipId
          ? `Membership #${invoice.membershipId}`
          : 'Membership Invoice',
        date: invoice.createdAt ? this.formatDate(invoice.createdAt) : 'N/A',
        amount: `₹${Number(invoice.finalAmount || 0).toLocaleString('en-IN')}`,
        status: invoice.status || 'PENDING',
      }));
  }

  getClassDateInCurrentWeek(weekdays: string): Date {
    const daysMap: { [key: string]: number } = {
      'mon': 1, 'tue': 2, 'wed': 3, 'thu': 4, 'fri': 5, 'sat': 6, 'sun': 0
    };
    
    const parts = weekdays.split(',');
    const firstDayStr = parts[0].toLowerCase().trim().slice(0, 3);
    const targetDayOfWeek = daysMap[firstDayStr] !== undefined ? daysMap[firstDayStr] : 1;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentDayOfWeek = today.getDay();
    
    let diff = targetDayOfWeek - currentDayOfWeek;
    if (diff < 0) {
      diff += 7;
    }
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + diff);
    return targetDate;
  }

  private formatDateLocal(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private mapUpcomingClasses(
    bookings: ClassBookingDto[],
    classes: ClassesDto[],
    trainers: TrainerDto[],
    branches: BranchDto[],
  ): UpcomingClass[] {
    const colorPalette = [
      '#0D9488',
      '#EA580C',
      '#DC2626',
      '#2563EB',
      '#7C3AED',
    ];

    return bookings
      .filter((booking) => booking.bookingStatus !== 'CANCELLED')
      .map((booking, index) => {
        const classItem = classes.find(
          (item) => Number(item.classId) === Number(booking.classId),
        );
        const trainer = classItem
          ? trainers.find(
              (item) => Number(item.trainerId) === Number(classItem.trainerId),
            )
          : null;
        const branch = classItem
          ? branches.find(
              (item) => Number(item.branchId) === Number(classItem.branchId),
            )
          : null;
        
        const scheduledDate = classItem
          ? (classItem.status === 'ACTIVE' && classItem.weekdays
              ? this.formatDateLocal(this.getClassDateInCurrentWeek(classItem.weekdays))
              : classItem.endDate || classItem.startDate || '')
          : '';

        return {
          bookingId: booking.bookingId || 0,
          category: classItem?.className?.split(' ')[0] || 'Class',
          categoryColor: colorPalette[index % colorPalette.length],
          name: classItem?.className || `Class #${booking.classId}`,
          trainer:
            trainer?.trainerName || `Trainer #${classItem?.trainerId || ''}`,
          room: `Room ${classItem?.roomId || '—'}`,
          date: scheduledDate ? this.formatShortDate(scheduledDate) : 'TBD',
          rawDate: scheduledDate || 'TBD',
          time: classItem?.classTime || 'TBD',
          canCancel: booking.bookingStatus === 'CONFIRMED',
        };
      });
  }

  private applyTrainerSummary(
    sessions: PtSessionDto[],
    trainers: TrainerDto[],
    branches: BranchDto[],
  ): void {
    const upcomingSession = [...sessions]
      .sort(
        (left, right) =>
          new Date(left.scheduledAt).getTime() -
          new Date(right.scheduledAt).getTime(),
      )
      .find((session) => session.status !== 'CANCELLED');

    if (!upcomingSession) {
      return;
    }

    const trainer = trainers.find(
      (item) => Number(item.trainerId) === Number(upcomingSession.trainerId),
    );
    if (trainer) {
      this.trainerName = trainer.trainerName;
      this.trainerInitials = this.getInitials(trainer.trainerName);
      this.trainerColor = this.getTrainerColor(trainer.trainerId || 0);
      this.trainerRating = Number(trainer.rating || this.trainerRating);
      this.trainerSpecialties = trainer.specialties
        ? trainer.specialties
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
        : this.trainerSpecialties;
      this.trainerCertifications = trainer.certifications
        ? trainer.certifications
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
        : this.trainerCertifications;
      this.sessionsRemaining = Math.max(
        0,
        10 -
          sessions.filter((session) => session.status !== 'CANCELLED').length,
      );
      const branch = branches.find(
        (item) => Number(item.branchId) === Number(trainer.branchId),
      );
      if (branch) {
        this.planDescription = `${this.planDescription} · ${branch.branchName}`;
      }
    }
  }

  private buildChartData(bookings: ClassBookingDto[]): number[] {
    const buckets = [0, 0, 0, 0];
    bookings.forEach((_, index) => {
      buckets[index % buckets.length] += 20;
    });
    return buckets.map((value) => Math.min(100, 20 + value));
  }

  private getInitials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  private getTrainerColor(trainerId: number): string {
    const palette = ['#7C3AED', '#0D9488', '#EA580C', '#2563EB', '#DC2626'];
    return palette[Math.abs(trainerId) % palette.length];
  }

  private daysUntil(value: string): number {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return 0;
    }
    return Math.max(
      0,
      Math.ceil((parsed.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    );
  }

  private formatShortDate(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return parsed.toLocaleDateString('en-US', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });
  }

  private formatDate(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return parsed.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  downloadInvoicePdf(invoice: Invoice): void {
    if (!invoice.invoiceId) {
      this.errorMessage = 'Invoice ID not available';
      return;
    }

    this.frontdeskApi.downloadInvoicePdf(invoice.invoiceId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${invoice.id}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.errorMessage = `Download failed: ${err.error?.message || 'Unknown error'}`;
      },
    });
  }

  downloadInvoiceCsv(invoice: Invoice): void {
    if (!invoice.invoiceId) {
      this.errorMessage = 'Invoice ID not available';
      return;
    }

    this.frontdeskApi.downloadInvoiceCsv(invoice.invoiceId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${invoice.id}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.errorMessage = `Download failed: ${err.error?.message || 'Unknown error'}`;
      },
    });
  }

  downloadAllInvoices(): void {
    if (this.invoices.length === 0) {
      this.errorMessage = 'No invoices to download';
      return;
    }

    // Download all as PDFs sequentially
    this.invoices.forEach((invoice, index) => {
      setTimeout(() => this.downloadInvoicePdf(invoice), index * 500);
    });
  }
  
  goToCheckout(): void {
    // Unify the payment flow: use the invoice payment modal for activation
    this.payInvoice();
  }

  payInvoice(invoiceToPay?: any): void {
    const pendingInvoice = invoiceToPay || this.invoices.find(inv => inv.status === 'ISSUED' || inv.status === 'PENDING' || inv.status === 'OVERDUE' || inv.status === 'UNPAID');
    if (!pendingInvoice || !pendingInvoice.invoiceId) {
      this.errorMessage = 'No pending invoice found to pay.';
      return;
    }
    this.invoiceToPay = pendingInvoice;
    this.paymentAmount = parseFloat(pendingInvoice.amount.replace(/[^0-9.-]+/g, '')) || 0;
    this.showPaymentModal = true;
  }

  payOutstandingBalance(): void {
    this.payInvoice();
  }

  cancelPaymentModal(): void {
    this.showPaymentModal = false;
    this.invoiceToPay = null;
  }

  confirmPaymentModal(): void {
    if (!this.invoiceToPay) return;
    
    const parsedAmount = this.paymentAmount;
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Invalid amount entered.');
      return;
    }

    const paymentDto = {
      invoiceId: this.invoiceToPay.invoiceId,
      memberId: this.currentMember?.memberId || 0,
      paymentMethod: 'CARD' as PaymentMethod,
      amountPaid: parsedAmount,
    };
    
    this.isLoading = true;
    this.showPaymentModal = false;
    this.frontdeskApi.processPayment(paymentDto).subscribe({
      next: () => {
        this.invoiceToPay = null;
        this.loadMemberSummary();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Payment failed.';
        this.invoiceToPay = null;
        this.isLoading = false;
      }
    });
  }
}
