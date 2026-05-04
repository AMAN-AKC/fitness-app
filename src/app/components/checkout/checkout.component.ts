import { Component, OnInit } from '@angular/core';

export interface CheckoutItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'upi' | 'netbanking';
  label: string;
}

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
})
export class CheckoutComponent implements OnInit {
  items: CheckoutItem[] = [];
  selectedPaymentMethod = 'card';
  orderPlaced = false;

  paymentMethods: PaymentMethod[] = [
    { id: 'card', type: 'card', label: '💳 Credit/Debit Card' },
    { id: 'upi', type: 'upi', label: '📱 UPI' },
    { id: 'netbanking', type: 'netbanking', label: '🏦 Net Banking' },
  ];

  constructor() {}

  ngOnInit(): void {
    this.initializeItems();
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
    this.orderPlaced = true;
    console.log(
      'Order placed with payment method:',
      this.selectedPaymentMethod,
    );
    setTimeout(() => {
      this.orderPlaced = false;
      this.items = [];
    }, 3000);
  }
}
