import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AdminApiService, BranchDto } from '../../services/admin-api.service';
import { FrontdeskApiService, MemberDto } from '../../services/frontdesk-api.service';

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
  standalone: true,
  imports: [FormsModule, CommonModule],
})
export class AdminBranchManagementComponent implements OnInit {
  branches: BranchDetails[] = [];
  filteredBranches: BranchDetails[] = [];
  fallbackBranch: BranchDetails = this.createEmptyBranch();
  isLoading = false;
  errorMessage = '';
  searchQuery = '';
  selectedBranchId = '';
  activeTab: 'Details' | 'Staff' | 'Members' | 'Classes' | 'Settings' = 'Details';

  isAssignStaffOpen = false;
  isTransferMemberOpen = false;

  tabs = ['Details', 'Staff', 'Members', 'Classes', 'Settings'] as const;

  // Modals properties
  staffSearchQuery = '';
  memberSearchQuery = '';
  transferSourceBranch = '';
  transferTargetBranchId = '';
  transferReason = '';

  constructor(
    private adminApi: AdminApiService,
    private frontdeskApi: FrontdeskApiService
  ) {}

  ngOnInit(): void {
    this.loadBranches();
  }

  loadBranches(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.adminApi.getBranches().subscribe({
      next: (branches) => {
        if (branches && branches.length > 0) {
          this.branches = branches.map((branch) => this.fromBranchDto(branch));
        } else {
          this.branches = [];
        }
        this.selectedBranchId = this.branches[0]?.id || '';
        this.filterBranches();
        this.isLoading = false;
        this.loadMembers();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to load branches.';
        this.branches = [];
        this.selectedBranchId = '';
        this.filterBranches();
        this.isLoading = false;
      },
    });
  }

