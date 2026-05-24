import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { BranchDto, PlanDto } from './admin-api.service';

export type MemberStatus = 'PROSPECT' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
export type ScanMethod = 'QR' | 'CARD' | 'MANUAL';
export type PaymentMethod = 'CASH' | 'UPI' | 'CARD';
export type PaymentStatus = 'SUCCESS' | 'FAILED' | 'PENDING' | 'REFUNDED';
export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'OVERDUE' | 'VOID';

export interface MemberDto {
  memberId?: number;
  memName: string;
  email: string;
  phone: string;
  dob: string;
  address: string;
  emgContact: string;
  emgPhone: string;
  referralCode?: string;
  corporateCode?: string;
  notes?: string;
  status?: MemberStatus;
  homeBranchId: number;
  photoPath?: string;
  ptSessionCredits?: number;
}

export interface AttendanceDto {
  logId?: number;
  memberId: number;
  branchId: number;
  checkInTime?: string;
  checkOutTime?: string;
  alertFlag?: boolean;
  scanMethod: ScanMethod;
  syncStatus?: 'SYNCED' | 'PENDING';
  classId?: number;
  overrideBy?: number;
  overrideReason?: string;
}

export interface HealthConsentDto {
  consentId?: number;
  memberId: number;
  formVersion: string;
  parqResponses?: string;
  medicalAcknowledged?: boolean;
  liabilityAcknowledged?: boolean;
  privacyAcknowledged?: boolean;
  acknowledgedAt?: string;
  expiresAt?: string;
  ipAddress?: string;
  status?: 'ACTIVE' | 'EXPIRED' | 'PENDING';
  staffNotes?: string;
  requiresReconfirmation?: boolean;
  consentRequired?: boolean;
}

export interface ConsentStatusDto {
  memberId: number;
  currentVersion: string;
  consentRequired: boolean;
  requiresReconfirmation: boolean;
  latestConsent?: HealthConsentDto | null;
}

export interface MembershipDto {
  memId?: number;
  memberId: number;
  planId: number;
  startDate?: string;
  endDate?: string;
  status?: 'ACTIVE' | 'EXPIRED' | 'PENDING' | 'DUNNING' | 'SUSPENDED';
  duration?: number;
  price?: number;
  discountAmount?: number;
  promoCodeUsed?: string;
  branchId: number;
}

export interface InvoiceDto {
  invoiceId?: number;
  invoiceNumber?: string;
  planName?: string;
  memberId: number;
  membershipId?: number;
  mrp?: number;
  taxes?: number;
  discount?: number;
  finalAmount?: number;
  promoCode?: string;
  paidAmount?: number;
  outstanding?: number;
  status?:
    | 'DRAFT'
    | 'ISSUED'
    | 'PAID'
    | 'PENDING'
    | 'FAILED'
    | 'OVERDUE'
    | 'VOID';
  createdAt?: string;
}

export interface ClassBookingDto {
  bookingId?: number;
  classId: number;
  memberId: number;
  bookingStatus?: 'CONFIRMED' | 'WAITLISTED' | 'CANCELLED' | 'NO_SHOW' | 'PENDING_CONFIRMATION';
  waitlistPosition?: number;
  cancelledAt?: string;
  overrideBy?: number;
  overrideReason?: string;
}

export interface ClassesDto {
  classId?: number;
  className: string;
  trainerId: number;
  roomId: number;
  branchId: number;
  startDate: string;
  endDate: string;
  weekdays: string;
  classTime: string;
  durationMins: number;
  capacity: number;
  prerequisites?: string;
  planEligibility?: string;
  status?: 'ACTIVE' | 'CANCELLED' | 'COMPLETED';
  cancelReason?: string;
}

export interface TrainerDto {
  trainerId?: number;
  userId: number;
  trainerName: string;
  bio?: string;
  certifications?: string;
  specialties?: string;
  rating?: number;
  branchId: number;
  isActive?: boolean;
  acceptingPtClients?: boolean;
  availability?: string;
}

