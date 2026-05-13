import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import {
  AttendanceDto,
  FrontdeskApiService,
  MemberDto,
} from '../../services/frontdesk-api.service';
import { BranchDto } from '../../services/admin-api.service';

interface MemberData {
  id: string;
  memberId: number;
  name: string;
  plan: string;
  branch: string;
  branchId: number;
  avatar: string;
  status: 'ok' | 'blocked';
  alert?: string;
  dues?: string;
  hasUnpaidDues?: boolean;
  hasHealthNotes?: boolean;
  healthNotes?: string;
  consentRequired?: boolean;
  consentMessage?: string;
}

interface CheckInRecord {
  name: string;
  time: string;
  method: 'QR Code' | 'Manual';
  avatar: string;
}

interface ClassRoster {
  id: number;
  name: string;
  time: string;
  enrolled: number;
  cap: number;
}

interface ClassMember {
  name: string;
  status: 'present' | 'pending' | 'absent';
}

@Component({
  selector: 'app-frontdesk-dashboard',
  templateUrl: './frontdesk-dashboard.component.html',
  styleUrls: ['./frontdesk-dashboard.component.css'],
  standalone: false,
})
export class FrontdeskDashboardComponent implements OnInit {
  searchValue = '';
  memberFound: MemberData | null = null;
  expandedClass: number | null = null;
  currentDateTime = '';
  currentUserName = 'Guest';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  selectedBranchId = 0;
  branches: BranchDto[] = [];
  members: MemberDto[] = [];

  checkInsToday = 0;
  newMembers = 0;
  pendingConsents = 0;
  expiringPlans = 0;

  recentCheckIns: CheckInRecord[] = [];

  todaysClasses: ClassRoster[] = [
    {
      id: 1,
      name: 'Morning Yoga Flow',
      time: '07:00 AM',
      enrolled: 0,
      cap: 20,
    },
    { id: 2, name: 'HIIT Intensity', time: '18:00 PM', enrolled: 0, cap: 20 },
    { id: 3, name: 'Zumba Party', time: '19:00 PM', enrolled: 0, cap: 20 },
  ];

  classMembers: ClassMember[] = [];

