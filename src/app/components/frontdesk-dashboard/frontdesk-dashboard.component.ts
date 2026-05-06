import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface MemberData {
  id: string;
  name: string;
  plan: string;
  branch: string;
  avatar: string;
  status: 'ok' | 'blocked';
  alert?: string;
  dues?: string;
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
  searchValue: string = '';
  memberFound: MemberData | null = null;
  expandedClass: number | null = null;
  currentDateTime: string = '';
  currentUserName: string = 'Guest';

  // KPI Data
  checkInsToday: number = 247;
  newMembers: number = 14;
  pendingConsents: number = 7;
  expiringPlans: number = 12;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  // Recent Check-ins
  recentCheckIns: CheckInRecord[] = [
    { name: 'Arjun Verma', time: '2 min ago', method: 'QR Code', avatar: 'AV' },
    { name: 'Meera Gupta', time: '5 min ago', method: 'Manual', avatar: 'MG' },
    {
      name: 'Siddharth N.',
      time: '12 min ago',
      method: 'QR Code',
      avatar: 'SN',
    },
    { name: 'Aditi Rao', time: '15 min ago', method: 'QR Code', avatar: 'AR' },
    { name: 'Karan Patel', time: '18 min ago', method: 'Manual', avatar: 'KP' },
  ];

  // Today's Classes
  todaysClasses: ClassRoster[] = [
    {
      id: 1,
      name: 'Morning Yoga Flow',
      time: '07:00 AM',
      enrolled: 18,
      cap: 20,
    },
    { id: 2, name: 'HIIT Intensity', time: '18:00 PM', enrolled: 20, cap: 20 },
    { id: 3, name: 'Zumba Party', time: '19:00 PM', enrolled: 15, cap: 20 },
  ];

  classMembers: ClassMember[] = [
    { name: 'Aditi Rao', status: 'present' },
    { name: 'John Doe', status: 'pending' },
    { name: 'Priya Singh', status: 'absent' },
  ];

  ngOnInit(): void {
    const session = this.authService.getCurrentSession();
    if (session) {
      this.currentUserName = session.username;
    }
    this.updateDateTime();
    setInterval(() => this.updateDateTime(), 1000);
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

  handleSearch(event: Event): void {
    event.preventDefault();
    if (!this.searchValue) return;

    // Mock response based on search value
    if (this.searchValue.toLowerCase().includes('exp')) {
      this.memberFound = {
        id: 'MEM-20230101',
        name: 'Rahul Kumar',
        plan: 'Gold Annual',
        branch: 'Indiranagar',
        avatar: 'RK',
        status: 'blocked',
        alert: '⚠ Membership Expired — Check-In Denied',
      };
    } else {
      this.memberFound = {
        id: 'MEM-20240422',
        name: 'Priya Singh',
        plan: 'Platinum Pro',
        branch: 'Indiranagar',
        avatar: 'PS',
        status: 'ok',
        dues: '₹2,400',
      };
    }
  }

  clearSearch(): void {
    this.searchValue = '';
    this.memberFound = null;
  }

  confirmCheckIn(): void {
    this.clearSearch();
    // Logic for confirming check-in would go here
  }

  toggleClassExpanded(classId: number): void {
    this.expandedClass = this.expandedClass === classId ? null : classId;
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
}
