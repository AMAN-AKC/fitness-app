import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ManagerDashboardDto {
  activeMembers: number;
  newJoinsThisMonth: number;
  newJoinsTrend: number;
  churnThisMonth: number;
  churnTrend: number;
  monthlyRevenue: number;
  classesThisWeek: number;
  avgClassOccupancy: number;
  revenueAnalytics: RevenuePoint[];
  topClasses: ClassUtilizationDto[];
  dunningQueue: DunningMemberDto[];
}

export interface RevenuePoint {
  month: string;
  revenue: number;
  newJoins: number;
  churn: number;
}

export interface ClassUtilizationDto {
  classId: number;
  name: string;
  occupancy: number;
  fill: string;
}

export interface DunningMemberDto {
  invoiceId: number;
  name: string;
  email: string;
  outstandingAmount: number;
  daysOverdue: number;
  retryDate: string;
  status: string;
}

@Injectable({
  providedIn: 'root',
})
export class ManagerApiService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getDashboardStats(): Observable<ManagerDashboardDto> {
    return this.http.get<ManagerDashboardDto>(`${this.baseUrl}/manager/dashboard/stats`);
  }

  getClasses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/classes`);
  }

  getBookingsByClass(classId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/bookings/class/${classId}`);
  }

  createClass(cls: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/classes`, cls);
  }

  updateClass(id: number, cls: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/classes/${id}`, cls);
  }

  cancelClass(id: number, reason: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/classes/${id}/cancel`, {}, { params: { reason } });
  }

  substituteTrainer(classId: number, trainerId: number, reason: string): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/classes/${classId}/substitute`, {}, { params: { newTrainerId: trainerId, reason } });
  }

  getTrainers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/trainers`);
  }

  getRooms(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/facilities`);
  }

  exportClassesCsv(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/classes/export`, { responseType: 'blob' });
  }

  importClassesCsv(file: File): Observable<any[]> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any[]>(`${this.baseUrl}/classes/import`, formData);
  }

  // Dunning Management Endpoints
  getOverdueInvoices(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/dunning/overdue-invoices`);
  }

  getDunningMemberships(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/dunning/dunning-memberships`);
  }

  resolveDunning(membershipId: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/dunning/resolve/${membershipId}`, {});
  }

  suspendDunning(membershipId: number, reason: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/dunning/suspend/${membershipId}?reason=${encodeURIComponent(reason)}`, {});
  }
}
