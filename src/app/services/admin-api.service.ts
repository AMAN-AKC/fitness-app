import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type BackendRole =
  | 'MEMBER'
  | 'FRONT_DESK'
  | 'TRAINER'
  | 'MANAGER'
  | 'ADMIN';

export type BackendEligibility = 'GENERAL' | 'STUDENT' | 'SENIOR' | 'CORPORATE';

export interface SystemUserDto {
  userId?: number;
  username: string;
  email: string;
  role: BackendRole;
  isActive?: boolean;
}

export interface BranchDto {
  branchId?: number;
  branchName: string;
  address: string;
  contact: string;
  opHours: string;
  timezone: string;
  isActive?: boolean;
}

export interface PlanDto {
  planId?: number;
  planName: string;
  durationDays: number;
  price: number;
  accessStart: string;
  accessEnd: string;
  eligibilityType: BackendEligibility;
  prorationRule?: string;
  taxPercent?: number;
  version?: number;
  effectiveFrom: string;
  branchVisibility?: string;
  isActive?: boolean;
}

export interface AddOnDto {
  addonId?: number;
  addonName: string;
  price: number;
  capacity?: number;
  addonType: 'LOCKER' | 'PT_SESSIONS' | 'GUEST_PASS' | 'TOWEL' | 'OTHER';
  taxPercent?: number;
  isActive?: boolean;
}

export interface PromoCodeDto {
  promoId?: number;
  code: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  expiryDate: string;
  usageLimit: number;
  perMemberLimit?: number;
  eligibility?: 'ALL' | 'NEW' | 'RETURNING';
  isActive?: boolean;
}

export interface AuditLogDto {
  id?: number;
  username?: string;
  entity?: string;
  action?: string;
  timestamp?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminApiService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<SystemUserDto[]> {
    return this.http.get<SystemUserDto[]>(`${this.baseUrl}/users`);
  }

  updateUser(id: number, user: SystemUserDto): Observable<SystemUserDto> {
    return this.http.put<SystemUserDto>(`${this.baseUrl}/users/${id}`, user);
  }

  deactivateUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/users/${id}`);
  }

  createUser(user: SystemUserDto, password: string): Observable<SystemUserDto> {
    const params = new HttpParams().set('password', password);
    return this.http.post<SystemUserDto>(`${this.baseUrl}/users`, user, {
      params,
    });
  }

  getBranches(): Observable<BranchDto[]> {
    return this.http.get<BranchDto[]>(`${this.baseUrl}/branches`);
  }

  createBranch(branch: BranchDto): Observable<BranchDto> {
    return this.http.post<BranchDto>(`${this.baseUrl}/branches`, branch);
  }

  updateBranch(id: number, branch: BranchDto): Observable<BranchDto> {
    return this.http.put<BranchDto>(`${this.baseUrl}/branches/${id}`, branch);
  }

  deactivateBranch(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/branches/${id}`);
  }

  getPlans(): Observable<PlanDto[]> {
    return this.http.get<PlanDto[]>(`${this.baseUrl}/plans`);
  }

  createPlan(plan: PlanDto): Observable<PlanDto> {
    return this.http.post<PlanDto>(`${this.baseUrl}/plans`, plan);
  }

  updatePlan(id: number, plan: PlanDto): Observable<PlanDto> {
    return this.http.put<PlanDto>(`${this.baseUrl}/plans/${id}`, plan);
  }

  deactivatePlan(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/plans/${id}`);
  }

  getAuditLogs(): Observable<AuditLogDto[]> {
    return this.http.get<AuditLogDto[]>(`${this.baseUrl}/audit-logs`);
  }

  // Add-On APIs
  getAddOns(): Observable<AddOnDto[]> {
    return this.http.get<AddOnDto[]>(`${this.baseUrl}/addons`);
  }

  createAddOn(addon: AddOnDto): Observable<AddOnDto> {
    return this.http.post<AddOnDto>(`${this.baseUrl}/addons`, addon);
  }

  updateAddOn(id: number, addon: AddOnDto): Observable<AddOnDto> {
    return this.http.put<AddOnDto>(`${this.baseUrl}/addons/${id}`, addon);
  }

  deactivateAddOn(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/addons/${id}`);
  }

  // Promo Code APIs
  getPromoCodes(): Observable<PromoCodeDto[]> {
    return this.http.get<PromoCodeDto[]>(`${this.baseUrl}/promo-codes`);
  }

  createPromoCode(promo: PromoCodeDto): Observable<PromoCodeDto> {
    return this.http.post<PromoCodeDto>(`${this.baseUrl}/promo-codes`, promo);
  }

  validatePromoCode(code: string): Observable<PromoCodeDto> {
    return this.http.get<PromoCodeDto>(`${this.baseUrl}/promo-codes/validate/${code}`);
  }

  deactivatePromoCode(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/promo-codes/${id}`);
  }
}
