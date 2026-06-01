import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FrontdeskApiService,
  PaymentDto,
  InvoiceDto,
  PriceBreakdownDto,
} from '../../services/frontdesk-api.service';
import { PlanDto } from '../../services/admin-api.service';
import { AdminApiService } from '../../services/admin-api.service';
import { AuthService } from '../../services/auth.service';

export interface PaymentMethod {
  id: string;
  type: 'CARD' | 'UPI' | 'CASH';
  label: string;
}

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
})
export class CheckoutComponent implements OnInit {
  plans: PlanDto[] = [];
  selectedPlanId: number | null = null;
  breakdown: PriceBreakdownDto | null = null;
  selectedPaymentMethod: 'CARD' | 'UPI' | 'CASH' = 'CARD';
  orderPlaced = false;
  isProcessing = false;
  isLoadingBreakdown = false;
  errorMessage = '';
  successMessage = '';
  currentMemberId = 0;
  promoCode = '';
  appliedDiscount = 0;
  showPaymentGateway = false;
  isSuccess = false;
  isUpgrade = false;
  paymentAmount: number = 0;
  
  // Wallet
  walletBalance: number = 0;
  useWallet: boolean = false;
  walletAppliedAmount: number = 0;
  
  // Pending Flow
  pendingMembershipId: number | null = null;
  isPendingInvoiceFlow = false;
  private createdInvoiceId: number | null = null;

  paymentMethods: PaymentMethod[] = [
    { id: 'CARD', type: 'CARD', label: '💳 Credit/Debit Card' },
    { id: 'UPI', type: 'UPI', label: '📱 UPI' },
    { id: 'CASH', type: 'CASH', label: '💰 Cash' },
  ];

  constructor(
    private frontdeskApi: FrontdeskApiService,
    private adminApi: AdminApiService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isLoadingBreakdown = true;

    this.route.queryParams.subscribe(params => {
      this.isUpgrade = params['upgrade'] === 'true';
      
      if (params['pendingInvoice'] === 'true' && params['memberId']) {
        this.currentMemberId = Number(params['memberId']);
        this.isPendingInvoiceFlow = true;
        this.handlePendingInvoiceFlow();
      } else {
        // Normal flow
        this.frontdeskApi.getCurrentMember().subscribe({
          next: (member) => {
            this.currentMemberId = Number(member.memberId);
            this.walletBalance = member.walletBalance || 0;
            this.loadPlans();
            if (params['planId']) {
              this.selectPlan(Number(params['planId']));
            } else {
              this.isLoadingBreakdown = false;
            }
          },
          error: () => {
            this.errorMessage = 'Unable to identify current member profile.';
            this.isLoadingBreakdown = false;
          }
        });
      }
    });
  }

  handlePendingInvoiceFlow(): void {
    // We need both the member profile (for wallet) and their memberships
    this.frontdeskApi.getMemberById(this.currentMemberId).subscribe(m => {
      this.walletBalance = m.walletBalance || 0;
    });

    this.frontdeskApi.getMembershipsByMember(this.currentMemberId).subscribe(memberships => {
      const pendingMembership = memberships.find(m => m.status === 'PENDING');
      if (pendingMembership && pendingMembership.memId) {
        this.pendingMembershipId = pendingMembership.memId;
        this.selectPlan(pendingMembership.planId);
      }
      this.loadPlans();
    });

    this.frontdeskApi.getInvoicesByMember(this.currentMemberId).subscribe({
      next: (invoices) => {
        const pending = invoices.find(inv => inv.status === 'ISSUED');
        if (pending && pending.invoiceId) {
          this.createdInvoiceId = pending.invoiceId;
          this.paymentAmount = pending.finalAmount || 0;
          this.successMessage = `You have a pending invoice for activation.`;
        } else {
          this.errorMessage = 'No pending invoices found for activation.';
        }
      },
      error: () => {
        this.errorMessage = 'Failed to load pending invoices.';
      }
    });
  }

  loadPlans(): void {
    this.adminApi.getPlans().subscribe({
      next: (plans) => {
        this.plans = plans.filter((p) => p.isActive !== false);
      },
      error: () => {
        this.errorMessage = 'Unable to load plans.';
      },
    });
  }

  selectPlan(planId: number): void {
    this.selectedPlanId = planId;
    this.breakdown = null;
    this.errorMessage = '';
    this.loadBreakdown();
  }

  loadBreakdown(): void {
    if (!this.selectedPlanId) return;
    this.isLoadingBreakdown = true;

    const request = this.isUpgrade 
      ? this.frontdeskApi.getUpgradeBreakdown(this.currentMemberId, this.selectedPlanId, this.appliedDiscount > 0 ? this.appliedDiscount : undefined)
      : this.frontdeskApi.getPlanBreakdown(this.selectedPlanId, this.appliedDiscount > 0 ? this.appliedDiscount : undefined);

    request.subscribe({
        next: (bd) => {
          this.breakdown = bd;
          this.calculateFinalPaymentAmount();
          this.isLoadingBreakdown = false;
        },
        error: (err) => {
          this.errorMessage =
            err?.error?.message || 'Unable to load price breakdown.';
          this.isLoadingBreakdown = false;
        },
      });
  }

