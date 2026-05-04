import { Component, OnInit } from '@angular/core';

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
})
export class PlansCatalogComponent implements OnInit {
  plans: Plan[] = [];

  constructor() {}

  ngOnInit(): void {
    this.initializePlans();
  }

  initializePlans(): void {
    this.plans = [
      {
        id: '1',
        name: 'Basic',
        duration: 1,
        price: 999,
        description: 'Perfect for getting started',
        features: [
          'Gym access',
          'Basic classes',
          '5 guest passes',
          'Mobile app',
        ],
        popular: false,
      },
      {
        id: '2',
        name: 'Premium',
        duration: 3,
        price: 2499,
        description: 'Most popular plan',
        features: [
          'Unlimited gym access',
          'All classes',
          'Personal trainer consultation',
          'Health tracking',
          'Priority booking',
        ],
        popular: true,
      },
      {
        id: '3',
        name: 'Elite',
        duration: 12,
        price: 7999,
        description: 'Complete fitness experience',
        features: [
          'Unlimited everything',
          'Dedicated trainer',
          'Nutrition plan',
          'Recovery services',
          'VIP lounge access',
          '24/7 support',
        ],
        popular: false,
      },
    ];
  }

  selectPlan(plan: Plan): void {
    console.log('Selected plan:', plan.name);
  }

  formatPrice(price: number): string {
    return '₹' + price.toLocaleString('en-IN');
  }
}
