import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AdminApiService, BranchDto, SystemUserDto, PlanDto } from '../../services/admin-api.service';
import { FrontdeskApiService, MemberDto, ClassesDto } from '../../services/frontdesk-api.service';
import { forkJoin } from 'rxjs';

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
  underMaintenance?: boolean;
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

  isTransferMemberOpen = false;

  tabs = ['Details', 'Staff', 'Members', 'Classes', 'Settings'] as const;

  // Modals properties
  transferSourceBranch = '';
  transferTargetBranchId = '';
  transferReason = '';
  transferMemberId = '';

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

    forkJoin({
      branches: this.adminApi.getBranches(),
      users: this.adminApi.getUsers(),
      members: this.frontdeskApi.getMembers(),
      classes: this.frontdeskApi.getClasses(),
      facilities: this.adminApi.getFacilities()
    }).subscribe({
      next: (data) => {
        if (data.branches && data.branches.length > 0) {
          this.branches = data.branches.map((branch) => {
            const b = this.fromBranchDto(branch);
            
            // Map Staff
            b.staff = data.users
              .filter(u => u.branchName === branch.branchName && (u.role === 'TRAINER' || u.role === 'FRONT_DESK' || u.role === 'MANAGER'))
              .map(u => ({
                id: String(u.userId),
                name: u.username.toUpperCase(),
                role: u.role,
                email: u.email,
                since: u.lastLogin || 'N/A',
                initials: u.username.substring(0, 2).toUpperCase()
              }));
            
            // Map Members
            b.members = data.members
              .filter(m => m.homeBranchId === branch.branchId)
              .map(m => ({
                id: String(m.memberId),
                name: m.memName.toUpperCase(),
                plan: m.status || 'N/A',
                initials: m.memName.substring(0, 2).toUpperCase()
              }));
            
            b.membersCount = b.members.length;

            // Map Classes
            b.classes = data.classes
              .filter(c => c.branchId === branch.branchId)
              .map(c => ({
                id: String(c.classId),
                name: c.className.toUpperCase(),
                category: c.prerequisites || 'GENERAL',
                trainer: `TRAINER ${c.trainerId}`,
                schedule: `${c.weekdays} ${c.classTime}`,
                status: c.status === 'ACTIVE'
              }));

            // Map Rooms
            b.rooms = data.facilities
              .filter(f => f.branchId === branch.branchId)
              .map(f => ({
                id: String(f.facilityId),
                name: f.facilityName.toUpperCase(),
                capacity: f.capacity,
                active: f.isActive,
                underMaintenance: f.underMaintenance
              }));

            return b;
          });
        } else {
          this.branches = [];
        }
        
        // Retain selection if possible
        if (!this.selectedBranchId || !this.branches.find(b => b.id === this.selectedBranchId)) {
          this.selectedBranchId = this.branches[0]?.id || '';
        }
        this.filterBranches();
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to load branch data.';
        this.branches = [];
        this.selectedBranchId = '';
        this.filterBranches();
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
    branch.name = 'NEW BRANCH';
    branch.address = 'UPDATE ADDRESS, BANGALORE';
    branch.city = 'BANGALORE';

    this.adminApi.createBranch(this.toDto(branch)).subscribe({
      next: (created) => {
        this.loadBranches();
      }
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
      rooms: []
    };
  }

  onTransferMember(): void {
    this.transferSourceBranch = this.selectedBranch.name;
    this.transferMemberId = this.selectedBranch.members.length > 0 ? this.selectedBranch.members[0].id : '';
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
        alert('Branch updated successfully!');
      }
    });
  }

  toggleSelectedBranchActive(): void {
    this.selectedBranch.active = !this.selectedBranch.active;
    this.saveChanges();
  }

  toggleRoomStatus(room: Room): void {
    const payload = {
      facilityId: Number(room.id),
      facilityName: room.name,
      branchId: Number(this.selectedBranch.id),
      capacity: room.capacity,
      isActive: !room.active,
      underMaintenance: room.underMaintenance
    };
    this.adminApi.updateFacility(payload).subscribe(() => {
      this.loadBranches();
    });
  }

  onAddRoom(): void {
    const newRoomName = prompt("Enter new room name:");
    if (!newRoomName) return;
    const capacityStr = prompt("Enter capacity:");
    const capacity = parseInt(capacityStr || '20', 10);
    
    const payload = {
      facilityName: newRoomName,
      branchId: Number(this.selectedBranch.id),
      capacity: capacity,
      isActive: true,
      underMaintenance: false
    };
    this.adminApi.createFacility(payload).subscribe(() => {
      this.loadBranches();
    });
  }

  executeTransferMember(): void {
    if (!this.transferMemberId || !this.transferTargetBranchId || !this.transferReason) {
      alert("Please fill in all fields.");
      return;
    }
    
    this.adminApi.transferMember(Number(this.transferMemberId), Number(this.transferTargetBranchId), this.transferReason).subscribe({
      next: () => {
        alert('Member transferred successfully!');
        this.closeTransferMemberModal();
        this.loadBranches();
      },
      error: (err) => {
        alert('Failed to transfer member: ' + (err.error?.message || 'Unknown error'));
      }
    });
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
      staff: [],
      members: [],
      classes: [],
      rooms: []
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
}