  constructor(
    private authService: AuthService,
    private frontdeskApi: FrontdeskApiService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const session = this.authService.getCurrentSession();
    if (session) {
      this.currentUserName = session.username;
    }
    this.updateDateTime();
    setInterval(() => this.updateDateTime(), 1000);
    this.loadFrontdeskData();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  updateDateTime(): void {
    const now = new Date();
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    const dayName = days[now.getDay()];
    const date = now.getDate();
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    const time = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    this.currentDateTime = `${dayName}, ${date} ${month} ${year} · ${time}`;
  }

  loadFrontdeskData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      branches: this.frontdeskApi.getBranches(),
      members: this.frontdeskApi.getMembers(),
      classes: this.frontdeskApi.getClasses()
    }).subscribe({
      next: ({ branches, members, classes }) => {
        this.branches = branches;
        this.members = members;
        this.selectedBranchId = branches[0]?.branchId || 0;
        this.newMembers = members.filter((m) => m.status === 'PROSPECT').length;
        this.pendingConsents = members.filter(
          (m) => m.status === 'PROSPECT',
        ).length;
        this.expiringPlans = 0;
        
        // Load classes from API
        this.todaysClasses = classes
          .filter(c => c.status === 'ACTIVE')
          .map(c => ({
            id: c.classId || 0,
            name: c.classesName,
            time: c.classTime,
            enrolled: 0, // We will update this if we expand the class
            cap: c.capacity
          }));

        this.loadTodayAttendance();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage =
          error?.error?.message || 'Unable to load front-desk data.';
        this.isLoading = false;
      },
    });
  }

  loadTodayAttendance(): void {
    if (!this.selectedBranchId) {
      return;
    }

    this.frontdeskApi.getTodayAttendance(this.selectedBranchId).subscribe({
      next: (attendance) => {
        this.checkInsToday = attendance.length;
        this.recentCheckIns = attendance
          .slice(-8)
          .reverse()
          .map((item) => this.toCheckInRecord(item));
      },
      error: (error) => {
        this.errorMessage =
          error?.error?.message || 'Unable to load today attendance.';
      },
    });
  }

  handleSearch(event: Event): void {
    event.preventDefault();
    this.errorMessage = '';
    this.successMessage = '';

    const query = this.searchValue.trim().toLowerCase();
    if (!query) {
      return;
    }

    const member = this.members.find(
      (m) =>
        String(m.memberId) === query ||
        `mem-${m.memberId}`.toLowerCase() === query ||
        m.memName.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query) ||
        m.phone.includes(query),
    );

    if (!member) {
      this.memberFound = null;
      this.errorMessage = 'No member found for that name, ID, email, or phone.';
      return;
    }

    this.memberFound = this.toMemberData(member);
  }

  clearSearch(): void {
    this.searchValue = '';
    this.memberFound = null;
    this.errorMessage = '';
    this.successMessage = '';
  }

  confirmCheckIn(): void {
    if (!this.memberFound) {
      return;
    }

    this.frontdeskApi
      .checkIn({
        memberId: this.memberFound.memberId,
        branchId: this.memberFound.branchId || this.selectedBranchId,
        scanMethod: 'MANUAL',
      })
      .subscribe({
        next: (attendance) => {
          this.successMessage = `${this.memberFound?.name} checked in successfully.`;
          this.recentCheckIns = [
            this.toCheckInRecord(attendance),
            ...this.recentCheckIns,
          ];
          this.checkInsToday += 1;
          this.memberFound = null;
          this.searchValue = '';
        },
        error: (error) => {
          this.errorMessage =
            error?.error?.message || 'Check-in failed for this member.';
        },
      });
  }

  goToRegistration(): void {
    this.router.navigate(['/member-registration']);
  }

  toggleClassExpanded(classId: number): void {
    if (this.expandedClass === classId) {
      this.expandedClass = null;
      return;
    }
    this.expandedClass = classId;
    this.classMembers = [];
    
    // Fetch bookings for this class
    this.frontdeskApi.getBookingsByClass(classId).subscribe({
      next: (bookings) => {
        // Update the enrolled count
        const cls = this.todaysClasses.find(c => c.id === classId);
        if (cls) {
          cls.enrolled = bookings.length;
        }

        // Load members for these bookings
        this.classMembers = bookings.map(b => {
          const member = this.members.find(m => m.memberId === b.memberId);
          return {
            name: member?.memName || `Member #${b.memberId}`,
            status: b.bookingStatus === 'CONFIRMED' ? 'pending' : 'absent'
          };
        });
      },
      error: (err) => {
        console.error('Failed to load bookings for class', err);
      }
    });
  }

  markMemberStatus(
    member: ClassMember,
    status: 'present' | 'pending' | 'absent',
  ): void {
    member.status = status;
  }

  markAllPresent(): void {
    this.classMembers.forEach((member) => {
      member.status = 'present';
    });
  }

  // AC07: Export daily attendance CSV
  exportAttendanceCsv(): void {
    if (!this.selectedBranchId) return;
    this.frontdeskApi.exportDailyAttendanceCsv(this.selectedBranchId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.errorMessage = 'Failed to export attendance CSV.';
      },
    });
  }

  private toMemberData(member: MemberDto): MemberData {
    const branch = this.branches.find(
      (item) => item.branchId === member.homeBranchId,
    );
    const isBlocked = member.status !== 'ACTIVE';

    const data: MemberData = {
      id: `MEM-${member.memberId}`,
      memberId: Number(member.memberId),
      name: member.memName,
      plan: member.status === 'ACTIVE' ? 'Active Membership' : 'No Active Plan',
      branch: branch?.branchName || `Branch ${member.homeBranchId}`,
      branchId: member.homeBranchId,
      avatar: this.getInitials(member.memName),
      status: isBlocked ? 'blocked' : 'ok',
      alert: isBlocked ? 'No active membership. Check-in denied.' : undefined,
    };

    // AC05: Load real flags from backend
    if (member.memberId) {
      this.frontdeskApi.getMemberCheckInFlags(member.memberId).subscribe({
        next: (flags) => {
          if (flags.hasUnpaidDues) {
            data.hasUnpaidDues = true;
            data.dues = `₹${flags.unpaidDues}`;
          }
          if (flags.hasHealthNotes) {
            data.hasHealthNotes = true;
            data.healthNotes = flags.notes;
          }
          if (flags.consentRequired) {
            data.consentRequired = true;
            data.consentMessage = flags.requiresReconfirmation
              ? `Consent needs policy ${flags.consentCurrentVersion} reconfirmation.`
              : 'Consent missing or expired.';
          }
        },
      });
    }

    return data;
  }

  private toCheckInRecord(attendance: AttendanceDto): CheckInRecord {
    const member = this.members.find((m) => m.memberId === attendance.memberId);
    const name = member?.memName || `Member ${attendance.memberId}`;
    return {
      name,
      time: this.formatRelativeTime(attendance.checkInTime),
      method: attendance.scanMethod === 'QR' ? 'QR Code' : 'Manual',
      avatar: this.getInitials(name),
    };
  }

  private formatRelativeTime(value?: string): string {
    if (!value) {
      return 'Just now';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return 'Just now';
    }

    const minutes = Math.max(
      0,
      Math.floor((Date.now() - parsed.getTime()) / 60000),
    );
    if (minutes < 1) {
      return 'Just now';
    }
    if (minutes < 60) {
      return `${minutes} min ago`;
    }
    return `${Math.floor(minutes / 60)} hr ago`;
  }

  private getInitials(name: string): string {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
}
