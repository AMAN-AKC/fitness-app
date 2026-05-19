import { Component, OnInit } from '@angular/core';
import { ToastService } from '../../services/toast.service';

export interface Trainer {
  id: string;
  name: string;
  specialty: string;
  certifications: string[];
  availability: string;
  rating: number;
  reviews: number;
  price: number;
  image: string;
  bio: string;
  experience: number;
}

export interface TrainerReview {
  id: string;
  memberName: string;
  rating: number;
  comment: string;
  date: string;
}

@Component({
  selector: 'app-trainer-profile',
  templateUrl: './trainer-profile.component.html',
  styleUrls: ['./trainer-profile.component.css'],
})
export class TrainerProfileComponent implements OnInit {
  selectedTrainer: Trainer | null = null;
  trainers: Trainer[] = [];
  reviews: TrainerReview[] = [];
  isBookingDrawerOpen = false;
  selectedDate = '';
  selectedSlot = '';

  availableSlots = [
    '06:00 AM',
    '07:00 AM',
    '08:00 AM',
    '05:00 PM',
    '06:00 PM',
    '07:00 PM',
  ];

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.initializeTrainers();
  }

  initializeTrainers(): void {
    this.trainers = [
      {
        id: '1',
        name: 'Priya Sharma',
        specialty: 'Weight Training & Strength',
        certifications: ['NASM-CPT', 'Precision Nutrition Level 1'],
        availability: 'Mon - Sat, 6 AM - 8 PM',
        rating: 4.9,
        reviews: 47,
        price: 500,
        image: '👩‍🏫',
        bio: 'Specialized in helping beginners build strength and confidence. 8+ years of coaching experience.',
        experience: 8,
      },
      {
        id: '2',
        name: 'Rajesh Kumar',
        specialty: 'Yoga & Flexibility',
        certifications: ['RYT-200', 'Yin Yoga Specialization'],
        availability: 'Daily, 6 AM - 6 PM',
        rating: 4.8,
        reviews: 32,
        price: 300,
        image: '🧘',
        bio: 'Expert in flexibility training and injury recovery. Holistic approach to fitness.',
        experience: 10,
      },
      {
        id: '3',
        name: 'Amit Singh',
        specialty: 'HIIT & Cardio',
        certifications: ['ACE-CPT', 'ISSF Sports Nutrition'],
        availability: 'Tue - Sun, 5 AM - 7 PM',
        rating: 4.7,
        reviews: 58,
        price: 450,
        image: '🏃',
        bio: 'High-energy coach focused on fat loss and cardiovascular endurance.',
        experience: 6,
      },
    ];

    this.reviews = [
      {
        id: '1',
        memberName: 'Neha Desai',
        rating: 5,
        comment: 'Amazing trainer! Very professional and motivating.',
        date: '2 weeks ago',
      },
      {
        id: '2',
        memberName: 'Arjun Nair',
        rating: 5,
        comment: "Best PT sessions I've had. Highly recommended!",
        date: '1 month ago',
      },
      {
        id: '3',
        memberName: 'Sneha Gupta',
        rating: 4,
        comment: 'Great guidance on form and technique.',
        date: '2 months ago',
      },
    ];

    this.selectedTrainer = this.trainers[0];
  }

  selectTrainer(trainer: Trainer): void {
    this.selectedTrainer = trainer;
  }

  openBookingDrawer(): void {
    this.isBookingDrawerOpen = true;
  }

  closeBookingDrawer(): void {
    this.isBookingDrawerOpen = false;
    this.selectedDate = '';
    this.selectedSlot = '';
  }

  bookSession(): void {
    if (this.selectedDate && this.selectedSlot && this.selectedTrainer) {
      this.toastService.success(`PT SESSION BOOKED WITH ${this.selectedTrainer.name.toUpperCase()} ON ${this.selectedDate} AT ${this.selectedSlot}`);
      this.closeBookingDrawer();
    } else {
      this.toastService.warning('PLEASE SELECT BOTH DATE AND TIME SLOT.');
    }
  }

  getRatingColor(rating: number): string {
    if (rating >= 4.7) return 'text-[#16A34A]';
    if (rating >= 4.0) return 'text-[#2563EB]';
    return 'text-[#D97706]';
  }
}
