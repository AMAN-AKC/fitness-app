import { Component, OnInit } from '@angular/core';

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
}

@Component({
  selector: 'app-class-schedule-page',
  templateUrl: './class-schedule-page.component.html',
  styleUrls: ['./class-schedule-page.component.css'],
})
export class ClassSchedulePageComponent implements OnInit {
  selectedDate = new Date().toISOString().split('T')[0];
  classes: ScheduledClass[] = [];
  hours = Array.from({ length: 14 }, (_, i) => i + 6); // 6 AM to 7 PM

  constructor() {}

  ngOnInit(): void {
    this.initializeClasses();
  }

  initializeClasses(): void {
    this.classes = [
      {
        id: '1',
        name: 'Yoga Flow',
        time: '06:00',
        duration: 60,
        trainer: 'Priya',
        capacity: 20,
        booked: 18,
        level: 'Beginner',
        color: 'bg-[#16A34A]',
      },
      {
        id: '2',
        name: 'HIIT',
        time: '07:15',
        duration: 45,
        trainer: 'Amit',
        capacity: 15,
        booked: 15,
        level: 'Advanced',
        color: 'bg-[#DC2626]',
      },
      {
        id: '3',
        name: 'Core Strength',
        time: '05:00',
        duration: 60,
        trainer: 'Rajesh',
        capacity: 25,
        booked: 12,
        level: 'Intermediate',
        color: 'bg-[#2563EB]',
      },
      {
        id: '4',
        name: 'Zumba',
        time: '06:30',
        duration: 60,
        trainer: 'Neha',
        capacity: 30,
        booked: 28,
        level: 'Beginner',
        color: 'bg-[#D97706]',
      },
    ];
  }

  getClassesForTime(hour: number): ScheduledClass[] {
    return this.classes.filter((c) => {
      const classHour = parseInt(c.time.split(':')[0]);
      return classHour === hour;
    });
  }

  getClassPosition(cls: ScheduledClass): number {
    const [hour, minute] = cls.time.split(':').map(Number);
    return hour + minute / 60;
  }

  getClassHeight(duration: number): number {
    return (duration / 60) * 80; // 80px per hour
  }

  getAvailableSeats(cls: ScheduledClass): number {
    return cls.capacity - cls.booked;
  }

  previousDate(): void {
    const date = new Date(this.selectedDate);
    date.setDate(date.getDate() - 1);
    this.selectedDate = date.toISOString().split('T')[0];
  }

  nextDate(): void {
    const date = new Date(this.selectedDate);
    date.setDate(date.getDate() + 1);
    this.selectedDate = date.toISOString().split('T')[0];
  }

  bookClass(cls: ScheduledClass): void {
    if (cls.booked < cls.capacity) {
      cls.booked += 1;
    }
  }
}