  toggleWallet(): void {
    this.useWallet = !this.useWallet;
    this.calculateFinalPaymentAmount();
  }

  calculateFinalPaymentAmount(): void {
    if (!this.breakdown) return;
    let amount = this.breakdown.finalAmount;
    
    if (this.useWallet && this.walletBalance > 0) {
      if (this.walletBalance >= amount) {
        this.walletAppliedAmount = amount;
        amount = 0;
      } else {
        this.walletAppliedAmount = this.walletBalance;
        amount -= this.walletBalance;
      }
    } else {
      this.walletAppliedAmount = 0;
    }
    
    this.paymentAmount = amount;
  }

  applyPromoCode(): void {
    if (!this.promoCode.trim()) return;
    this.errorMessage = '';

    this.adminApi.validatePromoCode(this.promoCode.trim(), this.currentMemberId).subscribe({
      next: (promo) => {
        if (promo.discountType === 'PERCENT' && this.breakdown) {
          this.appliedDiscount =
            (Number(this.breakdown.basePrice) * Number(promo.discountValue)) /
            100;
        } else {
          this.appliedDiscount = Number(promo.discountValue);
        }
        this.successMessage = `Promo "${promo.code}" applied! Discount: ₹${this.appliedDiscount.toLocaleString('en-IN')}`;
        this.loadBreakdown();
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.message || 'Invalid or expired promo code.';
        this.appliedDiscount = 0;
      },
    });
  }

  placeOrder(): void {
    if (!this.currentMemberId || !this.breakdown) {
      this.errorMessage = 'Please select a plan and log in to place an order.';
      return;
    }

    this.isProcessing = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    if (this.isPendingInvoiceFlow && this.pendingMembershipId) {
      // User is changing a pending plan
      this.frontdeskApi.changePlanForPending(this.pendingMembershipId, this.selectedPlanId!).subscribe({
        next: (membership) => {
          // Re-fetch invoices to get the new one
          this.frontdeskApi.getInvoicesByMember(this.currentMemberId).subscribe({
            next: (invoices) => {
              const pending = invoices.find(inv => inv.status === 'ISSUED');
              if (pending && pending.invoiceId) {
                this.createdInvoiceId = pending.invoiceId;
                this.isProcessing = false;
                this.showPaymentGateway = true;
              }
            }
          });
        },
        error: (err) => {
          this.isProcessing = false;
          this.errorMessage = `Failed to update plan: ${err.error?.message || 'Unknown error'}`;
        }
      });
      return;
    }

    // Step 1: Create Invoice (Normal Flow)
    const invoice: InvoiceDto = {
      memberId: this.currentMemberId,
      planName: this.plans.find(p => p.planId === this.selectedPlanId)?.planName || 'Membership Plan',
      mrp: this.breakdown.basePrice,
      taxes: this.breakdown.taxAmount,
      discount: this.breakdown.discount,
      finalAmount: this.breakdown.finalAmount,
      promoCode: this.promoCode || undefined,
      status: 'ISSUED',
    };

    this.frontdeskApi.createInvoice(invoice).subscribe({
      next: (createdInvoice) => {
        if (createdInvoice.invoiceId) {
          this.isProcessing = false;
          this.showPaymentGateway = true;
          this.successMessage = `Invoice ${createdInvoice.invoiceNumber || createdInvoice.invoiceId} generated.`;
          // We'll use the createdInvoice ID in the next step
          this.createdInvoiceId = createdInvoice.invoiceId;
        }
      },
      error: (err) => {
        this.isProcessing = false;
        this.errorMessage = `Invoice creation failed: ${err.error?.message || 'Unknown error'}`;
      },
    });
  }

  navigateToDashboard(): void {
    this.router.navigate(['/member/dashboard']);
  }

  completePayment(): void {
    if (!this.createdInvoiceId) return;
    
    this.isProcessing = true;
    const payment: PaymentDto = {
      invoiceId: this.createdInvoiceId,
      memberId: this.currentMemberId,
      amountPaid: this.paymentAmount,
      paymentMethod: this.selectedPaymentMethod,
      walletCreditApplied: this.walletAppliedAmount > 0 ? this.walletAppliedAmount : undefined
    };

    this.frontdeskApi.processPayment(payment).subscribe({
      next: (result) => {
        this.isSuccess = true;
        this.orderPlaced = true;
        this.showPaymentGateway = false;
        this.successMessage = `Payment successful! Transaction: ${result.transactionId || 'TXN-SUCCESS'}`;
        this.isProcessing = false;
        
        // Auto redirect after 3 seconds
        setTimeout(() => {
          this.router.navigate(['/member/dashboard']);
        }, 3000);
      },
      error: (err) => {
        this.isProcessing = false;
        this.errorMessage = `Payment failed: ${err.error?.message || 'Transaction Declined'}`;
      },
    });
  }

  cancelPayment(): void {
    this.showPaymentGateway = false;
    this.errorMessage = 'Payment cancelled. Your invoice is still pending.';
  }
}
