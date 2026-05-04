import { Component, OnInit } from '@angular/core';

export type EligibilityType = 'General' | 'Student' | 'Senior' | 'Corporate';
export type PlanStatus = 'Active' | 'Inactive' | 'All';

export interface Facility {
  name: string;
  included: boolean;
}

export interface Plan {
  id: string;
  name: string;
  duration: number; // in days
  price: number;
  eligibility: EligibilityType;
  version: string;
  effectiveFrom: string;
  branches: 'All' | number;
  status: boolean;
  facilities: Facility[];
  addons: string[];
  tax: number;
  proration: string;
  activeMembers: number;
}

@Component({
  selector: 'app-admin-plancatalog',
  templateUrl: './admin-plancatalog.component.html',
  styleUrls: ['./admin-plancatalog.component.css'],
})
export class AdminPlancatalogComponent implements OnInit {
  plans: Plan[] = [];
  filteredPlans: Plan[] = [];
  searchQuery = '';
  eligibilityFilter: string | EligibilityType = 'All';
  statusFilter: PlanStatus = 'All';

  expandedRows = new Set<string>();
  isDrawerOpen = false;
  editingPlan: Plan | null = null;
  deactivatingPlan: Plan | null = null;

  eligibilityColors: Record<EligibilityType, string> = {
    General: 'bg-[#EFF5FF] text-[#2563EB] border-[#2563EB]/20',
    Student: 'bg-[#FAF5FF] text-[#9333EA] border-[#9333EA]/20',
    Senior: 'bg-[#F0FDF4] text-[#16A34A] border-[#16A34A]/20',
    Corporate: 'bg-[#F0FDFA] text-[#0D9488] border-[#0D9488]/20',
  };

  constructor() {}

  ngOnInit(): void {
    this.initializePlans();
    this.filterPlans();
  }

  initializePlans(): void {
    this.plans = [
      {
        id: '1',
        name: 'Gold Annual',
        duration: 365,
        price: 14999,
        eligibility: 'General',
        version: 'v2.1',
        effectiveFrom: '01 Jan 2025',
        branches: 'All',
        status: true,
        activeMembers: 42,
        facilities: [
          { name: 'Gym Floor', included: true },
          { name: 'Pool', included: true },
          { name: 'Classes', included: true },
          { name: 'Steam Room', included: true },
        ],
        addons: ['Locker', 'PT Package'],
        tax: 18,
        proration: 'Daily',
      },
      {
        id: '2',
        name: 'Student Flex',
        duration: 30,
        price: 1999,
        eligibility: 'Student',
        version: 'v1.4',
        effectiveFrom: '15 Feb 2025',
        branches: 3,
        status: true,
        activeMembers: 128,
        facilities: [
          { name: 'Gym Floor', included: true },
          { name: 'Pool', included: false },
          { name: 'Classes', included: false },
          { name: 'Steam Room', included: false },
        ],
        addons: [],
        tax: 18,
        proration: 'Weekly',
      },
      {
        id: '3',
        name: 'Senior Wellness',
        duration: 90,
        price: 4500,
        eligibility: 'Senior',
        version: 'v1.0',
        effectiveFrom: '01 Mar 2025',
        branches: 'All',
        status: true,
        activeMembers: 56,
        facilities: [
          { name: 'Gym Floor', included: true },
          { name: 'Pool', included: true },
          { name: 'Classes', included: true },
          { name: 'Steam Room', included: false },
        ],
        addons: ['Towel Service'],
        tax: 18,
        proration: 'None',
      },
      {
        id: '4',
        name: 'Corporate Elite',
        duration: 365,
        price: 12999,
        eligibility: 'Corporate',
        version: 'v3.0',
        effectiveFrom: '01 Jan 2025',
        branches: 'All',
        status: false,
        activeMembers: 310,
        facilities: [
          { name: 'Gym Floor', included: true },
          { name: 'Pool', included: true },
          { name: 'Classes', included: true },
          { name: 'Steam Room', included: true },
        ],
        addons: ['Locker', 'PT Package', 'Guest Pass'],
        tax: 18,
        proration: 'Daily',
      },
    ];
  }

  filterPlans(): void {
    this.filteredPlans = this.plans.filter((p) => {
      const matchesSearch = p.name
        .toLowerCase()
        .includes(this.searchQuery.toLowerCase());
      const matchesElig =
        this.eligibilityFilter === 'All' ||
        p.eligibility === this.eligibilityFilter;
      const matchesStatus =
        this.statusFilter === 'All' ||
        (this.statusFilter === 'Active' ? p.status : !p.status);
      return matchesSearch && matchesElig && matchesStatus;
    });
  }

  onSearchChange(): void {
    this.filterPlans();
  }

  onEligibilityFilterChange(): void {
    this.filterPlans();
  }

  onStatusFilterChange(): void {
    this.filterPlans();
  }

  setStatusFilter(status: string): void {
    this.statusFilter = status as any as PlanStatus;
    this.filterPlans();
  }

  toggleRow(id: string): void {
    if (this.expandedRows.has(id)) {
      this.expandedRows.delete(id);
    } else {
      this.expandedRows.add(id);
    }
  }

  isRowExpanded(id: string): boolean {
    return this.expandedRows.has(id);
  }

  handleEdit(plan: Plan): void {
    this.editingPlan = { ...plan };
    this.isDrawerOpen = true;
  }

  handleCreate(): void {
    this.editingPlan = null;
    this.isDrawerOpen = true;
  }

  handleDeactivate(plan: Plan): void {
    if (plan.status) {
      this.deactivatingPlan = plan;
    } else {
      this.plans = this.plans.map((p) =>
        p.id === plan.id ? { ...p, status: true } : p,
      );
      this.filterPlans();
    }
  }

  confirmDeactivate(): void {
    if (this.deactivatingPlan) {
      this.plans = this.plans.map((p) =>
        p.id === this.deactivatingPlan!.id ? { ...p, status: false } : p,
      );
      this.deactivatingPlan = null;
      this.filterPlans();
    }
  }

  togglePlanStatus(plan: Plan): void {
    if (plan.status) {
      this.deactivatingPlan = plan;
    } else {
      this.plans = this.plans.map((p) =>
        p.id === plan.id ? { ...p, status: true } : p,
      );
      this.filterPlans();
    }
  }

  closeDrawer(): void {
    this.isDrawerOpen = false;
    this.editingPlan = null;
  }

  savePlan(): void {
    if (this.editingPlan) {
      if (this.editingPlan.id) {
        this.plans = this.plans.map((p) =>
          p.id === this.editingPlan!.id ? this.editingPlan! : p,
        );
      } else {
        this.editingPlan.id = Date.now().toString();
        this.plans.push(this.editingPlan);
      }
      this.filterPlans();
    }
    this.closeDrawer();
  }

  discardChanges(): void {
    this.closeDrawer();
  }

  formatPrice(price: number): string {
    return price.toLocaleString('en-IN');
  }
}
