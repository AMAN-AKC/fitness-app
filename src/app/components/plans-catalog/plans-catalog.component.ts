import { Component, OnInit } from '@angular/core';
import { FrontdeskApiService } from '../../services/frontdesk-api.service';
import { PlanDto } from '../../services/admin-api.service';

export interface Plan {
  id: string;
  name: string;
  duration: number;
  price: number;
  description: string;
  features: string[];
  popular: boolean;
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

  constructor(private frontdeskApi: FrontdeskApiService) {}

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
          duration: p.durationDays,
          price: p.price,
          description: `Access from ${p.accessStart} to ${p.accessEnd}`,
          features: [
            p.eligibilityType === 'GENERAL' ? 'All members' : p.eligibilityType,
            `${p.durationDays} days access`,
            p.prorationRule ? `Proration: ${p.prorationRule}` : 'Standard billing'
          ],
          popular: p.price > 1000 && p.price < 5000 // Just a visual heuristic
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
    console.log('Selected plan:', plan.name);
    // TODO: Navigate to checkout with plan.id
  }

  formatPrice(price: number): string {
    return '₹' + price.toLocaleString('en-IN');
  }
}
