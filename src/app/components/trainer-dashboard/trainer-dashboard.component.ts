import { Component, OnInit } from '@angular/core';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { FrontdeskApiService, ClassesDto, TrainerDto, PtSessionDto, MemberDto } from '../../services/frontdesk-api.service';
import { forkJoin } from 'rxjs';

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

interface WeekDayInfo {
  label: string;
  name: string;
  dateStr: string;
}

@Component({
  selector: 'app-trainer-dashboard',
  templateUrl: './trainer-dashboard.component.html',
  styleUrls: ['./trainer-dashboard.component.css'],
  standalone: false,
})
export class TrainerDashboardComponent implements OnInit {
  subAlertOpen: boolean = false;
  expandedClass: any = null;
  activeNotes: number | null = null;

  isLoading: boolean = false;
  trainer: TrainerDto | null = null;
  classesList: ClassesDto[] = [];
  ptSessionsList: PtSessionDto[] = [];
  membersList: MemberDto[] = [];
  roomsList: any[] = [];

  currentWeekDays: WeekDayInfo[] = [];
  currentWeekRangeLabel: string = '';

  // KPI Data
  classesThisWeek: number = 0;
  ptSessionsToday: number = 0;
  sessionTimes: string[] = [];

  ptRequests: PTRequest[] = [];
  completedSessions: CompletedSession[] = [];
  chartData: number[] = [0, 0, 0, 0, 0, 0, 0];

  constructor(
    private toastService: ToastService,
    private authService: AuthService,
    private frontdeskApi: FrontdeskApiService
  ) {}

  ngOnInit(): void {
    this.initCurrentWeek();
    this.loadDashboardData();
  }

