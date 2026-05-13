import { Component, OnInit } from '@angular/core';
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

  paymentMethods: PaymentMethod[] = [
    { id: 'CARD', type: 'CARD', label: '💳 Credit/Debit Card' },
    { id: 'UPI', type: 'UPI', label: '📱 UPI' },
    { id: 'CASH', type: 'CASH', label: '💰 Cash' },
  ];

  constructor(
    private frontdeskApi: FrontdeskApiService,
    private adminApi: AdminApiService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    const session = this.authService.getCurrentSession();
    if (session) {
      this.currentMemberId = Number(session.userId);
    }
    this.loadPlans();
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

    this.frontdeskApi
      .getPlanBreakdown(
        this.selectedPlanId,
        this.appliedDiscount > 0 ? this.appliedDiscount : undefined,
      )
      .subscribe({
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
      finalAmount: this.breakdown.finalAmount,
      status: 'ISSUED',
    };

    this.frontdeskApi.createInvoice(invoice).subscribe({
      next: (createdInvoice) => {
        if (createdInvoice.invoiceId) {
          // Step 2: Process Payment (gateway stub)
          const payment: PaymentDto = {
            invoiceId: createdInvoice.invoiceId,
            memberId: this.currentMemberId,
            amount: this.breakdown!.finalAmount,
            paymentMethod: this.selectedPaymentMethod,
          };

          this.frontdeskApi.processPayment(payment).subscribe({
            next: (result) => {
              this.orderPlaced = true;
              this.successMessage = `Payment successful! Receipt: ${result.transactionId || result.gatewayReference || 'Generated'}`;
              this.isProcessing = false;
            },
            error: (err) => {
              this.isProcessing = false;
              this.errorMessage = `Payment failed: ${err.error?.message || 'Unknown error'}`;
            },
          });
        }
      },
      error: (err) => {
        this.isProcessing = false;
        this.errorMessage = `Invoice creation failed: ${err.error?.message || 'Unknown error'}`;
      },
    });
  }
}
