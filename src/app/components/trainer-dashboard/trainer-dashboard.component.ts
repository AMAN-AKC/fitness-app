import { Component, OnInit } from '@angular/core';

interface PTRequest {
  id: number;
  name: string;
  avatar: string;
  pkg: string;
  date: string;
  time: string;
  note: string;
  status: 'pending' | 'accepted' | 'declined';
}

interface CompletedSession {
  id: number;
  name: string;
  date: string;
  duration: string;
  rating: number | null;
  notes: string;
}

interface ClassSchedule {
  day: string;
  date: number;
  classes: Array<{ name: string; time: string; color: string; isSubstitute?: boolean }>;
}

@Component({
  selector: 'app-trainer-dashboard',
  templateUrl: './trainer-dashboard.component.html',
  styleUrls: ['./trainer-dashboard.component.css'],
  standalone: false,
})
export class TrainerDashboardComponent implements OnInit {
  subAlertOpen: boolean = true;
  expandedClass: number | null = null;
  activeNotes: number | null = null;
  weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // KPI Data
  classesThisWeek: number = 8;
  ptSessionsToday: number = 3;
  sessionTimes = ['10:00 AM', '2:00 PM', '5:00 PM'];

  ptRequests: PTRequest[] = [
    {
      id: 1,
      name: 'David Chen',
      avatar: 'DC',
      pkg: '10 Sessions',
      date: '24 Apr 2026',
      time: '18:00 PM',
      note: 'Looking to improve my deadlift form.',
      status: 'pending',
    },
    {
      id: 2,
      name: 'Meera Gupta',
      avatar: 'MG',
      pkg: '5 Sessions',
      date: '25 Apr 2026',
      time: '09:00 AM',
      note: '',
      status: 'pending',
    },
  ];

  completedSessions: CompletedSession[] = [
    {
      id: 1,
      name: 'Priya Singh',
      date: '21 Apr 2026',
      duration: '60 min',
      rating: 5,
      notes: 'Improved squat form significantly. Needs work on ankle mobility.',
    },
    {
      id: 2,
      name: 'Arjun Verma',
      date: '20 Apr 2026',
      duration: '45 min',
      rating: 4,
      notes: 'Good session, focused on upper body strength.',
    },
    {
      id: 3,
      name: 'Sneha Reddy',
      date: '18 Apr 2026',
      duration: '60 min',
      rating: null,
      notes: '',
    },
  ];

  chartData = [40, 70, 100, 30, 60, 0, 0];

  constructor() {}

  ngOnInit(): void {}

  closeSubAlert(): void {
    this.subAlertOpen = false;
  }

  toggleClassExpanded(classId: number): void {
    this.expandedClass = this.expandedClass === classId ? null : classId;
  }

  toggleNotes(sessionId: number): void {
    this.activeNotes = this.activeNotes === sessionId ? null : sessionId;
  }

  handleRequestAction(id: number, action: 'accepted' | 'declined'): void {
    const request = this.ptRequests.find((r) => r.id === id);
    if (request) {
      request.status = action;
    }
  }

  getPendingRequests(): number {
    return this.ptRequests.filter((r) => r.status === 'pending').length;
  }

  getRatingStars(rating: number | null): Array<number> {
    if (!rating) return [];
    return Array.from({ length: rating }, (_, i) => i);
  }

  getEmptyStars(rating: number | null): Array<number> {
    if (!rating) return [];
    return Array.from({ length: 5 - rating }, (_, i) => i);
  }

  saveNotes(sessionId: number): void {
    this.activeNotes = null;
  }

  cancelNotes(): void {
    this.activeNotes = null;
  }
}
