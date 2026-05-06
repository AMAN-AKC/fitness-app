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
