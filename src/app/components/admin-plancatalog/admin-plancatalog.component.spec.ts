import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminPlancatalogComponent } from './admin-plancatalog.component';

describe('AdminPlancatalogComponent', () => {
  let component: AdminPlancatalogComponent;
  let fixture: ComponentFixture<AdminPlancatalogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminPlancatalogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminPlancatalogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with 4 plans', () => {
    expect(component.plans.length).toBe(4);
  });

  it('should filter plans by search query', () => {
    component.searchQuery = 'Gold';
    component.onSearchChange();
    expect(component.filteredPlans.length).toBe(1);
    expect(component.filteredPlans[0].name).toBe('Gold Annual');
  });

  it('should filter plans by eligibility', () => {
    component.eligibilityFilter = 'Student';
    component.onEligibilityFilterChange();
    expect(
      component.filteredPlans.some((p) => p.eligibility === 'Student'),
    ).toBeTruthy();
  });

  it('should filter plans by status', () => {
    component.statusFilter = 'Active';
    component.onStatusFilterChange();
    expect(
      component.filteredPlans.every((p) => p.status === true),
    ).toBeTruthy();
  });

  it('should toggle row expansion', () => {
    const planId = '1';
    component.toggleRow(planId);
    expect(component.isRowExpanded(planId)).toBe(true);
    component.toggleRow(planId);
    expect(component.isRowExpanded(planId)).toBe(false);
  });

  it('should open drawer for editing plan', () => {
    const plan = component.plans[0];
    component.handleEdit(plan);
    expect(component.isDrawerOpen).toBe(true);
    expect(component.editingPlan).toEqual(plan);
  });

  it('should open drawer for creating new plan', () => {
    component.handleCreate();
    expect(component.isDrawerOpen).toBe(true);
    expect(component.editingPlan).toBe(null);
  });

  it('should close drawer', () => {
    component.isDrawerOpen = true;
    component.closeDrawer();
    expect(component.isDrawerOpen).toBe(false);
    expect(component.editingPlan).toBe(null);
  });

  it('should toggle plan status', () => {
    const plan = component.plans[0];
    const initialStatus = plan.status;
    component.togglePlanStatus(plan);

    if (initialStatus) {
      expect(component.deactivatingPlan).toEqual(plan);
    }
  });

  it('should confirm deactivation', () => {
    const plan = component.plans[0];
    component.deactivatingPlan = plan;
    const initialStatus = plan.status;
    component.confirmDeactivate();

    expect(component.deactivatingPlan).toBe(null);
    if (initialStatus) {
      const updatedPlan = component.plans.find((p) => p.id === plan.id);
      expect(updatedPlan?.status).toBe(false);
    }
  });

  it('should format price with Indian locale', () => {
    const formatted = component.formatPrice(14999);
    expect(formatted).toBe('14,999');
  });

  it('should have correct eligibility colors', () => {
    expect(component.eligibilityColors['General']).toBe(
      'bg-[#EFF5FF] text-[#2563EB] border-[#2563EB]/20',
    );
    expect(component.eligibilityColors['Student']).toBe(
      'bg-[#FAF5FF] text-[#9333EA] border-[#9333EA]/20',
    );
    expect(component.eligibilityColors['Senior']).toBe(
      'bg-[#F0FDF4] text-[#16A34A] border-[#16A34A]/20',
    );
    expect(component.eligibilityColors['Corporate']).toBe(
      'bg-[#F0FDFA] text-[#0D9488] border-[#0D9488]/20',
    );
  });

  it('should save edited plan', () => {
    const plan = component.plans[0];
    component.editingPlan = { ...plan, name: 'Updated Plan' };
    component.savePlan();

    const updatedPlan = component.plans.find((p) => p.id === plan.id);
    expect(updatedPlan?.name).toBe('Updated Plan');
    expect(component.isDrawerOpen).toBe(false);
  });

  it('should save new plan', () => {
    const initialCount = component.plans.length;
    component.editingPlan = {
      id: '',
      name: 'New Plan',
      duration: 60,
      price: 3999,
      eligibility: 'General',
      version: 'v1.0',
      effectiveFrom: '01 May 2025',
      branches: 'All',
      status: true,
      activeMembers: 0,
      facilities: [],
      addons: [],
      tax: 18,
      proration: 'Daily',
    };
    component.savePlan();

    expect(component.plans.length).toBe(initialCount + 1);
    expect(component.isDrawerOpen).toBe(false);
  });
});
