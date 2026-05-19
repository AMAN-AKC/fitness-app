import { Component, OnInit } from '@angular/core';
import { FrontdeskApiService, ClassesDto, TrainerDto, ClassBookingDto, MemberDto } from '../../services/frontdesk-api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

// ... class items defined ...
export interface ClassItem {
  id: string;
  name: string;
  trainer: string;
  trainerId: number;
  trainerBio: string;
  trainerSpecialties: string;
  trainerRating: number;
  date: Date;
  time: string;
  duration: number;
  capacity: number;
  booked: number;
  level: string;
  price: number;
  image: string;
  category: string;
  prerequisites?: string;
  planEligibility?: string;
  weekdays: string;
}
@Component({
  selector: 'app-class-booking',
  templateUrl: './class-booking.component.html',
  styleUrls: ['./class-booking.component.css'],
  standalone: false
})
export class ClassBookingComponent implements OnInit {
  classes: ClassItem[] = [];
  filteredClasses: ClassItem[] = [];
  selectedClass: ClassItem | null = null;
  
  searchText = '';
  selectedCategory = 'ALL';
  selectedDay = '';
  selectedTimeSlot = '';
  selectedTrainerId = '';
  
  bookingDrawerOpen = false;
  showConfirmationOverlay = false;
  bookingsPanelExpanded = false;
  
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  
  member: MemberDto | null = null;
  myBookings: ClassBookingDto[] = [];
  trainersList: TrainerDto[] = [];

  categoryOptions = ['ALL', 'YOGA', 'ZUMBA', 'STRENGTH', 'CARDIO', 'PILATES', 'HIIT'];
  dayOptions = [
    { label: 'ALL DAYS', value: '' },
    { label: 'MON', value: 'MON' },
    { label: 'TUE', value: 'TUE' },
    { label: 'WED', value: 'WED' },
    { label: 'THU', value: 'THU' },
    { label: 'FRI', value: 'FRI' },
    { label: 'SAT', value: 'SAT' },
    { label: 'SUN', value: 'SUN' }
  ];
  timeOptions = [
    { label: 'ALL TIMES', value: '' },
    { label: 'MORNING', value: 'MORNING' },
    { label: 'AFTERNOON', value: 'AFTERNOON' },
    { label: 'EVENING', value: 'EVENING' }
  ];

  confirmedBookingDetails = {
    name: '',
    dateStr: '',
    timeStr: ''
  };

  constructor(
    private frontdeskApi: FrontdeskApiService,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.initializeClasses();
  }

  getCategory(className: string): 'YOGA' | 'STRENGTH' | 'CARDIO' | 'ZUMBA' | 'HIIT' | 'PILATES' {
    const name = className.toLowerCase();
    if (name.includes('yoga') || name.includes('meditation')) return 'YOGA';
    if (name.includes('zumba') || name.includes('dance')) return 'ZUMBA';
    if (name.includes('lift') || name.includes('power') || name.includes('pump')) return 'STRENGTH';
    if (name.includes('hiit') || name.includes('box')) return 'HIIT';
    if (name.includes('pilates')) return 'PILATES';
    return 'CARDIO';
  }