  private loadMembers(): void {
    this.frontdeskApi.getMembers().subscribe({
      next: (list: MemberDto[]) => {
        const byBranch = new Map<number, number>();
        (list || []).forEach((m) => {
          const bid = Number((m as any).homeBranchId || (m as any).branchId || 0);
          byBranch.set(bid, (byBranch.get(bid) || 0) + 1);
        });
        
        this.branches = this.branches.map((b) => ({
          ...b,
          membersCount: byBranch.get(Number(b.id)) || 0,
        }));
        this.filterBranches();
      }
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
    branch.name = 'NEW BRANCH';
    branch.address = 'UPDATE ADDRESS, BANGALORE';
    branch.city = 'BANGALORE';

    this.adminApi.createBranch(this.toDto(branch)).subscribe({
      next: (created) => {
        const createdBranch = this.fromBranchDto(created);
        this.branches = [createdBranch, ...this.branches];
        this.selectedBranchId = createdBranch.id;
        this.filterBranches();
      },
      error: () => {
        // Fallback create
        const localId = String(this.branches.length + 1);
        const createdBranch: BranchDetails = {
          ...branch,
          id: localId,
          staff: this.mockStaff(),
          members: this.mockMembers(),
          classes: this.mockClasses(),
          rooms: this.mockRooms(),
          plans: this.mockPlans()
        };
        this.branches = [createdBranch, ...this.branches];
        this.selectedBranchId = createdBranch.id;
        this.filterBranches();
      },
    });
  }

  private createEmptyBranch(): BranchDetails {
    return {
      id: '',
      name: '',
      city: '',
      address: '',
      phone: '+91 99999 99999',
      email: 'branch@fitclub.com',
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
    this.transferSourceBranch = this.selectedBranch.name;
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
    if (!branch?.id) return;

    this.adminApi.updateBranch(Number(branch.id), this.toDto(branch)).subscribe({
      next: (savedBranch) => {
        const index = this.branches.findIndex((b) => b.id === branch.id);
        if (index !== -1) {
          this.branches[index] = {
            ...this.fromBranchDto(savedBranch),
            staff: branch.staff,
            members: branch.members,
            classes: branch.classes,
            rooms: branch.rooms,
            plans: branch.plans,
            membersCount: branch.membersCount
          };
          this.selectedBranchId = this.branches[index].id;
        }
        this.filterBranches();
      },
      error: () => {
        // Fallback update locally
        const index = this.branches.findIndex((b) => b.id === branch.id);
        if (index !== -1) {
          this.branches[index] = { ...branch };
        }
        this.filterBranches();
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
    const branch = this.selectedBranch;
    const nextRoomId = String(branch.rooms.length + 1);
    branch.rooms.push({
      id: nextRoomId,
      name: `STUDIO ${String.fromCharCode(65 + branch.rooms.length)}`,
      capacity: 25,
      active: true
    });
  }

  executeTransferMember(): void {
    alert(`TRANSFERRING MEMBER TO TARGET BRANCH REASON: ${this.transferReason.toUpperCase()}`);
    this.closeTransferMemberModal();
  }

  executeAssignStaff(): void {
    alert(`ASSIGNING STAFF ACCOUNT TO THE BRANCH.`);
    this.closeAssignStaffModal();
  }

  private fromBranchDto(branch: BranchDto): BranchDetails {
    const [openTime, closeTime] = this.parseOperatingHours(branch.opHours);
    return {
      id: String(branch.branchId),
      name: branch.branchName.toUpperCase(),
      city: this.extractCity(branch.address).toUpperCase(),
      address: branch.address,
      phone: branch.contact,
      email: `${branch.branchName.toLowerCase().replace(/\s+/g, '')}@fitclub.com`,
      openTime,
      closeTime,
      timezone: branch.timezone || 'Asia/Kolkata',
      active: branch.isActive !== false,
      membersCount: 0,
      staff: this.mockStaff(),
      members: this.mockMembers(),
      classes: this.mockClasses(),
      rooms: this.mockRooms(),
      plans: this.mockPlans(),
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
    if (!opHours) return ['06:00', '22:00'];
    const parts = opHours.split(/\s*-\s*/);
    return [parts[0] || '06:00', parts[1] || '22:00'];
  }

  private extractCity(address: string): string {
    if (!address) return 'BANGALORE';
    const parts = address.split(',').map((part) => part.trim());
    return parts.length > 1 ? parts[parts.length - 2] : address;
  }

  private mockStaff(): Staff[] {
    return [
      { id: '1', name: 'KARAN SHARMA', role: 'TRAINER', email: 'KARAN@FITCLUB.COM', since: '2024-01-10', initials: 'KS' },
      { id: '2', name: 'POOJA NAIR', role: 'FRONT-DESK', email: 'POOJA@FITCLUB.COM', since: '2024-03-15', initials: 'PN' },
      { id: '3', name: 'ADITYA ROY', role: 'TRAINER', email: 'ADITYA@FITCLUB.COM', since: '2023-11-01', initials: 'AR' }
    ];
  }

  private mockMembers(): Member[] {
    return [
      { id: '1', name: 'AMIT PATEL', plan: 'GOLD ANNUAL', initials: 'AP' },
      { id: '2', name: 'ROHAN JOSHI', plan: 'VIP MONTHLY', initials: 'RJ' },
      { id: '3', name: 'SNEHA REDDY', plan: 'STUDENT SPECIAL', initials: 'SR' }
    ];
  }

  private mockClasses(): ClassItem[] {
    return [
      { id: '1', name: 'POWER YOGA', category: 'YOGA', trainer: 'KARAN SHARMA', schedule: 'MON/WED/FRI 07:00', status: true },
      { id: '2', name: 'ZUMBA CARDIO', category: 'DANCE', trainer: 'TINA SEN', schedule: 'TUE/THU 18:00', status: true },
      { id: '3', name: 'SPIN BLITZ', category: 'CARDIO', trainer: 'ADITYA ROY', schedule: 'SAT 09:00', status: false }
    ];
  }

  private mockRooms(): Room[] {
    return [
      { id: '1', name: 'STUDIO A', capacity: 30, active: true },
      { id: '2', name: 'SPIN STUDIO', capacity: 20, active: true },
      { id: '3', name: 'POOL ZONE', capacity: 15, active: false }
    ];
  }

  private mockPlans(): PlanVisibility[] {
    return [
      { id: '1', name: 'GOLD ANNUAL', visible: true },
      { id: '2', name: 'VIP MONTHLY', visible: true },
      { id: '3', name: 'STUDENT SPECIAL', visible: false }
    ];
  }
}
