import { Component, OnInit } from '@angular/core';
import { ToastService } from '../../services/toast.service';
import { FrontdeskApiService, MemberDto, TrainerDto } from '../../services/frontdesk-api.service';
import { AuthService } from '../../services/auth.service';

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
  acceptingPtClients?: boolean;
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
  standalone: false
})
export class TrainerProfileComponent implements OnInit {
  selectedTrainer: Trainer | null = null;
  trainers: Trainer[] = [];
  reviews: TrainerReview[] = [];
  isBookingDrawerOpen = false;
  selectedDate = '';
  selectedSlot = '';
  member: MemberDto | null = null;

  availableSlots = [
    '06:00 AM',
    '07:00 AM',
    '08:00 AM',
    '05:00 PM',
    '06:00 PM',
    '07:00 PM',
  ];

  constructor(
    private frontdeskApi: FrontdeskApiService,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadMemberAndTrainers();
  }

  loadMemberAndTrainers(): void {
    this.frontdeskApi.getCurrentMember().subscribe({
      next: (mem) => {
        this.member = mem;
        this.initializeTrainers();
      },
      error: () => {
        this.initializeTrainers();
      }
    });
  }

  initializeTrainers(): void {
    this.frontdeskApi.getTrainers().subscribe({
      next: (dtos: TrainerDto[]) => {
        let activeTrainers = dtos.filter(t => t.isActive !== false);
        
        if (this.member && this.member.homeBranchId) {
          activeTrainers = activeTrainers.filter(t => t.branchId === this.member!.homeBranchId);
        }

        this.trainers = activeTrainers.map((t, idx) => {
          let emoji = '🧘';
          const nameLower = (t.trainerName || '').toLowerCase();
          if (nameLower.includes('priya') || nameLower.includes('sharma') || nameLower.includes('neha')) {
            emoji = '👩‍🏫';
          } else if (nameLower.includes('amit') || nameLower.includes('singh') || nameLower.includes('raj')) {
            emoji = '🏋️';
          }
          return {
            id: t.trainerId?.toString() || '',
            name: t.trainerName,
            specialty: t.specialties || 'Weight Training & Strength',
            certifications: t.certifications ? t.certifications.split(',').map(c => c.trim()) : ['NASM-CPT'],
            availability: 'Mon - Sat, 6 AM - 8 PM',
            rating: Number(t.rating || 4.8),
            reviews: 20 + (t.trainerId || 0) * 3,
            price: 500,
            image: emoji,
            bio: t.bio || 'Specialized in helping beginners build strength and confidence.',
            experience: 5 + (t.trainerId || 0) % 5,
            acceptingPtClients: t.acceptingPtClients !== false
          };
        });

        if (this.trainers.length > 0) {
          this.selectedTrainer = this.trainers[0];
        }
      },
      error: (err) => {
        this.toastService.error('FAILED TO LOAD TRAINERS.');
      }
    });

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
    if (!this.selectedDate || !this.selectedSlot || !this.selectedTrainer) {
      this.toastService.warning('PLEASE SELECT BOTH DATE AND TIME SLOT.');
      return;
    }

    if (!this.member || !this.member.memberId) {
      this.toastService.error('MEMBER ACCOUNT DETAILS NOT LOADED. CANNOT BOOK.');
      return;
    }

    // Convert slot like "06:00 AM" to 24h format
    const [time, modifier] = this.selectedSlot.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') {
      hours = '00';
    }
    if (modifier === 'PM') {
      hours = (parseInt(hours, 10) + 12).toString();
    }
    const formattedTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
    const scheduledAt = `${this.selectedDate}T${formattedTime}`;

    this.frontdeskApi.requestPtSession({
      memberId: this.member.memberId,
      trainerId: Number(this.selectedTrainer.id),
      scheduledAt: scheduledAt,
      durationMins: 60
    }).subscribe({
      next: () => {
        this.toastService.success(`PT SESSION REQUESTED WITH ${this.selectedTrainer!.name.toUpperCase()} ON ${this.selectedDate} AT ${this.selectedSlot}`);
        this.closeBookingDrawer();
      },
      error: (err) => {
        const errMsg = err?.error?.message || 'Failed to request PT session.';
        this.toastService.error(`PT BOOKING FAILED: ${errMsg.toUpperCase()}`);
      }
    });
  }

  getRatingColor(rating: number): string {
    if (rating >= 4.7) return 'text-[#16A34A]';
    if (rating >= 4.0) return 'text-[#2563EB]';
    return 'text-[#D97706]';
  }
}
