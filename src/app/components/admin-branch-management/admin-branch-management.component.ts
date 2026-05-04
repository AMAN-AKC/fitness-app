import { Component, OnInit } from '@angular/core';

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
  searchQuery = '';
  selectedBranchId = '';
  activeTab: 'Details' | 'Staff' | 'Members' | 'Classes' | 'Settings' =
    'Details';

  isAssignStaffOpen = false;
  isTransferMemberOpen = false;

  tabs = ['Details', 'Staff', 'Members', 'Classes', 'Settings'] as const;

  constructor() {}

  ngOnInit(): void {
    this.initializeBranches();
    this.selectedBranchId = this.branches[0].id;
    this.filterBranches();
  }

  initializeBranches(): void {
    this.branches = [
      {
        id: '1',
        name: 'Downtown Main',
        city: 'Mumbai',
        address: '123 Business Avenue, Colaba, Mumbai, MH 400001',
        phone: '+91 98765 43210',
        email: 'downtown@fitclub.com',
        openTime: '05:00',
        closeTime: '23:00',
        timezone: 'Asia/Kolkata',
        active: true,
        membersCount: 1250,
        staff: [
          {
            id: 's1',
            name: 'Rajesh Kumar',
            role: 'Manager',
            email: 'rajesh.k@fitclub.com',
            since: 'Jan 2022',
            initials: 'RK',
          },
          {
            id: 's2',
            name: 'Priya Singh',
            role: 'Trainer',
            email: 'priya.s@fitclub.com',
            since: 'Mar 2023',
            initials: 'PS',
          },
        ],
        members: [
          { id: 'm1', name: 'Amit Patel', plan: 'Gold Annual', initials: 'AP' },
          {
            id: 'm2',
            name: 'Neha Sharma',
            plan: 'Student Flex',
            initials: 'NS',
          },
        ],
        classes: [
          {
            id: 'c1',
            name: 'Morning Yoga',
            category: 'Yoga',
            trainer: 'Priya Singh',
            schedule: 'Mon-Wed-Fri, 06:00 AM',
            status: true,
          },
          {
            id: 'c2',
            name: 'HIIT Blast',
            category: 'Cardio',
            trainer: 'Rahul Dev',
            schedule: 'Tue-Thu, 07:00 PM',
            status: true,
          },
        ],
        rooms: [
          { id: 'r1', name: 'Main Studio', capacity: 40, active: true },
          { id: 'r2', name: 'Yoga Room', capacity: 20, active: true },
        ],
        plans: [
          { id: 'p1', name: 'Gold Annual', visible: true },
          { id: 'p2', name: 'Student Flex', visible: true },
          { id: 'p3', name: 'Corporate Elite', visible: true },
        ],
      },
      {
        id: '2',
        name: 'Westside Flex',
        city: 'Mumbai',
        address: '45 West Link Road, Bandra West, Mumbai, MH 400050',
        phone: '+91 98765 11111',
        email: 'westside@fitclub.com',
        openTime: '06:00',
        closeTime: '22:00',
        timezone: 'Asia/Kolkata',
        active: true,
        membersCount: 840,
        staff: [
          {
            id: 's3',
            name: 'Sunil Dutt',
            role: 'Front Desk',
            email: 'sunil.d@fitclub.com',
            since: 'Jul 2024',
            initials: 'SD',
          },
        ],
        members: [],
        classes: [],
        rooms: [],
        plans: [],
      },
      {
        id: '3',
        name: 'Pune East',
        city: 'Pune',
        address: '88 Viman Nagar Road, Pune, MH 411014',
        phone: '+91 98765 22222',
        email: 'puneeast@fitclub.com',
        openTime: '06:00',
        closeTime: '22:00',
        timezone: 'Asia/Kolkata',
        active: false,
        membersCount: 450,
        staff: [],
        members: [],
        classes: [],
        rooms: [],
        plans: [],
      },
    ];
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
      this.branches[0]
    );
  }

  onAddBranch(): void {
    console.log('Add Branch clicked');
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
    console.log('Branch details saved');
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
}
