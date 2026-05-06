import { Component, OnInit } from '@angular/core';
import {
  AdminApiService,
  BackendEligibility,
  PlanDto,
} from '../../services/admin-api.service';

export type EligibilityType = 'General' | 'Student' | 'Senior' | 'Corporate';
export type PlanStatus = 'Active' | 'Inactive' | 'All';

export interface Facility {
  name: string;
  included: boolean;
}

export interface Plan {
  id: string;
  name: string;
  duration: number;
  price: number;
  accessStart: string;
  accessEnd: string;
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
  isLoading = false;
  errorMessage = '';
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

  constructor(private adminApi: AdminApiService) {}

  ngOnInit(): void {
    this.loadPlans();
  }

  loadPlans(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.adminApi.getPlans().subscribe({
      next: (plans) => {
        this.plans = plans.map((plan) => this.fromDto(plan));
        this.filterPlans();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage =
          error?.error?.message || 'Unable to load plans from the backend.';
        this.isLoading = false;
      },
    });
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
    this.statusFilter = status as PlanStatus;
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
    this.editingPlan = { ...plan, facilities: [...plan.facilities] };
    this.isDrawerOpen = true;
  }

  handleCreate(): void {
    this.editingPlan = {
      id: '',
      name: '',
      duration: 30,
      price: 0,
      accessStart: '06:00',
      accessEnd: '22:00',
      eligibility: 'General',
      version: 'v1',
      effectiveFrom: new Date().toISOString().slice(0, 10),
      branches: 'All',
      status: true,
      facilities: this.defaultFacilities(),
      addons: [],
      tax: 18,
      proration: 'Daily',
      activeMembers: 0,
    };
    this.isDrawerOpen = true;
  }

  handleDeactivate(plan: Plan): void {
    if (plan.status) {
      this.deactivatingPlan = plan;
    } else {
      this.savePlanStatus({ ...plan, status: true });
    }
  }

  confirmDeactivate(): void {
    if (!this.deactivatingPlan) {
      return;
    }

    const plan = this.deactivatingPlan;
    this.adminApi.deactivatePlan(Number(plan.id)).subscribe({
      next: () => {
        plan.status = false;
        this.deactivatingPlan = null;
        this.filterPlans();
      },
      error: (error) => {
        this.errorMessage =
          error?.error?.message || 'Unable to deactivate plan.';
        this.deactivatingPlan = null;
      },
    });
  }

  togglePlanStatus(plan: Plan): void {
    if (plan.status) {
      this.deactivatingPlan = plan;
    } else {
      this.savePlanStatus({ ...plan, status: true });
    }
  }

  closeDrawer(): void {
    this.isDrawerOpen = false;
    this.editingPlan = null;
  }

  savePlan(): void {
    if (!this.editingPlan) {
      this.closeDrawer();
      return;
    }

    const request = this.editingPlan.id
      ? this.adminApi.updatePlan(
          Number(this.editingPlan.id),
          this.toDto(this.editingPlan),
        )
      : this.adminApi.createPlan(this.toDto(this.editingPlan));

    request.subscribe({
      next: (savedPlan) => {
        const plan = this.fromDto(savedPlan);
        const index = this.plans.findIndex((p) => p.id === plan.id);
        if (index === -1) {
          this.plans = [plan, ...this.plans];
        } else {
          this.plans[index] = plan;
        }
        this.filterPlans();
        this.closeDrawer();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Unable to save plan.';
      },
    });
  }

  discardChanges(): void {
    this.closeDrawer();
  }

  formatPrice(price: number): string {
    return price.toLocaleString('en-IN');
  }

  private savePlanStatus(plan: Plan): void {
    this.adminApi.updatePlan(Number(plan.id), this.toDto(plan)).subscribe({
      next: (savedPlan) => {
        const index = this.plans.findIndex((p) => p.id === plan.id);
        if (index !== -1) {
          this.plans[index] = this.fromDto(savedPlan);
        }
        this.filterPlans();
      },
      error: (error) => {
        this.errorMessage =
          error?.error?.message || 'Unable to update plan status.';
      },
    });
  }

  private fromDto(plan: PlanDto): Plan {
    return {
      id: String(plan.planId),
      name: plan.planName,
      duration: plan.durationDays,
      price: Number(plan.price),
      accessStart: plan.accessStart || '06:00',
      accessEnd: plan.accessEnd || '22:00',
      eligibility: this.toUiEligibility(plan.eligibilityType),
      version: `v${plan.version || 1}`,
      effectiveFrom: plan.effectiveFrom,
      branches: this.toUiBranchVisibility(plan.branchVisibility),
      status: plan.isActive !== false,
      facilities: this.defaultFacilities(),
      addons: [],
      tax: Number(plan.taxPercent || 0),
      proration: plan.prorationRule || 'None',
      activeMembers: 0,
    };
  }

  private toDto(plan: Plan): PlanDto {
    return {
      planId: plan.id ? Number(plan.id) : undefined,
      planName: plan.name,
      durationDays: Number(plan.duration),
      price: Number(plan.price),
      accessStart: plan.accessStart || '06:00',
      accessEnd: plan.accessEnd || '22:00',
      eligibilityType: this.toBackendEligibility(plan.eligibility),
      prorationRule: plan.proration,
      taxPercent: Number(plan.tax || 0),
      version: Number(plan.version.replace(/^v/i, '')) || 1,
      effectiveFrom: plan.effectiveFrom,
      branchVisibility:
        plan.branches === 'All' ? 'ALL' : `${plan.branches} branches`,
      isActive: plan.status,
    };
  }

  private defaultFacilities(): Facility[] {
    return [
      { name: 'Gym Floor', included: true },
      { name: 'Pool', included: true },
      { name: 'Classes', included: true },
      { name: 'Steam Room', included: false },
    ];
  }

  private toUiEligibility(eligibility: BackendEligibility): EligibilityType {
    const map: Record<BackendEligibility, EligibilityType> = {
      GENERAL: 'General',
      STUDENT: 'Student',
      SENIOR: 'Senior',
      CORPORATE: 'Corporate',
    };
    return map[eligibility] || 'General';
  }

  private toBackendEligibility(eligibility: EligibilityType): BackendEligibility {
    const map: Record<EligibilityType, BackendEligibility> = {
      General: 'GENERAL',
      Student: 'STUDENT',
      Senior: 'SENIOR',
      Corporate: 'CORPORATE',
    };
    return map[eligibility];
  }

  private toUiBranchVisibility(visibility?: string): 'All' | number {
    if (!visibility || visibility.toUpperCase() === 'ALL') {
      return 'All';
    }

    const count = Number.parseInt(visibility, 10);
    return Number.isNaN(count) ? 1 : count;
  }
}
