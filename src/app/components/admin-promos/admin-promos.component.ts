import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin-promos',
  templateUrl: './admin-promos.component.html',
  styleUrls: ['./admin-promos.component.css']
})
export class AdminPromosComponent implements OnInit {
  apiUrl = environment.apiBaseUrl;
  promos: any[] = [];
  referralLeaders: any[] = [];
  isLoading = false;
  activeTab = 'PROMOS'; // or 'REFERRALS'

  newPromo = {
    code: '',
    discountType: 'PERCENT',
    discountValue: 0,
    expiryDate: '',
    usageLimit: 100,
    perMemberLimit: 1,
    eligibility: 'ALL'
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadPromos();
    this.loadMembers();
  }

  loadPromos(): void {
    this.isLoading = true;
    this.http.get<any[]>(`${this.apiUrl}/promo-codes`).subscribe({
      next: (data) => {
        this.promos = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  loadMembers(): void {
    this.http.get<any[]>(`${this.apiUrl}/members`).subscribe({
      next: (data) => {
        // Filter members who have a wallet balance > 0 and sort descending
        this.referralLeaders = data
          .filter(m => m.walletBalance > 0)
          .sort((a, b) => b.walletBalance - a.walletBalance);
      },
      error: (err) => {
        console.error('Failed to load members for referral leaderboard', err);
      }
    });
  }

  createPromo(): void {
    if (!this.newPromo.code || this.newPromo.discountValue <= 0) {
      alert('PLEASE FILL ALL REQUIRED FIELDS');
      return;
    }
    this.isLoading = true;
    this.http.post<any>(`${this.apiUrl}/promo-codes`, this.newPromo).subscribe({
      next: () => {
        alert('PROMO CODE CREATED SUCCESSFULLY');
        this.loadPromos();
        this.newPromo = {
          code: '',
          discountType: 'PERCENT',
          discountValue: 0,
          expiryDate: '',
          usageLimit: 100,
          perMemberLimit: 1,
          eligibility: 'ALL'
        };
      },
      error: (err) => {
        alert('ERROR CREATING PROMO: ' + err?.error?.message);
        this.isLoading = false;
      }
    });
  }

  deactivatePromo(promoId: number): void {
    this.http.delete(`${this.apiUrl}/promo-codes/${promoId}`).subscribe({
      next: () => {
        this.loadPromos();
      },
      error: () => {
        alert('FAILED TO DEACTIVATE PROMO');
      }
    });
  }

  exportCsv(): void {
    alert('CSV EXPORT FUNCTIONALITY INITIATED');
  }

  formatDate(dateObj: any): string {
    if (!dateObj) return '';
    if (Array.isArray(dateObj) && dateObj.length >= 3) {
      // pad months and days with leading zeros
      const month = dateObj[1].toString().padStart(2, '0');
      const day = dateObj[2].toString().padStart(2, '0');
      return `${dateObj[0]}-${month}-${day}`;
    }
    return dateObj.toString();
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
  }
}
