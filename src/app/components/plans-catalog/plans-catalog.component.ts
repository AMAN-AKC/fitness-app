import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FrontdeskApiService } from '../../services/frontdesk-api.service';
import { PlanDto } from '../../services/admin-api.service';

export interface Plan {
  id: string;
  name: string;
  durationDays: number;
  price: number;
  description: string;
  features: string[];
  popular: boolean;
  taxPercent?: number;
  prorationType?: string;
}

@Component({
  selector: 'app-plans-catalog',
  templateUrl: './plans-catalog.component.html',
  styleUrls: ['./plans-catalog.component.css'],
  standalone: false
})
export class PlansCatalogComponent implements OnInit {
  plans: Plan[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(
    private frontdeskApi: FrontdeskApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initializePlans();
  }

  initializePlans(): void {
    this.isLoading = true;
    this.frontdeskApi.getPlans().subscribe({
      next: (plansDto) => {
        this.plans = plansDto.map(p => ({
          id: p.planId?.toString() || '',
          name: p.planName,
          durationDays: p.durationDays,
          price: p.price,
          description: `Access from ${p.accessStart} to ${p.accessEnd}`,
          features: [
            p.eligibilityType === 'GENERAL' ? 'All members' : p.eligibilityType,
            `${p.durationDays} days access`,
            p.prorationRule ? `Proration: ${p.prorationRule}` : 'Standard billing'
          ],
          popular: p.price > 1000 && p.price < 5000,
          taxPercent: p.taxPercent || 0,
          prorationType: p.prorationRule || 'Standard'
        }));
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to load plans.';
        this.isLoading = false;
      }
    });
  }

  selectPlan(plan: Plan): void {
    const isUpgrade = this.route.snapshot.queryParams['upgrade'] === 'true';
    this.router.navigate(['/member/checkout'], { 
      queryParams: { 
        planId: plan.id,
        upgrade: isUpgrade ? 'true' : undefined
      } 
    });
  }

  formatPrice(price: number): string {
    return '₹' + price.toLocaleString('en-IN');
  }
}
