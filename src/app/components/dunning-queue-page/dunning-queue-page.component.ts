import { Component, OnInit } from '@angular/core';
import {
  FrontdeskApiService,
  InvoiceDto,
  PaymentDto,
} from '../../services/frontdesk-api.service';

export interface DunningItem {
  invoiceId: number;
  memberId: number;
  memberName: string;
  amount: number;
  daysOverdue: number;
  attemptCount: number;
  lastAttempt: string;
  status: 'PENDING' | 'OVERDUE' | 'DUNNING';
}

@Component({
  selector: 'app-dunning-queue-page',
  templateUrl: './dunning-queue-page.component.html',
  styleUrls: ['./dunning-queue-page.component.css'],
})
export class DunningQueuePageComponent implements OnInit {
  dunningItems: DunningItem[] = [];
  expandedId: string | number | null = null;
  isLoading = false;
  errorMessage = '';

  constructor(private frontdeskApi: FrontdeskApiService) {}

  ngOnInit(): void {
    this.loadDunningQueue();
  }

  loadDunningQueue(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.frontdeskApi.getFailedInvoices().subscribe({
      next: (invoices) => {
        this.dunningItems = invoices
          .filter((inv) => inv.status === 'OVERDUE' || inv.status === 'PENDING')
          .map((inv) => ({
            invoiceId: inv.invoiceId!,
            memberId: inv.memberId,
            memberName: `Member ${inv.memberId}`, // Backend doesn't return name; can be enhanced
            amount: inv.finalAmount || 0,
            daysOverdue: this.calculateDaysOverdue(inv.createdAt),
            attemptCount: 0, // Track from backend audit logs if needed
            lastAttempt: 'N/A',
            status: (inv.status === 'OVERDUE' ? 'OVERDUE' : 'PENDING') as
              | 'PENDING'
              | 'OVERDUE'
              | 'DUNNING',
          }));
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = `Failed to load dunning queue: ${err.error?.message || 'Unknown error'}`;
        this.isLoading = false;
        // Show mock data as fallback
        this.initializeMockDunning();
      },
    });
  }

  calculateDaysOverdue(createdAt: string | undefined): number {
    if (!createdAt) return 0;
    const created = new Date(createdAt);
    const now = new Date();
    const diff = now.getTime() - created.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  initializeMockDunning(): void {
    this.dunningItems = [
      {
        invoiceId: 1,
        memberId: 101,
        memberName: 'Rajesh Kumar',
        amount: 4999,
        daysOverdue: 15,
        attemptCount: 3,
        lastAttempt: '2 days ago',
        status: 'DUNNING',
      },
      {
        invoiceId: 2,
        memberId: 102,
        memberName: 'Priya Singh',
        amount: 3500,
        daysOverdue: 10,
        attemptCount: 2,
        lastAttempt: '1 day ago',
        status: 'OVERDUE',
      },
      {
        invoiceId: 3,
        memberId: 103,
        memberName: 'Amit Patel',
        amount: 12499,
        daysOverdue: 8,
        attemptCount: 1,
        lastAttempt: '3 days ago',
        status: 'PENDING',
      },
    ];
  }

  toggleExpand(id: number): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  retryPayment(item: DunningItem): void {
    const payment: PaymentDto = {
      invoiceId: item.invoiceId,
      memberId: item.memberId,
      amount: item.amount,
      paymentMethod: 'CARD', // Default to card for retry
    };

    this.frontdeskApi.processPayment(payment).subscribe({
      next: () => {
        item.status = 'PENDING';
        item.attemptCount += 1;
        item.lastAttempt = 'Just now';
        // Reload dunning queue after retry
        setTimeout(() => this.loadDunningQueue(), 1000);
      },
      error: (err) => {
        this.errorMessage = `Retry failed: ${err.error?.message || 'Unknown error'}`;
      },
    });
  }

  suspendMember(item: DunningItem): void {
    // This would need a suspend member endpoint
    console.log('Member suspended:', item.memberName);
  }

  getTotalOutstanding(): number {
    return this.dunningItems.reduce((sum, item) => sum + item.amount, 0);
  }

  get failedCount(): number {
    return this.dunningItems.filter((d) => d.status === 'DUNNING').length;
  }

  getStatusColor(status: string): string {
    return status === 'DUNNING'
      ? 'text-[#DC2626]'
      : status === 'OVERDUE'
        ? 'text-[#D97706]'
        : 'text-[#2563EB]';
  }

  getStatusBg(status: string): string {
    return status === 'DUNNING'
      ? 'bg-[#FEF2F2]'
      : status === 'OVERDUE'
        ? 'bg-[#FFFBEB]'
        : 'bg-[#EFF5FF]';
  }
}
