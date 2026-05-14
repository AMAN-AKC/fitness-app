import { Component, OnInit } from '@angular/core';
import { FrontdeskApiService, ClassesDto, TrainerDto } from '../../services/frontdesk-api.service';
import { AuthService } from '../../services/auth.service';
import { forkJoin } from 'rxjs';

export interface ClassItem {
  id: string;
  name: string;
  trainer: string;
  date: string;
  time: string;
  duration: number;
  capacity: number;
  booked: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | string;
  price: number;
  image: string;
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
  filterLevel = 'All';
  searchText = '';
  bookingDrawerOpen = false;
  
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  levelOptions = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  constructor(
    private frontdeskApi: FrontdeskApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initializeClasses();
  }

  initializeClasses(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      classes: this.frontdeskApi.getClasses(),
      trainers: this.frontdeskApi.getTrainers()
    }).subscribe({
      next: ({ classes, trainers }) => {
        // Map trainers for quick lookup
        const trainerMap = new Map<number, string>();
        trainers.forEach(t => trainerMap.set(t.trainerId || 0, t.trainerName));

        this.classes = classes.filter(c => c.status === 'ACTIVE').map(c => {
          // Determine a random emoji based on class name heuristic
          const nameLower = c.className.toLowerCase();
          let emoji = '💪';
          if (nameLower.includes('yoga') || nameLower.includes('pilates')) emoji = '🧘';
          else if (nameLower.includes('zumba') || nameLower.includes('dance')) emoji = '🎵';
          else if (nameLower.includes('hiit') || nameLower.includes('cardio')) emoji = '🏃';

          return {
            id: c.classId?.toString() || '',
            name: c.className,
            trainer: trainerMap.get(c.trainerId) || `Trainer #${c.trainerId}`,
            date: c.startDate, // Ideally format this based on current week
            time: c.classTime,
            duration: c.durationMins,
            capacity: c.capacity,
            booked: Math.floor(Math.random() * (c.capacity / 2)), // Mock booked count for now until backend gives current bookings count
            level: c.prerequisites ? 'Intermediate' : 'Beginner', // Heuristic
            price: 0,
            image: emoji,
          };
        });
        
        this.filteredClasses = [...this.classes];
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to load classes.';
        this.isLoading = false;
      }
    });
  }

  filterClasses(): void {
    this.filteredClasses = this.classes.filter((cls) => {
      const matchLevel =
        this.filterLevel === 'All' || cls.level === this.filterLevel;
      const matchSearch =
        cls.name.toLowerCase().includes(this.searchText.toLowerCase()) ||
        cls.trainer.toLowerCase().includes(this.searchText.toLowerCase());
      return matchLevel && matchSearch;
    });
  }

  onSearchChange(): void {
    this.filterClasses();
  }

  onLevelChange(): void {
    this.filterClasses();
  }

  selectClass(cls: ClassItem): void {
    this.selectedClass = cls;
    this.bookingDrawerOpen = true;
    this.successMessage = '';
    this.errorMessage = '';
  }

  bookClass(): void {
    if (!this.selectedClass) return;
    
    const session = this.authService.getCurrentSession();
    if (!session || !session.userId) {
      this.errorMessage = "Please log in as a member to book classes.";
      return;
    }

    this.isLoading = true;
    this.frontdeskApi.bookClass({
      memberId: Number(session.userId),
      classId: Number(this.selectedClass.id)
    }).subscribe({
      next: () => {
        if(this.selectedClass) {
           this.selectedClass.booked += 1;
           this.successMessage = `Successfully booked ${this.selectedClass.name}`;
        }
        setTimeout(() => {
          this.bookingDrawerOpen = false;
          this.successMessage = '';
        }, 2000);
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Booking failed.';
        this.isLoading = false;
      }
    });
  }

  getAvailableSeats(cls: ClassItem): number {
    return cls.capacity - cls.booked;
  }

  getAvailabilityColor(cls: ClassItem): string {
    const available = this.getAvailableSeats(cls);
    if (available === 0) return 'text-[#DC2626]';
    if (available <= 3) return 'text-[#D97706]';
    return 'text-[#16A34A]';
  }
}
