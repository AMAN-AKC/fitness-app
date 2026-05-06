import { Component, OnInit } from '@angular/core';
import { AdminApiService, BranchDto } from '../../services/admin-api.service';

export interface Staff {
  id: string;
  name: string;
  role: string;
  email: string;
  since: string;
  initials: string;
}

export interface Member {
  id: string;
  name: string;
  plan: string;
  initials: string;
}

export interface ClassItem {
  id: string;
  name: string;
  category: string;
  trainer: string;
  schedule: string;
  status: boolean;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  active: boolean;
}

export interface PlanVisibility {
  id: string;
  name: string;
  visible: boolean;
}

export interface BranchDetails {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  openTime: string;
  closeTime: string;
  timezone: string;
  active: boolean;
  membersCount: number;
  staff: Staff[];
  members: Member[];
  classes: ClassItem[];
  rooms: Room[];
  plans: PlanVisibility[];
}

@Component({
  selector: 'app-admin-branch-management',
  templateUrl: './admin-branch-management.component.html',
  styleUrls: ['./admin-branch-management.component.css'],
})
export class AdminBranchManagementComponent implements OnInit {
  branches: BranchDetails[] = [];
  filteredBranches: BranchDetails[] = [];
  fallbackBranch: BranchDetails = this.createEmptyBranch();
  isLoading = false;
  errorMessage = '';
  searchQuery = '';
  selectedBranchId = '';
  activeTab: 'Details' | 'Staff' | 'Members' | 'Classes' | 'Settings' =
    'Details';

  isAssignStaffOpen = false;
  isTransferMemberOpen = false;

  tabs = ['Details', 'Staff', 'Members', 'Classes', 'Settings'] as const;

  constructor(private adminApi: AdminApiService) {}

  ngOnInit(): void {
    this.loadBranches();
  }

  loadBranches(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.adminApi.getBranches().subscribe({
      next: (branches) => {
        this.branches = branches.map((branch) => this.fromDto(branch));
        this.selectedBranchId = this.branches[0]?.id || '';
        this.filterBranches();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage =
          error?.error?.message || 'Unable to load branches from the backend.';
        this.isLoading = false;
      },
    });
  }

  filterBranches(): void {
    this.filteredBranches = this.branches.filter(
      (b) =>
        b.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        b.city.toLowerCase().includes(this.searchQuery.toLowerCase()),
    );
  }

  onSearchChange(): void {
    this.filterBranches();
  }

  selectBranch(branchId: string): void {
    this.selectedBranchId = branchId;
  }

  get selectedBranch(): BranchDetails {
    return (
      this.branches.find((b) => b.id === this.selectedBranchId) ||
      this.branches[0] ||
      this.fallbackBranch
    );
  }

  onAddBranch(): void {
    const branch: BranchDetails = this.createEmptyBranch();
    branch.name = 'New Branch';
    branch.address = 'Update address';

    this.adminApi.createBranch(this.toDto(branch)).subscribe({
      next: (created) => {
        const createdBranch = this.fromDto(created);
        this.branches = [createdBranch, ...this.branches];
        this.selectedBranchId = createdBranch.id;
        this.filterBranches();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Unable to add branch.';
      },
    });
  }

  private createEmptyBranch(): BranchDetails {
    return {
      id: '',
      name: '',
      city: '',
      address: '',
      phone: '+91 00000 00000',
      email: '',
      openTime: '06:00',
      closeTime: '22:00',
      timezone: 'Asia/Kolkata',
      active: true,
      membersCount: 0,
      staff: [],
      members: [],
      classes: [],
      rooms: [],
      plans: [],
    };
  }

  onAssignStaff(): void {
    this.isAssignStaffOpen = true;
  }

  closeAssignStaffModal(): void {
    this.isAssignStaffOpen = false;
  }

  onTransferMember(): void {
    this.isTransferMemberOpen = true;
  }

  closeTransferMemberModal(): void {
    this.isTransferMemberOpen = false;
  }

  formatNumber(num: number): string {
    return num.toLocaleString('en-IN');
  }

  saveChanges(): void {
    const branch = this.selectedBranch;
    if (!branch?.id) {
      return;
    }

    this.adminApi.updateBranch(Number(branch.id), this.toDto(branch)).subscribe({
      next: (savedBranch) => {
        const index = this.branches.findIndex((b) => b.id === branch.id);
        if (index !== -1) {
          this.branches[index] = {
            ...this.fromDto(savedBranch),
            staff: branch.staff,
            members: branch.members,
            classes: branch.classes,
            rooms: branch.rooms,
            plans: branch.plans,
          };
          this.selectedBranchId = this.branches[index].id;
        }
        this.filterBranches();
      },
      error: (error) => {
        this.errorMessage =
          error?.error?.message || 'Unable to save branch changes.';
      },
    });
  }

  toggleSelectedBranchActive(): void {
    this.selectedBranch.active = !this.selectedBranch.active;
    this.saveChanges();
  }

  unassignStaff(staffId: string): void {
    const branch = this.selectedBranch;
    branch.staff = branch.staff.filter((s) => s.id !== staffId);
  }

  toggleRoomStatus(roomId: string): void {
    const room = this.selectedBranch.rooms.find((r) => r.id === roomId);
    if (room) {
      room.active = !room.active;
    }
  }

  togglePlanVisibility(planId: string): void {
    const plan = this.selectedBranch.plans.find((p) => p.id === planId);
    if (plan) {
      plan.visible = !plan.visible;
    }
  }

  onAddRoom(): void {
    console.log('Add Room clicked');
  }

  setSavePolicy(): void {
    console.log('Policy saved');
  }

  private fromDto(branch: BranchDto): BranchDetails {
    const [openTime, closeTime] = this.parseOperatingHours(branch.opHours);
    return {
      id: String(branch.branchId),
      name: branch.branchName,
      city: this.extractCity(branch.address),
      address: branch.address,
      phone: branch.contact,
      email: '',
      openTime,
      closeTime,
      timezone: branch.timezone,
      active: branch.isActive !== false,
      membersCount: 0,
      staff: [],
      members: [],
      classes: [],
      rooms: [],
      plans: [],
    };
  }

  private toDto(branch: BranchDetails): BranchDto {
    return {
      branchId: branch.id ? Number(branch.id) : undefined,
      branchName: branch.name,
      address: branch.address,
      contact: branch.phone,
      opHours: `${branch.openTime}-${branch.closeTime}`,
      timezone: branch.timezone,
      isActive: branch.active,
    };
  }

  private parseOperatingHours(opHours: string): [string, string] {
    const [openTime, closeTime] = opHours.split(/\s*-\s*/);
    return [openTime || '06:00', closeTime || '22:00'];
  }

  private extractCity(address: string): string {
    const parts = address.split(',').map((part) => part.trim());
    return parts.length > 1 ? parts[parts.length - 2] : '';
  }
}
