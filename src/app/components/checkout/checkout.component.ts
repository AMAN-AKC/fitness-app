import { Component, OnInit } from '@angular/core';
import {
  FrontdeskApiService,
  PaymentDto,
  InvoiceDto,
} from '../../services/frontdesk-api.service';
import { AuthService } from '../../services/auth.service';

export interface CheckoutItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

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
  items: CheckoutItem[] = [];
  selectedPaymentMethod: 'CARD' | 'UPI' | 'CASH' = 'CARD';
  orderPlaced = false;
  isProcessing = false;
  errorMessage = '';
  successMessage = '';
  currentMemberId = 0;

  paymentMethods: PaymentMethod[] = [
    { id: 'card', type: 'CARD', label: '💳 Credit/Debit Card' },
    { id: 'upi', type: 'UPI', label: '📱 UPI' },
    { id: 'cash', type: 'CASH', label: '💰 Cash' },
  ];

  constructor(
    private frontdeskApi: FrontdeskApiService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.initializeItems();
    const session = this.authService.getCurrentSession();
    if (session) {
      this.currentMemberId = Number(session.userId);
    }
  }

  initializeItems(): void {
    this.items = [
      {
        id: '1',
        name: 'Premium Membership (3 months)',
        price: 4999,
        quantity: 1,
      },
      {
        id: '2',
        name: 'Personal Training Sessions (10)',
        price: 15000,
        quantity: 1,
      },
    ];
  }

  getSubtotal(): number {
    return this.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
  }

  getTax(): number {
    return Math.round(this.getSubtotal() * 0.18);
  }

  getTotal(): number {
    return this.getSubtotal() + this.getTax();
  }

  removeItem(id: string): void {
    this.items = this.items.filter((item) => item.id !== id);
  }

  updateQuantity(id: string, quantity: number): void {
    const item = this.items.find((i) => i.id === id);
    if (item && quantity > 0) {
      item.quantity = quantity;
    }
  }

  placeOrder(): void {
    if (!this.currentMemberId) {
      this.errorMessage = 'Please log in to place an order';
      return;
    }

    this.isProcessing = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Step 1: Create Invoice
    const invoice: InvoiceDto = {
      memberId: this.currentMemberId,
      finalAmount: this.getTotal(),
      status: 'ISSUED',
    };

    this.frontdeskApi.createInvoice(invoice).subscribe({
      next: (createdInvoice) => {
        if (createdInvoice.invoiceId) {
          // Step 2: Process Payment
          const payment: PaymentDto = {
            invoiceId: createdInvoice.invoiceId,
            memberId: this.currentMemberId,
            amount: this.getTotal(),
            paymentMethod: this.selectedPaymentMethod,
          };

          this.frontdeskApi.processPayment(payment).subscribe({
            next: (result) => {
              this.orderPlaced = true;
              this.successMessage = `Payment successful! Receipt: ${result.transactionId || result.gatewayReference}`;
              this.isProcessing = false;

              setTimeout(() => {
                this.orderPlaced = false;
                this.items = [];
                this.successMessage = '';
              }, 3000);
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