  getClassDateInCurrentWeek(weekdays: string): Date {
    const daysMap: { [key: string]: number } = {
      'mon': 1, 'tue': 2, 'wed': 3, 'thu': 4, 'fri': 5, 'sat': 6, 'sun': 0
    };
    
    const parts = weekdays.split(',');
    const firstDayStr = parts[0].toLowerCase().trim().slice(0, 3);
    const targetDayOfWeek = daysMap[firstDayStr] !== undefined ? daysMap[firstDayStr] : 1;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentDayOfWeek = today.getDay();
    
    let diff = targetDayOfWeek - currentDayOfWeek;
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + diff);
    return targetDate;
  }

  formatClassDate(d: Date): string {
    const weekday = d.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    const day = d.getDate();
    const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    return `${weekday}, ${day} ${month}`;
  }

  formatTimeRange(timeStr: string, durationMins: number): string {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    
    const startMinutesTotal = hours * 60 + minutes;
    const endMinutesTotal = startMinutesTotal + durationMins;
    
    const formatTime = (totalMinutes: number) => {
      let h = Math.floor(totalMinutes / 60) % 24;
      const m = totalMinutes % 60;
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      h = h ? h : 12;
      const mStr = m < 10 ? '0' + m : m;
      const hStr = h < 10 ? '0' + h : h;
      return `${hStr}:${mStr} ${ampm}`;
    };
    
    return `${formatTime(startMinutesTotal)} – ${formatTime(endMinutesTotal)} (${durationMins} MIN)`;
  }

  initializeClasses(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.frontdeskApi.getCurrentMember().subscribe({
      next: (member) => {
        this.member = member;
        const memberId = member.memberId;
        if (!memberId) {
          this.errorMessage = "Could not load member details.";
          this.isLoading = false;
          return;
        }

        forkJoin({
          classes: this.frontdeskApi.getClasses(),
          trainers: this.frontdeskApi.getTrainers(),
          bookings: this.frontdeskApi.getBookingsByMember(memberId)
        }).subscribe({
          next: ({ classes, trainers, bookings }) => {
            this.myBookings = bookings;
            this.trainersList = trainers;
            const activeClasses = classes.filter(c => c.status === 'ACTIVE');

            if (activeClasses.length === 0) {
              this.classes = [];
              this.filteredClasses = [];
              this.isLoading = false;
              return;
            }

            // Fetch bookings for each active class in parallel to know exact confirmed counts
            const classBookingRequests = activeClasses.map(c => 
              this.frontdeskApi.getBookingsByClass(c.classId!).pipe(
                map(bkgs => ({ classId: c.classId!, bookings: bkgs })),
                catchError(() => of({ classId: c.classId!, bookings: [] as ClassBookingDto[] }))
              )
            );

            forkJoin(classBookingRequests).subscribe({
              next: (classBookingsList) => {
                const classBookingsMap = new Map<number, ClassBookingDto[]>();
                classBookingsList.forEach(item => classBookingsMap.set(item.classId, item.bookings));

                const trainerMap = new Map<number, TrainerDto>();
                trainers.forEach(t => trainerMap.set(t.trainerId || 0, t));

                this.classes = activeClasses.map(c => {
                  const classBookings = classBookingsMap.get(c.classId!) || [];
                  const confirmedCount = classBookings.filter(b => b.bookingStatus === 'CONFIRMED').length;

                  const nameLower = c.className.toLowerCase();
                  let emoji = '💪';
                  if (nameLower.includes('yoga') || nameLower.includes('meditation')) emoji = '🧘';
                  else if (nameLower.includes('zumba') || nameLower.includes('dance')) emoji = '🎵';
                  else if (nameLower.includes('hiit') || nameLower.includes('box')) emoji = '🏃';
                  else if (nameLower.includes('pilates')) emoji = '🧘';

                  const category = this.getCategory(c.className);

                  return {
                    id: c.classId?.toString() || '',
                    name: c.className,
                    trainer: trainerMap.get(c.trainerId)?.trainerName || `Trainer #${c.trainerId}`,
                    trainerId: c.trainerId,
                    trainerBio: trainerMap.get(c.trainerId)?.bio || 'Certified Fitness Professional',
                    trainerSpecialties: trainerMap.get(c.trainerId)?.specialties || 'General Training',
                    trainerRating: Number(trainerMap.get(c.trainerId)?.rating || 4.5),
                    date: this.getClassDateInCurrentWeek(c.weekdays),
                    time: c.classTime,
                    duration: c.durationMins,
                    capacity: c.capacity,
                    booked: confirmedCount,
                    level: c.prerequisites ? 'Intermediate' : 'Beginner',
                    price: 0,
                    image: emoji,
                    category: category,
                    prerequisites: c.prerequisites,
                    planEligibility: c.planEligibility,
                    weekdays: c.weekdays
                  };
                });

                this.filterClasses();
                this.isLoading = false;
              },
              error: (err) => {
                this.errorMessage = 'Failed to load class booking details.';
                this.isLoading = false;
              }
            });
          },
          error: (err) => {
            this.errorMessage = err?.error?.message || 'Failed to load class data.';
            this.isLoading = false;
          }
        });
      },
      error: (err) => {
        this.errorMessage = 'Failed to load current logged-in member session.';
        this.isLoading = false;
      }
    });
  }

  filterClasses(): void {
    this.filteredClasses = this.classes.filter(c => {
      const matchSearch = !this.searchText || 
        c.name.toLowerCase().includes(this.searchText.toLowerCase()) ||
        c.trainer.toLowerCase().includes(this.searchText.toLowerCase());

      const matchCategory = this.selectedCategory === 'ALL' || c.category === this.selectedCategory;

      const matchDay = !this.selectedDay || c.weekdays.toUpperCase().includes(this.selectedDay);

      let matchTime = true;
      if (this.selectedTimeSlot) {
        const hour = parseInt(c.time.split(':')[0], 10);
        if (this.selectedTimeSlot === 'MORNING') {
          matchTime = hour < 12;
        } else if (this.selectedTimeSlot === 'AFTERNOON') {
          matchTime = hour >= 12 && hour < 16;
        } else if (this.selectedTimeSlot === 'EVENING') {
          matchTime = hour >= 16;
        }
      }

      const matchTrainer = !this.selectedTrainerId || c.trainerId === Number(this.selectedTrainerId);

      return matchSearch && matchCategory && matchDay && matchTime && matchTrainer;
    });
  }

  resetFilters(): void {
    this.searchText = '';
    this.selectedCategory = 'ALL';
    this.selectedDay = '';
    this.selectedTimeSlot = '';
    this.selectedTrainerId = '';
    this.filterClasses();
  }

  selectClass(cls: ClassItem): void {
    this.selectedClass = cls;
    this.bookingDrawerOpen = true;
    this.successMessage = '';
    this.errorMessage = '';
  }

  closeDrawer(): void {
    this.bookingDrawerOpen = false;
    this.selectedClass = null;
  }

  bookClass(): void {
    if (!this.selectedClass || !this.member || !this.member.memberId) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    
    this.frontdeskApi.bookClass({
      memberId: this.member.memberId,
      classId: Number(this.selectedClass.id)
    }).subscribe({
      next: (booking) => {
        this.confirmedBookingDetails = {
          name: this.selectedClass!.name,
          dateStr: this.formatClassDate(this.selectedClass!.date),
          timeStr: this.formatTimeRange(this.selectedClass!.time, this.selectedClass!.duration)
        };
        this.showConfirmationOverlay = true;
        this.bookingDrawerOpen = false;
        this.toastService.success(`CLASS BOOKING CONFIRMED FOR ${this.selectedClass!.name.toUpperCase()}`);
        this.initializeClasses(); // Refresh data and bookings list
      },
      error: (err) => {
        const errorMsg = err?.error?.message || 'Booking failed.';
        this.errorMessage = errorMsg;
        this.toastService.error(`BOOKING FAILED: ${errorMsg.toUpperCase()}`);
        this.isLoading = false;
      }
    });
  }

  isUserBooked(classId: string): boolean {
    return this.myBookings.some(b => b.classId.toString() === classId && b.bookingStatus === 'CONFIRMED');
  }

  isUserWaitlisted(classId: string): boolean {
    return this.myBookings.some(b => b.classId.toString() === classId && b.bookingStatus === 'WAITLISTED');
  }

  getMemberBooking(classId: string): ClassBookingDto | undefined {
    return this.myBookings.find(b => b.classId.toString() === classId && b.bookingStatus !== 'CANCELLED');
  }

  getClassStatus(cls: ClassItem): 'AVAILABLE' | 'ALMOST FULL' | 'FULL' | 'WAITLISTED' {
    if (this.isUserWaitlisted(cls.id)) {
      return 'WAITLISTED';
    }
    const remaining = cls.capacity - cls.booked;
    if (remaining === 0) {
      return 'FULL';
    }
    if (remaining <= 3) {
      return 'ALMOST FULL';
    }
    return 'AVAILABLE';
  }

  getClassStatusStyles(status: string): { bg: string, text: string } {
    switch(status) {
      case 'AVAILABLE': return { bg: '#00D26A', text: '#FFF' };
      case 'ALMOST FULL': return { bg: '#FFB800', text: '#111' };
      case 'FULL': return { bg: '#FF3B30', text: '#FFF' };
      case 'WAITLISTED': return { bg: '#7C3AED', text: '#FFF' };
      default: return { bg: '#00D26A', text: '#FFF' };
    }
  }

  getCategoryStyles(category: string): { bg: string, text: string } {
    switch(category) {
      case 'YOGA': return { bg: '#00D9FF', text: '#111' };
      case 'STRENGTH': return { bg: '#FFB800', text: '#111' };
      case 'CARDIO': return { bg: '#FF3B30', text: '#FFF' };
      case 'ZUMBA': return { bg: '#7C3AED', text: '#FFF' };
      case 'HIIT': return { bg: '#FFB800', text: '#111' };
      case 'PILATES': return { bg: '#FF006E', text: '#FFF' };
      default: return { bg: '#2563EB', text: '#FFF' };
    }
  }

  getCapacityPercent(cls: ClassItem): number {
    if (cls.capacity === 0) return 0;
    return Math.min(100, Math.round((cls.booked / cls.capacity) * 100));
  }

  getCapacityBarColor(cls: ClassItem): string {
    const pct = this.getCapacityPercent(cls);
    if (pct <= 60) return '#00D26A';
    if (pct <= 90) return '#FFB800';
    return '#FF3B30';
  }

  canCancelBooking(cls: any): boolean {
    const d = cls.date;
    const timeStr = cls.time;
    if (!d || !timeStr) return false;
    
    const [hours, minutes] = timeStr.split(':').map(Number);
    const classStart = new Date(d);
    classStart.setHours(hours, minutes, 0, 0);
    
    const now = new Date();
    const diffMs = classStart.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours >= 2;
  }

  get upcomingBookings() {
    return this.myBookings
      .filter(b => b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'WAITLISTED')
      .map(b => {
        const cls = this.classes.find(c => c.id === b.classId.toString());
        const mockCls = {
          date: cls ? cls.date : this.getClassDateInCurrentWeek('Mon'),
          time: cls ? cls.time : '07:00:00'
        };
        const canCancel = b.bookingStatus === 'CONFIRMED' && this.canCancelBooking(mockCls);
        
        return {
          bookingId: b.bookingId!,
          classId: b.classId,
          className: cls ? cls.name : `Class #${b.classId}`,
          category: cls ? cls.category : 'CARDIO',
          date: cls ? cls.date : this.getClassDateInCurrentWeek('Mon'),
          time: cls ? cls.time : '07:00:00',
          duration: cls ? cls.duration : 60,
          roomName: cls ? `Room ${cls.id}` : 'Room A',
          status: b.bookingStatus!,
          waitlistPosition: b.waitlistPosition,
          canCancel: canCancel
        };
      });
  }

  cancelBooking(bookingId: number): void {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    this.isLoading = true;
    this.frontdeskApi.cancelBooking(bookingId).subscribe({
      next: () => {
        this.successMessage = 'Booking cancelled successfully.';
        this.toastService.info('CLASS BOOKING CANCELLED SUCCESSFULLY.');
        this.initializeClasses(); // Refresh data
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        const errorMsg = err?.error?.message || 'Failed to cancel booking.';
        this.errorMessage = errorMsg;
        this.toastService.error(`CANCELLATION FAILED: ${errorMsg.toUpperCase()}`);
        this.isLoading = false;
        setTimeout(() => this.errorMessage = '', 4000);
      }
    });
  }

  viewMyBookings(): void {
    this.showConfirmationOverlay = false;
    this.bookingsPanelExpanded = true;
    setTimeout(() => {
      const el = document.getElementById('upcoming-bookings-panel');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  closeConfirmationOverlay(): void {
    this.showConfirmationOverlay = false;
  }
}
