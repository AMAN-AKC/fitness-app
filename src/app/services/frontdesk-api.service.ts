import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { BranchDto, PlanDto } from './admin-api.service';

export type MemberStatus = 'PROSPECT' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
export type ScanMethod = 'QR' | 'CARD' | 'MANUAL';

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
  memberId: number;
  membershipId?: number;
  finalAmount?: number;
  paidAmount?: number;
  outstanding?: number;
  status?: 'PAID' | 'PENDING' | 'FAILED' | 'OVERDUE';
  createdAt?: string;
}

export interface ClassBookingDto {
  bookingId?: number;
  classId: number;
  memberId: number;
  bookingStatus?: 'CONFIRMED' | 'WAITLISTED' | 'CANCELLED';
  waitlistPosition?: number;
  cancelledAt?: string;
  overrideBy?: number;
  overrideReason?: string;
}

export interface ClassesDto {
  classId?: number;
  classesName: string;
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
}

export interface PtSessionDto {
  sessionId?: number;
  memberId: number;
  trainerId: number;
  scheduledAt: string;
  durationMins: number;
  status?: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
  trainerNotes?: string;
}

@Injectable({
  providedIn: 'root',
})
export class FrontdeskApiService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getMembers(): Observable<MemberDto[]> {
    return this.http.get<MemberDto[]>(`${this.baseUrl}/members`);
  }

  getMembersByBranch(branchId: number): Observable<MemberDto[]> {
    return this.http.get<MemberDto[]>(
      `${this.baseUrl}/members/branch/${branchId}`,
    );
  }

  createMember(member: MemberDto): Observable<MemberDto> {
    return this.http.post<MemberDto>(`${this.baseUrl}/members`, member);
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
}
