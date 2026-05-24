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
    this.frontdeskApi.getCurrentMember().subscribe({
      next: (member) => {
        this.currentMemberId = Number(member.memberId);
        this.loadPlans();
        
        // Read planId and upgrade flag from URL
        this.route.queryParams.subscribe(params => {
          this.isUpgrade = params['upgrade'] === 'true';
          if (params['planId']) {
            this.selectPlan(Number(params['planId']));
          }
        });
      },
      error: () => {
        this.errorMessage = 'Unable to identify current member profile.';
        this.isLoadingBreakdown = false;
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
          this.isLoadingBreakdown = false;
        },
        error: (err) => {
          this.errorMessage =
            err?.error?.message || 'Unable to load price breakdown.';
          this.isLoadingBreakdown = false;
        },
      });
  }

  applyPromoCode(): void {
    if (!this.promoCode.trim()) return;
    this.errorMessage = '';

    this.adminApi.validatePromoCode(this.promoCode.trim()).subscribe({
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

    // Step 1: Create Invoice
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
          this.paymentAmount = this.breakdown?.finalAmount || 0;
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

  private createdInvoiceId: number | null = null;

  completePayment(): void {
    if (!this.createdInvoiceId || !this.breakdown) return;
    
    this.isProcessing = true;
    const payment: PaymentDto = {
      invoiceId: this.createdInvoiceId,
      memberId: this.currentMemberId,
      amountPaid: this.paymentAmount,
      paymentMethod: this.selectedPaymentMethod,
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