export interface PtSessionDto {
  sessionId?: number;
  memberId: number;
  trainerId: number;
  memberName?: string;
  trainerName?: string;
  scheduledAt: string;
  durationMins: number;
  status?: 'REQUESTED' | 'APPROVED' | 'ACCEPTED' | 'REJECTED' | 'DECLINED' | 'COMPLETED' | 'CANCELLED';
  trainerNotes?: string;
}

export interface PaymentDto {
  paymentId?: number;
  invoiceId: number;
  memberId: number;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  status?: PaymentStatus;
  gatewayReference?: string;
  failureReason?: string;
  createdAt?: string;
  transactionId?: string;
}

export interface ReceiptDto {
  receiptId?: number;
  paymentId: number;
  invoiceId: number;
  memberId: number;
  amount: number;
  receiptNumber?: string;
  createdAt?: string;
}

export interface DunningItemDto {
  invoiceId: number;
  memberId: number;
  memberName: string;
  amount: number;
  daysOverdue: number;
  attemptCount: number;
  lastAttempt?: string;
  status: 'PENDING' | 'OVERDUE' | 'DUNNING';
}

export interface PriceBreakdownDto {
  planId: number;
  planName: string;
  durationDays: number;
  basePrice: number;
  discount: number;
  priceAfterDiscount: number;
  taxPercent: number;
  taxAmount: number;
  finalAmount: number;
  proration?: {
    currentPlanName: string;
    remainingDays: number;
    remainingValue: number;
    creditApplied: number;
  };
  type: 'NEW_PLAN' | 'UPGRADE';
}

@Injectable({
  providedIn: 'root',
})
export class FrontdeskApiService {
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly OFFLINE_KEY = 'fitness_offline_attendance';

  constructor(private http: HttpClient) {}

  // AC06: Client-side offline queue
  getOfflineQueue(): AttendanceDto[] {
    const data = localStorage.getItem(this.OFFLINE_KEY);
    return data ? JSON.parse(data) : [];
  }

  saveToOfflineQueue(attendance: AttendanceDto): void {
    const queue = this.getOfflineQueue();
    queue.push({ ...attendance, syncStatus: 'PENDING', checkInTime: new Date().toISOString() });
    localStorage.setItem(this.OFFLINE_KEY, JSON.stringify(queue));
  }

  clearOfflineQueue(): void {
    localStorage.removeItem(this.OFFLINE_KEY);
  }

  getMembers(): Observable<MemberDto[]> {
    return this.http.get<MemberDto[]>(`${this.baseUrl}/members`);
  }

  getMembersByBranch(branchId: number): Observable<MemberDto[]> {
    return this.http.get<MemberDto[]>(
      `${this.baseUrl}/members/branch/${branchId}`,
    );
  }

  getCurrentMember(): Observable<MemberDto> {
    return this.http.get<MemberDto>(`${this.baseUrl}/consents/me/member`);
  }

  getMemberById(memberId: number): Observable<MemberDto> {
    return this.http.get<MemberDto>(`${this.baseUrl}/members/${memberId}`);
  }

  createMember(member: MemberDto): Observable<MemberDto> {
    return this.http.post<MemberDto>(`${this.baseUrl}/members`, member);
  }