  initCurrentWeek(): void {
    const weekdays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const today = new Date();
    const day = today.getDay();
    // Monday is index 1. If Sunday (0), day offset should be -6. Otherwise 1 - day.
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));

    this.currentWeekDays = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      const dayNum = nextDay.getDate();
      this.currentWeekDays.push({
        label: `${weekdays[i]} ${dayNum}`,
        name: weekdays[i],
        dateStr: nextDay.toISOString().split('T')[0]
      });
    }

    const startOfWeekStr = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
    const endOfWeek = new Date(monday);
    endOfWeek.setDate(monday.getDate() + 6);
    const endOfWeekStr = endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
    this.currentWeekRangeLabel = `WEEK OF ${startOfWeekStr}–${endOfWeekStr}`;
  }

  loadDashboardData(): void {
    const session = this.authService.getCurrentSession();
    if (!session || !session.userId) {
      this.toastService.error('NO ACTIVE SESSION FOUND. PLEASE LOGIN.');
      return;
    }

    this.isLoading = true;
    this.frontdeskApi.getTrainerByUserId(Number(session.userId)).subscribe({
      next: (trainer) => {
        this.trainer = trainer;
        const trainerId = Number(trainer.trainerId);
        
        forkJoin({
          classes: this.frontdeskApi.getClassesByTrainer(trainerId),
          ptSessions: this.frontdeskApi.getPtSessionsByTrainer(trainerId),
          members: this.frontdeskApi.getMembers(),
          rooms: this.frontdeskApi.getRooms()
        }).subscribe({
          next: ({ classes, ptSessions, members, rooms }) => {
            this.classesList = classes;
            this.ptSessionsList = ptSessions;
            this.membersList = members;
            this.roomsList = rooms;

            this.processDashboardState();
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Error loading dashboard sub-data:', err);
            this.toastService.error('FAILED TO LOAD TRAINER DATA.');
            this.isLoading = false;
          }
        });
      },
      error: (err) => {
        console.error('Error loading trainer profile:', err);
        this.toastService.error('FAILED TO LOAD TRAINER PROFILE.');
        this.isLoading = false;
      }
    });
  }

  processDashboardState(): void {
    const todayStr = new Date().toISOString().split('T')[0];
    const memberMap = new Map<number, MemberDto>();
    this.membersList.forEach(m => memberMap.set(Number(m.memberId), m));

    // KPI: PT sessions today
    const sessionsToday = this.ptSessionsList.filter(s => {
      const isApprovedOrCompleted = s.status === 'APPROVED' || s.status === 'COMPLETED';
      return isApprovedOrCompleted && s.scheduledAt && s.scheduledAt.startsWith(todayStr);
    });
    this.ptSessionsToday = sessionsToday.length;

    // KPI: session times today
    this.sessionTimes = sessionsToday.map(s => {
      const date = new Date(s.scheduledAt);
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    });

    // KPI: classes this week count
    let classesCount = 0;
    this.currentWeekDays.forEach(day => {
      classesCount += this.getClassesForDay(day.name, day.dateStr).length;
    });
    this.classesThisWeek = classesCount;

    // PT Requests mapping
    const requestedPt = this.ptSessionsList.filter(s => s.status === 'REQUESTED');
    this.ptRequests = requestedPt.map(s => {
      const member = memberMap.get(s.memberId);
      const mName = member?.memName || `Member #${s.memberId}`;
      const initials = mName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
      const scheduledDate = new Date(s.scheduledAt);
      return {
        id: s.sessionId || 0,
        name: mName,
        avatar: initials,
        pkg: `${s.durationMins} MIN`,
        date: scheduledDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
        time: scheduledDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        note: s.trainerNotes || '',
        status: 'pending'
      };
    });

    // Completed Sessions mapping
    const completedPt = this.ptSessionsList.filter(s => s.status === 'COMPLETED');
    this.completedSessions = completedPt.map(s => {
      const member = memberMap.get(s.memberId);
      const mName = member?.memName || `Member #${s.memberId}`;
      const scheduledDate = new Date(s.scheduledAt);
      return {
        id: s.sessionId || 0,
        name: mName,
        date: scheduledDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
        duration: `${s.durationMins} min`,
        rating: 5,
        notes: s.trainerNotes || ''
      };
    });

    // Calculate weekly stats chartData
    this.calculateChartData();
  }

  calculateChartData(): void {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    const weekdaysList = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    
    this.classesList.forEach(c => {
      if (c.status !== 'CANCELLED' && c.weekdays) {
        const days = c.weekdays.toUpperCase().split(',').map(d => d.trim());
        days.forEach(day => {
          const idx = weekdaysList.indexOf(day);
          if (idx !== -1) {
            counts[idx]++;
          }
        });
      }
    });

    this.ptSessionsList.forEach(s => {
      if (s.status === 'COMPLETED' || s.status === 'APPROVED') {
        const date = new Date(s.scheduledAt);
        let dayIdx = date.getDay() - 1;
        if (dayIdx === -1) dayIdx = 6; // Sunday
        
        const sessionTime = date.getTime();
        const startOfWeek = new Date(this.currentWeekDays[0].dateStr).getTime();
        const endOfWeek = new Date(this.currentWeekDays[6].dateStr).getTime() + 86400000;
        if (sessionTime >= startOfWeek && sessionTime <= endOfWeek) {
          counts[dayIdx]++;
        }
      }
    });

    this.chartData = counts.map(count => Math.max(10, Math.min(count * 20, 80)));
  }

  getClassesForDay(dayName: string, dateStr: string): ClassesDto[] {
    const fullDayName = this.mapToFullDayName(dayName);
    return this.classesList.filter(c => {
      if (c.status === 'CANCELLED') return false;
      if (c.startDate && dateStr < c.startDate) return false;
      if (c.endDate && dateStr > c.endDate) return false;
      
      const days = c.weekdays.toUpperCase().split(',').map(d => d.trim());
      return days.includes(fullDayName);
    });
  }

  mapToFullDayName(shortName: string): string {
    const map: { [key: string]: string } = {
      'MON': 'MONDAY',
      'TUE': 'TUESDAY',
      'WED': 'WEDNESDAY',
      'THU': 'THURSDAY',
      'FRI': 'FRIDAY',
      'SAT': 'SATURDAY',
      'SUN': 'SUNDAY'
    };
    return map[shortName] || shortName;
  }

  getCategoryClass(className: string): string {
    const name = className.toLowerCase();
    if (name.includes('yoga') || name.includes('meditation')) return 'block-yoga';
    if (name.includes('zumba') || name.includes('dance')) return 'block-zumba';
    if (name.includes('lift') || name.includes('power') || name.includes('pump') || name.includes('strength')) return 'block-strength';
    return 'block-cardio';
  }

  closeSubAlert(): void {
    this.subAlertOpen = false;
  }

  toggleClassExpanded(cls: any): void {
    if (this.expandedClass && this.expandedClass.classId === cls.classId) {
      this.expandedClass = null;
    } else {
      this.expandedClass = cls;
      
      // Fetch Room / Facility Name
      const room = this.roomsList.find(r => r.facilityId === cls.roomId);
      this.expandedClass.roomName = room ? room.facilityName : `Room #${cls.roomId}`;
      
      // Fetch enrolled count dynamically
      this.frontdeskApi.getBookingsByClass(cls.classId).subscribe({
        next: (bookings) => {
          const activeBookings = bookings.filter(b => b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'WAITLISTED');
          this.expandedClass.enrolledCount = activeBookings.length;
        },
        error: () => {
          this.expandedClass.enrolledCount = 0;
        }
      });
    }
  }

  toggleNotes(sessionId: number): void {
    this.activeNotes = this.activeNotes === sessionId ? null : sessionId;
  }

  handleRequestAction(id: number, action: 'accepted' | 'declined'): void {
    const status = action === 'accepted' ? 'APPROVED' : 'REJECTED';
    this.frontdeskApi.updatePtSessionStatus(id, status).subscribe({
      next: () => {
        this.toastService.success(`PT SESSION REQUEST ${status} SUCCESSFULLY.`);
        this.loadDashboardData();
      },
      error: (err) => {
        console.error('Failed to update PT request status:', err);
        this.toastService.error('FAILED TO UPDATE PT REQUEST STATUS.');
      }
    });
  }

  getPendingRequests(): number {
    return this.ptRequests.length;
  }

  getRatingStars(rating: number | null): Array<number> {
    if (!rating) return [];
    return Array.from({ length: rating }, (_, i) => i);
  }

  getEmptyStars(rating: number | null): Array<number> {
    if (!rating) return [];
    return Array.from({ length: 5 - rating }, (_, i) => i);
  }

  saveNotes(sessionId: number, notesValue: string): void {
    this.frontdeskApi.updatePtSessionStatus(sessionId, 'COMPLETED', notesValue).subscribe({
      next: () => {
        this.activeNotes = null;
        this.toastService.success('TRAINING SESSION NOTES UPDATED SUCCESSFULLY.');
        this.loadDashboardData();
      },
      error: (err) => {
        console.error('Failed to update PT session notes:', err);
        this.toastService.error('FAILED TO SAVE PT SESSION NOTES.');
      }
    });
  }

  cancelNotes(): void {
    this.activeNotes = null;
  }
}
