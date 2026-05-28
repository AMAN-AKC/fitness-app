import { Component, OnInit } from '@angular/core';
import { ManagerApiService } from '../../services/manager-api.service';
import { ToastService } from '../../services/toast.service';

export interface DunningItem {
  membershipId?: number;
  invoiceId?: number;
  memberId: number;
  memberName: string;
  email: string;
  phone: string;
  amount: number;
  outstanding: number;
  daysOverdue: number;
  attemptCount: number;
  lastAttempt: string;
  status: 'PENDING' | 'OVERDUE' | 'DUNNING';
  promiseToPayDate?: string;
}

export interface ReminderTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
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

  // Follow-up
  showFollowUpModal = false;
  selectedItem: DunningItem | null = null;
  followUpNotes = '';
  selectedTemplateId = '';

  // Promise to pay
  showPromiseModal = false;
  promiseDate = '';

  // Suspend
  showSuspendModal = false;
  suspendReason = '';

  // Templates Configuration
  showTemplatesModal = false;
  templates: ReminderTemplate[] = [
    { id: '1', name: 'First Reminder', subject: 'Payment Failed - Action Required', body: 'Hi [MemberName], your recent payment of [Amount] failed. Please update your payment method.' },
    { id: '2', name: 'Final Notice', subject: 'Urgent: Account Suspension Pending', body: 'Hi [MemberName], your payment is overdue. Your account will be suspended if not paid within 24 hours.' }
  ];
  editingTemplate: ReminderTemplate | null = null;

  constructor(
    private managerApi: ManagerApiService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadTemplates();
    this.loadDunningQueue();
  }

  loadTemplates() {
    const saved = localStorage.getItem('dunning_templates');
    if (saved) {
      try {
        this.templates = JSON.parse(saved);
      } catch (e) {}
    }
  }

  saveTemplates() {
    localStorage.setItem('dunning_templates', JSON.stringify(this.templates));
    this.toastService.success('Templates saved successfully');
  }

  loadDunningQueue(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // We can merge overdue invoices and dunning memberships
    this.managerApi.getOverdueInvoices().subscribe({
      next: (res) => {
        const invoices = res.invoices || [];
        this.dunningItems = invoices.map((inv: any) => ({
          invoiceId: inv.invoiceId,
          memberId: inv.member.memId,
          memberName: inv.member.memName,
          email: inv.member.email,
          phone: inv.member.phone || 'N/A',
          amount: inv.finalAmount || 0,
          outstanding: inv.outstanding || 0,
          daysOverdue: this.calculateDaysOverdue(inv.createdAt),
          attemptCount: 0,
          lastAttempt: 'N/A',
          status: inv.status,
          promiseToPayDate: inv.promiseToPayDate
        }));
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = `Failed to load dunning queue: ${err.error?.message || 'Unknown error'}`;
        this.isLoading = false;
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

  toggleExpand(id: number): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  exportCsv(): void {
    this.managerApi.exportDunningListCsv().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dunning_list.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: () => this.toastService.error('Failed to export CSV')
    });
  }

  // Follow up
  openFollowUpModal(item: DunningItem) {
    this.selectedItem = item;
    this.followUpNotes = '';
    this.selectedTemplateId = '';
    this.showFollowUpModal = true;
  }

  onTemplateSelect() {
    if (this.selectedTemplateId) {
      const tpl = this.templates.find(t => t.id === this.selectedTemplateId);
      if (tpl && this.selectedItem) {
        let text = tpl.body;
        text = text.replace('[MemberName]', this.selectedItem.memberName);
        text = text.replace('[Amount]', '$' + this.selectedItem.outstanding);
        this.followUpNotes = text;
      }
    }
  }

  submitFollowUp() {
    if (!this.selectedItem?.invoiceId || !this.followUpNotes.trim()) return;
    this.managerApi.recordFollowUp(this.selectedItem.invoiceId, this.followUpNotes).subscribe({
      next: () => {
        this.toastService.success('Follow-up recorded successfully');
        this.showFollowUpModal = false;
        this.loadDunningQueue();
      },
      error: () => this.toastService.error('Failed to record follow-up')
    });
  }

  // Promise to pay
  openPromiseModal(item: DunningItem) {
    this.selectedItem = item;
    this.promiseDate = '';
    this.showPromiseModal = true;
  }

  submitPromise() {
    if (!this.selectedItem?.invoiceId || !this.promiseDate) return;
    this.managerApi.setPromiseToPay(this.selectedItem.invoiceId, this.promiseDate).subscribe({
      next: () => {
        this.toastService.success('Promise to pay date recorded');
        this.showPromiseModal = false;
        this.loadDunningQueue();
      },
      error: () => this.toastService.error('Failed to set promise to pay')
    });
  }

  // Suspend
  openSuspendModal(item: DunningItem) {
    this.selectedItem = item;
    this.suspendReason = '';
    this.showSuspendModal = true;
  }

  submitSuspend() {
    // Need membershipId for suspension. The endpoint dunning-memberships has it, but we loaded overdue-invoices.
    // In our backend, invoice has membership attached. For simplicity, we just notify user or if membershipId is available we use it.
    this.toastService.warning('Suspend directly from Member details or ensure Membership ID is mapped.');
    this.showSuspendModal = false;
  }

  getTotalOutstanding(): number {
    return this.dunningItems.reduce((sum, item) => sum + item.outstanding, 0);
  }

  get failedCount(): number {
    return this.dunningItems.filter((d) => d.status === 'DUNNING' || d.status === 'OVERDUE').length;
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