  uploadMemberPhoto(memberId: number, file: File): Observable<MemberDto> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<MemberDto>(
      `${this.baseUrl}/members/${memberId}/photo`,
      formData,
    );
  }

  bulkUploadMembers(file: File): Observable<any[]> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any[]>(
      `${this.baseUrl}/members/bulk-upload`,
      formData,
    );
  }

  createMembership(membership: MembershipDto): Observable<MembershipDto> {
    return this.http.post<MembershipDto>(
      `${this.baseUrl}/memberships`,
      membership,
    );
  }

  getBranches(): Observable<BranchDto[]> {
    return this.http.get<BranchDto[]>(`${this.baseUrl}/branches`);
  }

  getPlans(): Observable<PlanDto[]> {
    return this.http.get<PlanDto[]>(`${this.baseUrl}/plans`);
  }

  getMembershipsByMember(memberId: number): Observable<MembershipDto[]> {
    return this.http.get<MembershipDto[]>(
      `${this.baseUrl}/memberships/member/${memberId}`,
    );
  }

  suspendMembership(id: number, months: number | null, reason: string): Observable<MembershipDto> {
    let url = `${this.baseUrl}/memberships/${id}/suspend?reason=${encodeURIComponent(reason)}`;
    if (months !== null) {
      url += `&months=${months}`;
    }
    return this.http.patch<MembershipDto>(url, {});
  }

  deactivateMembership(id: number, reason: string): Observable<MembershipDto> {
    const url = `${this.baseUrl}/memberships/${id}/deactivate?reason=${encodeURIComponent(reason)}`;
    return this.http.patch<MembershipDto>(url, {});
  }

  reactivateMembership(id: number): Observable<MembershipDto> {
    return this.http.patch<MembershipDto>(`${this.baseUrl}/memberships/${id}/reactivate`, {});
  }

  getInvoicesByMember(memberId: number): Observable<InvoiceDto[]> {
    return this.http.get<InvoiceDto[]>(
      `${this.baseUrl}/invoices/member/${memberId}`,
    );
  }

  getBookingsByMember(memberId: number): Observable<ClassBookingDto[]> {
    return this.http.get<ClassBookingDto[]>(
      `${this.baseUrl}/bookings/member/${memberId}`,
    );
  }

  getBookingsByClass(classId: number): Observable<ClassBookingDto[]> {
    return this.http.get<ClassBookingDto[]>(
      `${this.baseUrl}/bookings/class/${classId}`,
    );
  }

  bookClass(booking: ClassBookingDto): Observable<ClassBookingDto> {
    return this.http.post<ClassBookingDto>(
      `${this.baseUrl}/bookings`,
      booking,
    );
  }

  cancelBooking(bookingId: number): Observable<void> {
    return this.http.patch<void>(
      `${this.baseUrl}/bookings/${bookingId}/cancel`,
      {},
    );
  }

  acceptWaitlistPromotion(bookingId: number): Observable<ClassBookingDto> {
    return this.http.patch<ClassBookingDto>(
      `${this.baseUrl}/bookings/${bookingId}/accept-promotion`,
      {}
    );
  }

  reschedulePtSession(id: number, newScheduledAt: string): Observable<PtSessionDto> {
    return this.http.patch<PtSessionDto>(
      `${this.baseUrl}/pt-sessions/${id}/reschedule?newScheduledAt=${encodeURIComponent(newScheduledAt)}`,
      {}
    );
  }

  cancelPtSession(id: number): Observable<PtSessionDto> {
    return this.http.patch<PtSessionDto>(
      `${this.baseUrl}/pt-sessions/${id}/cancel`,
      {}
    );
  }

  requestPtSession(session: PtSessionDto): Observable<PtSessionDto> {
    return this.http.post<PtSessionDto>(`${this.baseUrl}/pt-sessions`, session);
  }

  getClasses(): Observable<ClassesDto[]> {
    return this.http.get<ClassesDto[]>(`${this.baseUrl}/classes`);
  }

  getTrainers(): Observable<TrainerDto[]> {
    return this.http.get<TrainerDto[]>(`${this.baseUrl}/trainers`);
  }

  getTrainerById(trainerId: number): Observable<TrainerDto> {
    return this.http.get<TrainerDto>(`${this.baseUrl}/trainers/${trainerId}`);
  }

  getPtSessionsByMember(memberId: number): Observable<PtSessionDto[]> {
    return this.http.get<PtSessionDto[]>(
      `${this.baseUrl}/pt-sessions/member/${memberId}`,
    );
  }

  // Notifications
  getNotifications(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/notifications/user/${userId}`);
  }

  markNotificationAsRead(id: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/notifications/${id}/read`, {});
  }

  checkIn(attendance: AttendanceDto): Observable<AttendanceDto> {
    return this.http.post<AttendanceDto>(
      `${this.baseUrl}/attendance/checkin`,
      attendance,
    );
  }

  getTodayAttendance(branchId: number): Observable<AttendanceDto[]> {
    return this.http.get<AttendanceDto[]>(
      `${this.baseUrl}/attendance/branch/${branchId}/today`,
    );
  }

  // AC09: Override check-in
  overrideCheckIn(
    attendance: AttendanceDto,
    overrideByUserId: number,
    reason: string,
  ): Observable<AttendanceDto> {
    return this.http.post<AttendanceDto>(
      `${this.baseUrl}/attendance/checkin/override`,
      attendance,
      { params: { overrideByUserId, reason } },
    );
  }

  // AC08: Trainer marks attendance from class roster
  markClassAttendance(
    classId: number,
    memberId: number,
    branchId: number,
  ): Observable<AttendanceDto> {
    return this.http.post<AttendanceDto>(
      `${this.baseUrl}/attendance/class/${classId}/mark`,
      {},
      { params: { memberId, branchId } },
    );
  }

  // AC05: Member check-in flags (dues, health notes)
  getMemberCheckInFlags(memberId: number): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/attendance/member/${memberId}/flags`,
    );
  }

  getConsentPolicy(): Observable<{
    currentVersion: string;
    validityDays: number;
    retentionDays: number;
  }> {
    return this.http.get<{
      currentVersion: string;
      validityDays: number;
      retentionDays: number;
    }>(`${this.baseUrl}/consents/policy`);
  }

  submitConsent(consent: HealthConsentDto): Observable<HealthConsentDto> {
    return this.http.post<HealthConsentDto>(`${this.baseUrl}/consents`, consent);
  }

  getConsentHistory(memberId: number): Observable<HealthConsentDto[]> {
    return this.http.get<HealthConsentDto[]>(
      `${this.baseUrl}/consents/member/${memberId}`,
    );
  }

  getConsentStatus(memberId: number): Observable<ConsentStatusDto> {
    return this.http.get<ConsentStatusDto>(
      `${this.baseUrl}/consents/member/${memberId}/status`,
    );
  }

  downloadConsentHistory(memberId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/consents/member/${memberId}/download`, {
      responseType: 'blob',
    });
  }

  addAdministrativeNote(
    consentId: number,
    note: string,
  ): Observable<HealthConsentDto> {
    return this.http.post<HealthConsentDto>(
      `${this.baseUrl}/consents/${consentId}/notes`,
      {},
      { params: { note } },
    );
  }

  // AC07: Export daily attendance CSV
  exportDailyAttendanceCsv(branchId: number): Observable<Blob> {
    return this.http.get(
      `${this.baseUrl}/attendance/branch/${branchId}/today/csv`,
      { responseType: 'blob' },
    );
  }

  // AC06: Offline check-in queue
  offlineCheckIn(attendance: AttendanceDto): Observable<AttendanceDto> {
    return this.http.post<AttendanceDto>(
      `${this.baseUrl}/attendance/checkin/offline`,
      attendance,
    );
  }

  // AC06: Sync pending check-ins
  syncPendingCheckIns(): Observable<AttendanceDto[]> {
    return this.http.post<AttendanceDto[]>(
      `${this.baseUrl}/attendance/sync`,
      {},
    );
  }



  // Payment and Billing APIs
  processPayment(payment: PaymentDto): Observable<PaymentDto> {
    return this.http.post<PaymentDto>(`${this.baseUrl}/payments`, payment);
  }

  getPaymentsByMember(memberId: number): Observable<PaymentDto[]> {
    return this.http.get<PaymentDto[]>(
      `${this.baseUrl}/payments/member/${memberId}`,
    );
  }

  getFailedPayments(): Observable<PaymentDto[]> {
    return this.http.get<PaymentDto[]>(`${this.baseUrl}/payments/failed`);
  }

  refundPayment(
    paymentId: number,
    refundBy: number,
    reason: string,
  ): Observable<PaymentDto> {
    return this.http.patch<PaymentDto>(
      `${this.baseUrl}/payments/${paymentId}/refund`,
      {},
      { params: { refundBy, reason } },
    );
  }

  // Invoice APIs
  createInvoice(invoice: InvoiceDto): Observable<InvoiceDto> {
    return this.http.post<InvoiceDto>(`${this.baseUrl}/invoices`, invoice);
  }

  getInvoiceById(invoiceId: number): Observable<InvoiceDto> {
    return this.http.get<InvoiceDto>(`${this.baseUrl}/invoices/${invoiceId}`);
  }

  downloadInvoicePdf(invoiceId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/invoices/${invoiceId}/pdf`, {
      responseType: 'blob',
    });
  }

  downloadInvoiceCsv(invoiceId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/invoices/${invoiceId}/csv`, {
      responseType: 'blob',
    });
  }

  voidInvoice(invoiceId: number): Observable<InvoiceDto> {
    return this.http.patch<InvoiceDto>(
      `${this.baseUrl}/invoices/${invoiceId}/void`,
      {},
    );
  }

  // Receipt APIs
  getReceipt(receiptId: number): Observable<ReceiptDto> {
    return this.http.get<ReceiptDto>(`${this.baseUrl}/receipts/${receiptId}`);
  }

  // Dunning APIs
  getFailedInvoices(): Observable<InvoiceDto[]> {
    return this.http.get<InvoiceDto[]>(`${this.baseUrl}/dunning-queue`);
  }

  // Pricing APIs (AC01, AC06)
  getPlanBreakdown(
    planId: number,
    discountAmount?: number,
  ): Observable<PriceBreakdownDto> {
    let url = `${this.baseUrl}/pricing/plan/${planId}/breakdown`;
    if (discountAmount) {
      url += `?discountAmount=${discountAmount}`;
    }
    return this.http.get<PriceBreakdownDto>(url);
  }

  getUpgradeBreakdown(
    memberId: number,
    planId: number,
    discountAmount?: number,
  ): Observable<PriceBreakdownDto> {
    let url = `${this.baseUrl}/pricing/member/${memberId}/upgrade/${planId}`;
    if (discountAmount) {
      url += `?discountAmount=${discountAmount}`;
    }
    return this.http.get<PriceBreakdownDto>(url);
  }

  getTrainerByUserId(userId: number): Observable<TrainerDto> {
    return this.http.get<TrainerDto>(`${this.baseUrl}/trainers/user/${userId}`);
  }

  getClassesByTrainer(trainerId: number): Observable<ClassesDto[]> {
    return this.http.get<ClassesDto[]>(`${this.baseUrl}/classes/trainer/${trainerId}`);
  }

  getPtSessionsByTrainer(trainerId: number): Observable<PtSessionDto[]> {
    return this.http.get<PtSessionDto[]>(`${this.baseUrl}/pt-sessions/trainer/${trainerId}`);
  }

  updatePtSessionStatus(id: number, status: string, notes?: string): Observable<PtSessionDto> {
    let url = `${this.baseUrl}/pt-sessions/${id}/status?status=${status}`;
    if (notes) {
      url += `&notes=${encodeURIComponent(notes)}`;
    }
    return this.http.patch<PtSessionDto>(url, {});
  }

  getRooms(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/facilities`);
  }

  updateTrainer(id: number, dto: TrainerDto): Observable<TrainerDto> {
    return this.http.put<TrainerDto>(`${this.baseUrl}/trainers/${id}`, dto);
  }

  markNoShow(bookingId: number): Observable<ClassBookingDto> {
    return this.http.patch<ClassBookingDto>(`${this.baseUrl}/bookings/${bookingId}/no-show`, {});
  }

  cancelClassBooking(bookingId: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/bookings/${bookingId}/cancel`, {});
  }


}
