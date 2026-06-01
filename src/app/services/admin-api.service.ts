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
  isLocked?: boolean;
  lastLogin?: string;
  branchName?: string;
}

export interface BranchDto {
  branchId?: number;
  branchName: string;
  address: string;
  contact: string;
  opHours: string;
  timezone: string;
  isActive?: boolean;
  activeMembersCount?: number;
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
  addonType: 'SERVICE' | 'FACILITY' | 'OTHER';
  taxPercent?: number;
  isActive?: boolean;
}

export interface PromoCodeDto {
  promoId?: number;
  code: string;
  discountType: 'PERCENT' | 'FLAT';
  discountValue: number;
  expiryDate: string;
  usageLimit: number;
  perMemberLimit?: number;
  eligibility?: 'ALL' | 'NEW' | 'RETURNING' | 'CORPORATE' | 'STUDENT';
  isActive?: boolean;
}

export interface AuditLogDto {
  auditId?: number;
  performedBy?: number;
  entityName?: string;
  entityId?: number;
  action?: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'OVERRIDE';
  oldValue?: string;
  newValue?: string;
  createdAt?: string;
  username?: string;
  entity?: string;
  timestamp?: string;
  performedByRole?: string; // Virtual/retrieved role
}

export interface FeatureFlagDto {
  flagId: number;
  flagName: string;
  enabled: boolean;
  lastModifiedBy: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminApiService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  // Existing methods ... (getUsers, getBranches, etc.)

  getFeatureFlags(): Observable<FeatureFlagDto[]> {
    return this.http.get<FeatureFlagDto[]>(`${this.baseUrl}/config/features`);
  }

  updateFeatureFlag(name: string, enabled: boolean): Observable<void> {
    const params = new HttpParams().set('enabled', enabled);
    return this.http.put<void>(
      `${this.baseUrl}/config/features/${name}/toggle`,
      {},
      { params },
    );
  }

  getSystemConfigs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/config/all`);
  }

  updateSystemConfigs(configs: { [key: string]: string }): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/config/update`, configs);
  }

  getConfigAuditLogs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/config/audit`);
  }

  getUsers(): Observable<SystemUserDto[]> {
    return this.http.get<SystemUserDto[]>(`${this.baseUrl}/users`);
  }

  updateUser(id: number, user: SystemUserDto): Observable<SystemUserDto> {
    return this.http.put<SystemUserDto>(`${this.baseUrl}/users/${id}`, user);
  }

  deactivateUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/users/${id}`);
  }

  lockUser(id: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/users/${id}/lock`, {});
  }

  unlockUser(id: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/users/${id}/unlock`, {});
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

  getFacilities(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/facilities`);
  }

  createFacility(facility: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/facilities`, facility);
  }

  updateFacility(facility: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/facilities/${facility.facilityId}`, facility);
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

  transferMember(
    memberId: number,
    targetBranchId: number,
    reason: string,
  ): Observable<void> {
    const params = new HttpParams()
      .set('memberId', memberId.toString())
      .set('targetBranchId', targetBranchId.toString())
      .set('reason', reason);
    return this.http.post<void>(
      `${this.baseUrl}/branches/transfer-member`,
      {},
      { params },
    );
  }

  getBranchInventory(branchId: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}/branches/${branchId}/inventory`,
    );
  }

  addBranchInventory(branchId: string, inventory: any): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/branches/${branchId}/inventory`,
      inventory,
    );
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

  deletePlan(id: number): Observable<void> {
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

  validatePromoCode(code: string, memberId?: number): Observable<PromoCodeDto> {
    let params = new HttpParams();
    if (memberId) {
      params = params.set('memberId', memberId.toString());
    }
    return this.http.get<PromoCodeDto>(
      `${this.baseUrl}/promo-codes/validate/${code}`,
      { params }
    );
  }

  deactivatePromoCode(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/promo-codes/${id}`);
  }

  getRevenueMTD(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/payments/revenue/mtd`);
  }
}
