import { Component, OnInit } from '@angular/core';

export interface ClassItem {
  id: string;
  name: string;
  trainer: string;
  date: string;
  time: string;
  duration: number;
  capacity: number;
  booked: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  price: number;
  image: string;
}

@Component({
  selector: 'app-class-booking',
  templateUrl: './class-booking.component.html',
  styleUrls: ['./class-booking.component.css'],
})
export class ClassBookingComponent implements OnInit {
  classes: ClassItem[] = [];
  filteredClasses: ClassItem[] = [];
  selectedClass: ClassItem | null = null;
  filterLevel = 'All';
  searchText = '';
  bookingDrawerOpen = false;

  levelOptions = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  constructor() {}

  ngOnInit(): void {
    this.initializeClasses();
  }

  initializeClasses(): void {
    this.classes = [
      {
        id: '1',
        name: 'Morning Yoga Flow',
        trainer: 'Priya Sharma',
        date: '2025-05-20',
        time: '06:00 AM',
        duration: 60,
        capacity: 20,
        booked: 18,
        level: 'Beginner',
        price: 400,
        image: '🧘',
      },
      {
        id: '2',
        name: 'HIIT Intensity',
        trainer: 'Amit Singh',
        date: '2025-05-20',
        time: '07:00 AM',
        duration: 45,
        capacity: 15,
        booked: 15,
        level: 'Advanced',
        price: 500,
        image: '🏃',
      },
      {
        id: '3',
        name: 'Core Strength',
        trainer: 'Rajesh Kumar',
        date: '2025-05-20',
        time: '05:00 PM',
        duration: 60,
        capacity: 25,
        booked: 12,
        level: 'Intermediate',
        price: 450,
        image: '💪',
      },
      {
        id: '4',
        name: 'Zumba Party',
        trainer: 'Neha Singh',
        date: '2025-05-21',
        time: '06:30 PM',
        duration: 60,
        capacity: 30,
        booked: 28,
        level: 'Beginner',
        price: 350,
        image: '🎵',
      },
      {
        id: '5',
        name: 'Pilates Basics',
        trainer: 'Sophia Lee',
        date: '2025-05-21',
        time: '09:00 AM',
        duration: 50,
        capacity: 18,
        booked: 8,
        level: 'Beginner',
        price: 420,
        image: '🤸',
      },
    ];
    this.filteredClasses = [...this.classes];
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
  }

  bookClass(): void {
    if (
      this.selectedClass &&
      this.selectedClass.booked < this.selectedClass.capacity
    ) {
      this.selectedClass.booked += 1;
      console.log(`Booked ${this.selectedClass.name}`);
      this.bookingDrawerOpen = false;
    }
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
