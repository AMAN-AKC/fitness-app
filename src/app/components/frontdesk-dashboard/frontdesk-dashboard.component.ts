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

  todaysClasses: ClassRoster[] = [];

  classMembers: ClassMember[] = [];
  
  offlineCount = 0;

  constructor(
    private authService: AuthService,
    private frontdeskApi: FrontdeskApiService,
    public router: Router,
  ) {}

  ngOnInit(): void {
    const session = this.authService.getCurrentSession();
    if (session) {
      this.currentUserName = session.fullName || session.username;
    }
    this.updateDateTime();
    setInterval(() => this.updateDateTime(), 1000);
    this.loadFrontdeskData();
    this.checkOfflineQueue();
  }

  checkOfflineQueue(): void {
    this.offlineCount = this.frontdeskApi.getOfflineQueue().length;
  }

  syncOfflineData(): void {
    const queue = this.frontdeskApi.getOfflineQueue();
    if (queue.length === 0) return;

    this.isLoading = true;
    this.frontdeskApi.syncPendingCheckIns().subscribe({
        next: () => {
            this.frontdeskApi.clearOfflineQueue();
            this.checkOfflineQueue();
            this.successMessage = 'Offline data synced successfully!';
            this.loadTodayAttendance();
            this.isLoading = false;
        },
        error: () => {
            this.errorMessage = 'Failed to sync offline data. Server may be down.';
            this.isLoading = false;
        }
    });
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
            name: c.className,
            time: c.classTime,
            enrolled: 0, 
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

    const member = this.members.find((m) => {
      const mid = String(m.memberId);
      const name = (m.memName || '').toLowerCase();
      const email = (m.email || '').toLowerCase();
      const phone = (m.phone || '');
      
      return (
        mid === query ||
        `mem-${mid}` === query ||
        `m-${mid}` === query ||
        name.includes(query) ||
        email.includes(query) ||
        phone.includes(query)
      );
    });

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
            if (error.status === 0 || error.status === 504) {
                this.frontdeskApi.saveToOfflineQueue({
                    memberId: this.memberFound!.memberId,
                    branchId: this.selectedBranchId,
                    scanMethod: 'MANUAL'
                });
                this.checkOfflineQueue();
                this.successMessage = 'Network error: Check-in saved to offline queue.';
                this.memberFound = null;
            } else {
                this.errorMessage = error?.error?.message || 'Check-in failed for this member.';
            }
        },
      });
  }

  addHealthNote(): void {
    if (!this.memberFound) return;
    const note = prompt('Enter administrative health note (non-diagnostic):');
    if (!note) return;

    this.isLoading = true;
    this.frontdeskApi.getConsentStatus(this.memberFound.memberId).subscribe({
      next: (status) => {
        if (status.latestConsent?.consentId) {
          this.frontdeskApi.addAdministrativeNote(status.latestConsent.consentId, note).subscribe({
            next: () => {
              this.successMessage = 'Health note added successfully.';
              this.isLoading = false;
              if (this.memberFound) this.memberFound.healthNotes = note;
            },
            error: (err: any) => {
              this.errorMessage = err.error?.message || 'Failed to add note.';
              this.isLoading = false;
            }
          });
        } else {
          this.errorMessage = 'No active consent found to attach note to.';
          this.isLoading = false;
        }
      }
    });
  }

  confirmOverrideCheckIn(): void {
    if (!this.memberFound) return;
    const reason = prompt('Please provide a reason for the override:');
    if (!reason) return;

    this.isLoading = true;
    const session = this.authService.getCurrentSession();
    this.frontdeskApi.overrideCheckIn({
      memberId: this.memberFound.memberId,
      branchId: this.selectedBranchId,
      scanMethod: 'MANUAL'
    }, Number(session?.userId || 0), reason).subscribe({
      next: (attendance) => {
        this.successMessage = `OVERRIDE SUCCESS: ${this.memberFound?.name} checked in.`;
        this.recentCheckIns = [this.toCheckInRecord(attendance), ...this.recentCheckIns];
        this.checkInsToday += 1;
        this.memberFound = null;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Override check-in failed.';
        this.isLoading = false;
      }
    });
  }

  simulateQrScan(): void {
    const qrData = prompt('Scan QR Code (Simulated Member ID):');
    if (qrData) {
      this.searchValue = qrData;
      this.handleSearch(new Event('submit'));
    }
  }


  toggleClassExpanded(classId: number): void {
    if (this.expandedClass === classId) {
      this.expandedClass = null;
      return;
    }
    this.expandedClass = classId;
    this.classMembers = [];
    
    this.frontdeskApi.getBookingsByClass(classId).subscribe({
      next: (bookings) => {
        const cls = this.todaysClasses.find(c => c.id === classId);
        if (cls) {
          cls.enrolled = bookings.length;
        }

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
    member: any,
    status: 'present' | 'pending' | 'absent',
  ): void {
    if (status === 'present' && this.expandedClass) {
        const m = this.members.find(mem => mem.memName === member.name);
        if (m && m.memberId) {
            this.frontdeskApi.markClassAttendance(this.expandedClass, m.memberId, this.selectedBranchId).subscribe({
                next: () => {
                    member.status = 'present';
                    this.successMessage = `Attendance marked for ${member.name}`;
                    setTimeout(() => this.successMessage = '', 3000);
                },
                error: (err) => {
                    this.errorMessage = err.error?.message || 'Failed to mark attendance.';
                }
            });
        }
    } else {
        member.status = status;
    }
  }

  markAllPresent(): void {
    this.classMembers.forEach((member) => {
      member.status = 'present';
    });
  }

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
