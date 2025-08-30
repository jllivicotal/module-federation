import { Component, EventEmitter, Input, Output, VERSION, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MFECommunicationService, PaymentResult, CartItem } from '../shared/mfe-communication.service';

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
export class CheckoutComponent implements OnInit, OnDestroy {
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

  private subscriptions: Subscription[] = [];
  public paymentStatus: string = '';
  public showPaymentFlow: boolean = false;

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

  constructor(private communicationService: MFECommunicationService) {}

  ngOnInit(): void {
    // Listen for payment completion events
    const paymentSub = this.communicationService.onEvent('payment-completed', 'payment')
      .subscribe((event) => {
        this.handlePaymentCompletion(event.payload);
      });

    // Listen for payment errors
    const errorSub = this.communicationService.onEvent('error-occurred', 'payment')
      .subscribe((event) => {
        this.handlePaymentError(event.payload.error);
      });

    this.subscriptions.push(paymentSub, errorSub);

    // Update cart state with current items
    const cartItems: CartItem[] = this.orderItems.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }));
    this.communicationService.updateCart(cartItems);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

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
    this.paymentStatus = 'Processing...';

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Prepare payment data
    const paymentData = {
      amount: this.totalAmount,
      currency: 'USD',
      items: this.orderItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      })),
      customerInfo: this.customerInfo
    };

    // Initiate payment through communication service
    this.communicationService.initiatePayment(paymentData);
    this.showPaymentFlow = true;
    this.paymentStatus = 'Redirecting to payment...';
  }

  public handlePaymentCompletion(result: PaymentResult): void {
    this.isProcessing = false;

    if (result.success) {
      this.orderNumber = this.generateOrderNumber();
      this.orderCompleted = true;
      this.paymentStatus = 'Payment completed successfully!';

      const checkoutData = {
        timestamp: new Date(),
        customerInfo: this.customerInfo,
        orderItems: this.orderItems,
        paymentMethod: this.selectedPaymentMethod,
        totalAmount: this.totalAmount,
        orderNumber: this.orderNumber,
        transactionId: result.transactionId
      };

      this.checkoutRequested.emit(checkoutData);
    } else {
      this.paymentStatus = `Payment failed: ${result.error}`;
      this.showPaymentFlow = false;
    }
  }

  public handlePaymentError(error: string): void {
    this.isProcessing = false;
    this.paymentStatus = `Error: ${error}`;
    this.showPaymentFlow = false;
  }

  public retryPayment(): void {
    this.paymentStatus = '';
    this.showPaymentFlow = false;
    this.checkoutHandler();
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
