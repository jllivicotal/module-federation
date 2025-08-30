import { Component, EventEmitter, Input, Output, VERSION } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface CustomerInfo {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  zipCode: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent {
  @Input()
  public basketValue?: string;

  @Input()
  public orderItems: OrderItem[] = [
    { id: 1, name: 'Premium Wireless Headphones', price: 199.99, quantity: 1 },
    { id: 2, name: 'Smart Fitness Watch', price: 299.99, quantity: 1 },
    { id: 3, name: 'Portable Bluetooth Speaker', price: 79.99, quantity: 2 }
  ];

  @Output("checkout-requested")
  public checkoutRequested: EventEmitter<any> = new EventEmitter<any>();

  @Output("back-requested")
  public backRequested: EventEmitter<void> = new EventEmitter<void>();

  public customerInfo: CustomerInfo = {
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    zipCode: ''
  };

  public paymentMethods: PaymentMethod[] = [
    { id: 'credit', name: 'Credit Card', icon: '💳' },
    { id: 'debit', name: 'Debit Card', icon: '💳' },
    { id: 'paypal', name: 'PayPal', icon: '💰' },
    { id: 'apple', name: 'Apple Pay', icon: '📱' }
  ];

  public selectedPaymentMethod: string = 'credit';
  public isProcessing: boolean = false;
  public orderCompleted: boolean = false;
  public orderNumber: string = '';

  public get itemCount(): number {
    return this.orderItems.reduce((count, item) => count + item.quantity, 0);
  }

  public get totalAmount(): number {
    return this.orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  public isFormValid(): boolean {
    return !!(
      this.customerInfo.email &&
      this.customerInfo.firstName &&
      this.customerInfo.lastName &&
      this.customerInfo.address &&
      this.customerInfo.city &&
      this.customerInfo.zipCode &&
      this.selectedPaymentMethod
    );
  }

  public async checkoutHandler(): Promise<void> {
    if (!this.isFormValid()) {
      return;
    }

    this.isProcessing = true;

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    this.orderNumber = this.generateOrderNumber();
    this.orderCompleted = true;
    this.isProcessing = false;

    const checkoutData = {
      timestamp: new Date(),
      customerInfo: this.customerInfo,
      orderItems: this.orderItems,
      paymentMethod: this.selectedPaymentMethod,
      totalAmount: this.totalAmount,
      orderNumber: this.orderNumber
    };

    this.checkoutRequested.emit(checkoutData);
  }

  public goBack(): void {
    this.backRequested.emit();
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${timestamp.slice(-6)}-${random}`;
  }
}
