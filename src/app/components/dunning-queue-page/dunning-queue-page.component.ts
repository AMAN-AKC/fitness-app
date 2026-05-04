import { Component, OnInit } from '@angular/core';

export interface DunningItem {
  id: string;
  memberName: string;
  amount: number;
  daysOverdue: number;
  attemptCount: number;
  lastAttempt: string;
  status: 'pending' | 'queued' | 'failed';
}

@Component({
  selector: 'app-dunning-queue-page',
  templateUrl: './dunning-queue-page.component.html',
  styleUrls: ['./dunning-queue-page.component.css'],
})
export class DunningQueuePageComponent implements OnInit {
  dunningItems: DunningItem[] = [];
  expandedId: string | null = null;

  constructor() {}

  ngOnInit(): void {
    this.initializeDunning();
  }

  initializeDunning(): void {
    this.dunningItems = [
      {
        id: '1',
        memberName: 'Rajesh Kumar',
        amount: 4999,
        daysOverdue: 15,
        attemptCount: 3,
        lastAttempt: '2 days ago',
        status: 'failed',
      },
      {
        id: '2',
        memberName: 'Priya Singh',
        amount: 3500,
        daysOverdue: 10,
        attemptCount: 2,
        lastAttempt: '1 day ago',
        status: 'queued',
      },
      {
        id: '3',
        memberName: 'Amit Patel',
        amount: 12499,
        daysOverdue: 8,
        attemptCount: 1,
        lastAttempt: '3 days ago',
        status: 'pending',
      },
    ];
  }

  toggleExpand(id: string): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  retryPayment(item: DunningItem): void {
    item.status = 'queued';
    item.attemptCount += 1;
    item.lastAttempt = 'Just now';
  }

  suspendMember(item: DunningItem): void {
    console.log('Member suspended:', item.memberName);
  }

  getTotalOutstanding(): number {
    return this.dunningItems.reduce((sum, item) => sum + item.amount, 0);
  }

  getStatusColor(status: string): string {
    return status === 'failed'
      ? 'text-[#DC2626]'
      : status === 'queued'
        ? 'text-[#D97706]'
        : 'text-[#2563EB]';
  }

  getStatusBg(status: string): string {
    return status === 'failed'
      ? 'bg-[#FEF2F2]'
      : status === 'queued'
        ? 'bg-[#FFFBEB]'
        : 'bg-[#EFF5FF]';
  }
}
