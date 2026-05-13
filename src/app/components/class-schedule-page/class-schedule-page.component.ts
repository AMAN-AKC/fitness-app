import { Component, OnInit } from '@angular/core';
import {
  FrontdeskApiService,
  ClassesDto,
  ClassBookingDto,
} from '../../services/frontdesk-api.service';
import { BranchDto } from '../../services/admin-api.service';
import { AdminApiService } from '../../services/admin-api.service';
import { forkJoin } from 'rxjs';

export type ViewMode = 'daily' | 'weekly' | 'monthly';

export interface ScheduledClass {
  id: string;
  name: string;
  time: string;
  duration: number;
  trainer: string;
  capacity: number;
  booked: number;
  level: string;
  color: string;
  date: string;
  status: string;
  branchId: number;
  trainerId: number;
}

@Component({
  selector: 'app-class-schedule-page',
  templateUrl: './class-schedule-page.component.html',
  styleUrls: ['./class-schedule-page.component.css'],
  standalone: false,
})
export class ClassSchedulePageComponent implements OnInit {
  viewMode: ViewMode = 'daily';
  selectedDate = new Date().toISOString().split('T')[0];
  allClasses: ScheduledClass[] = [];
  filteredClasses: ScheduledClass[] = [];
  hours = Array.from({ length: 14 }, (_, i) => i + 6);
  weekDays: string[] = [];
  monthDays: { date: string; dayNum: number; isToday: boolean }[] = [];
  isLoading = false;
  errorMessage = '';

  branches: BranchDto[] = [];
  trainerNames: Map<number, string> = new Map();
  selectedBranchId: number | null = null;
  selectedTrainerId: number | null = null;
  statusFilter: 'ALL' | 'ACTIVE' | 'CANCELLED' = 'ALL';

  private bookingCounts: Map<string, number> = new Map();

  constructor(
    private frontdeskApi: FrontdeskApiService,
    private adminApi: AdminApiService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    forkJoin({
      classes: this.frontdeskApi.getClasses(),
      trainers: this.frontdeskApi.getTrainers(),
      branches: this.frontdeskApi.getBranches(),
    }).subscribe({
      next: ({ classes, trainers, branches }) => {
        this.branches = branches;
        trainers.forEach((t) =>
          this.trainerNames.set(t.trainerId || 0, t.trainerName),
        );

        const colors = [
          'bg-[#16A34A]',
          'bg-[#DC2626]',
          'bg-[#2563EB]',
          'bg-[#D97706]',
          'bg-[#7C3AED]',
        ];

        this.allClasses = classes.map((c, i) => {
          const [hour, min] = (c.classTime || '00:00').split(':');
          return {
            id: c.classId?.toString() || '',
            name: c.classesName,
            time: `${hour}:${min}`,
            duration: c.durationMins,
            trainer:
              this.trainerNames.get(c.trainerId) ||
              `Trainer #${c.trainerId}`,
            capacity: c.capacity,
            booked: 0,
            level: c.prerequisites ? 'Intermediate' : 'Beginner',
            color: colors[i % colors.length],
            date: c.startDate,
            status: c.status || 'ACTIVE',
            branchId: c.branchId,
            trainerId: c.trainerId,
          };
        });

        // Load real booking counts
        this.loadBookingCounts(classes);
        this.applyFilters();
        this.updateCalendarData();
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.message || 'Failed to load class data';
        this.isLoading = false;
      },
    });
  }

  private loadBookingCounts(classes: ClassesDto[]): void {
    classes.forEach((c) => {
      if (!c.classId) return;
      this.frontdeskApi.getBookingsByClass(c.classId).subscribe({
        next: (bookings) => {
          const confirmed = bookings.filter(
            (b) => b.bookingStatus === 'CONFIRMED',
          ).length;
          this.bookingCounts.set(c.classId!.toString(), confirmed);
          const cls = this.allClasses.find(
            (x) => x.id === c.classId!.toString(),
          );
          if (cls) cls.booked = confirmed;
        },
      });
    });
  }

  // ---------- FILTERS ----------

  applyFilters(): void {
    this.filteredClasses = this.allClasses.filter((c) => {
      if (
        this.selectedBranchId &&
        c.branchId !== this.selectedBranchId
      )
        return false;
      if (
        this.selectedTrainerId &&
        c.trainerId !== this.selectedTrainerId
      )
        return false;
      if (this.statusFilter !== 'ALL' && c.status !== this.statusFilter)
        return false;
      return true;
    });
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  // ---------- VIEW MODE ----------

  setViewMode(mode: ViewMode): void {
    this.viewMode = mode;
    this.updateCalendarData();
  }

  updateCalendarData(): void {
    if (this.viewMode === 'weekly') {
      this.buildWeekDays();
    } else if (this.viewMode === 'monthly') {
      this.buildMonthDays();
    }
  }

  // ---------- DAILY VIEW ----------

  getClassesForTime(hour: number): ScheduledClass[] {
    return this.filteredClasses.filter((c) => {
      const classHour = parseInt(c.time.split(':')[0]);
      return classHour === hour && c.status === 'ACTIVE';
    });
  }

  getClassHeight(duration: number): number {
    return (duration / 60) * 80;
  }

  getAvailableSeats(cls: ScheduledClass): number {
    return cls.capacity - cls.booked;
  }

  // ---------- WEEKLY VIEW ----------

  private buildWeekDays(): void {
    const date = new Date(this.selectedDate);
    const dayOfWeek = date.getDay();
    const monday = new Date(date);
    monday.setDate(date.getDate() - ((dayOfWeek + 6) % 7));
    this.weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      this.weekDays.push(d.toISOString().split('T')[0]);
    }
  }

  getClassesForDay(dateStr: string): ScheduledClass[] {
    return this.filteredClasses.filter(
      (c) => c.date === dateStr && c.status === 'ACTIVE',
    );
  }

  formatDayLabel(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
    });
  }

  // ---------- MONTHLY VIEW ----------

  private buildMonthDays(): void {
    const date = new Date(this.selectedDate);
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = new Date().toISOString().split('T')[0];
    this.monthDays = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      this.monthDays.push({
        date: dateStr,
        dayNum: d,
        isToday: dateStr === todayStr,
      });
    }
  }

  getClassCountForDay(dateStr: string): number {
    return this.filteredClasses.filter(
      (c) => c.date === dateStr && c.status === 'ACTIVE',
    ).length;
  }

  getMonthLabel(): string {
    const d = new Date(this.selectedDate);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  // ---------- NAVIGATION ----------

  previousDate(): void {
    const date = new Date(this.selectedDate);
    if (this.viewMode === 'monthly') {
      date.setMonth(date.getMonth() - 1);
    } else if (this.viewMode === 'weekly') {
      date.setDate(date.getDate() - 7);
    } else {
      date.setDate(date.getDate() - 1);
    }
    this.selectedDate = date.toISOString().split('T')[0];
    this.updateCalendarData();
  }

  nextDate(): void {
    const date = new Date(this.selectedDate);
    if (this.viewMode === 'monthly') {
      date.setMonth(date.getMonth() + 1);
    } else if (this.viewMode === 'weekly') {
      date.setDate(date.getDate() + 7);
    } else {
      date.setDate(date.getDate() + 1);
    }
    this.selectedDate = date.toISOString().split('T')[0];
    this.updateCalendarData();
  }

  get uniqueTrainerIds(): number[] {
    return [...new Set(this.allClasses.map((c) => c.trainerId))];
  }

  getTrainerName(id: number): string {
    return this.trainerNames.get(id) || `Trainer #${id}`;
  }
}
