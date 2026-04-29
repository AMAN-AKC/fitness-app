import { Component, OnInit } from '@angular/core';

interface UpcomingClass {
  category: string;
  categoryColor: string;
  name: string;
  trainer: string;
  room: string;
  date: string;
  time: string;
  canCancel: boolean;
}

interface Invoice {
  id: string;
  plan: string;
  date: string;
  amount: string;
  status: string;
}

interface KPIData {
  classesCount: number;
  chartData: number[];
}

@Component({
  selector: 'app-member-dashboard',
  templateUrl: './member-dashboard.component.html',
  styleUrls: ['./member-dashboard.component.css'],
  standalone: false,
})
export class MemberDashboardComponent implements OnInit {
  showAlert = true;

  upcomingClasses: UpcomingClass[] = [
    {
      category: 'Yoga',
      categoryColor: '#0D9488',
      name: 'Hatha Yoga Basics',
      trainer: 'Priya Sharma',
      room: 'Room A',
      date: 'Thu, 24 Apr',
      time: '07:00 AM',
      canCancel: true,
    },
    {
      category: 'Strength',
      categoryColor: '#EA580C',
      name: 'Power Lifting 101',
      trainer: 'Rahul Kumar',
      room: 'Gym Floor',
      date: 'Fri, 25 Apr',
      time: '06:00 PM',
      canCancel: true,
    },
    {
      category: 'Cardio',
      categoryColor: '#DC2626',
      name: 'HIIT Challenge',
      trainer: 'Anita Desai',
      room: 'Room B',
      date: 'Sat, 26 Apr',
      time: '08:00 AM',
      canCancel: false,
    },
  ];

  invoices: Invoice[] = [
    {
      id: 'INV-2025-001',
      plan: 'Gold Annual',
      date: '01 Jan 2025',
      amount: '₹12,999',
      status: 'PAID',
    },
    {
      id: 'INV-2024-142',
      plan: 'Gold Annual',
      date: '01 Jan 2024',
      amount: '₹11,999',
      status: 'PAID',
    },
    {
      id: 'INV-2023-098',
      plan: 'Silver Quarterly',
      date: '15 Oct 2023',
      amount: '₹3,999',
      status: 'PAID',
    },
    {
      id: 'INV-2023-067',
      plan: 'Silver Quarterly',
      date: '15 Jul 2023',
      amount: '₹3,999',
      status: 'PENDING',
    },
  ];

  membershipStatus = 'ACTIVE';
  currentPlan = 'Gold Annual';
  planDescription = 'Peak Hours + All Facilities';
  renewalDate = '01 Jan 2025';
  daysRemaining = 47;
  daysRemainingProgress = 87;
  expirationDate = '10 Mar 2025';
  classesBooked = 6;
  upcomingCount = 2;
  trainerName = 'Rahul Kumar';
  trainerInitials = 'RK';
  trainerColor = '#7C3AED';
  trainerSpecialties = ['Strength', 'CrossFit'];
  trainerRating = 4.2;
  trainerCertifications = ['ACSM Certified', 'CrossFit L2'];
  sessionsRemaining = 3;

  chartData: KPIData = {
    classesCount: 6,
    chartData: [60, 75, 85, 90],
  };

  constructor() {}

  ngOnInit(): void {}

  closeAlert(): void {
    this.showAlert = false;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'PAID':
        return '#F0FDF4';
      case 'PENDING':
        return '#FFFBEB';
      case 'FAILED':
        return '#FEF2F2';
      default:
        return '#F8F9FC';
    }
  }

  getStatusTextColor(status: string): string {
    switch (status) {
      case 'PAID':
        return '#14532D';
      case 'PENDING':
        return '#78350F';
      case 'FAILED':
        return '#7F1D1D';
      default:
        return '#0F172A';
    }
  }

  getBarHeight(value: number): string {
    return `${value}%`;
  }

  alternateRowColor(index: number): string {
    return index % 2 === 0 ? '#FFFFFF' : '#F8F9FC';
  }
}
