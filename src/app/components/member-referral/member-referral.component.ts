import { Component, OnInit } from '@angular/core';
import { FrontdeskApiService, MemberDto } from '../../services/frontdesk-api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-member-referral',
  templateUrl: './member-referral.component.html',
  styleUrls: ['./member-referral.component.css']
})
export class MemberReferralComponent implements OnInit {
  currentMember: MemberDto | null = null;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  currencySymbol = '₹';

  constructor(private frontdeskApi: FrontdeskApiService, private router: Router) {}

  ngOnInit(): void {
    this.loadConfig();
    this.loadMemberInfo();
  }

  loadConfig(): void {
    this.frontdeskApi.getPublicConfigs().subscribe({
      next: (configs) => {
        if (configs['billing.currency']) {
          this.currencySymbol = configs['billing.currency'];
        }
      }
    });
  }

  loadMemberInfo(): void {
    this.isLoading = true;
    this.frontdeskApi.getCurrentMember().subscribe({
      next: (mem) => {
        this.currentMember = mem;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load referral data';
        this.isLoading = false;
        this.router.navigate(['/login']);
      }
    });
  }

  activateReferral(): void {
    if (!this.currentMember) return;
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.frontdeskApi.activateReferralCode(this.currentMember.memberId!).subscribe({
      next: (updatedMem) => {
        this.currentMember = updatedMem;
        this.successMessage = 'Referral Code successfully activated!';
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to activate referral code';
        this.isLoading = false;
      }
    });
  }
}
