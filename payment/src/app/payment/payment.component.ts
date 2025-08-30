import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MFECommunicationService, PaymentData, PaymentResult, CartItem } from '../shared/mfe-communication.service';

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
}

interface PaymentInfo {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardName: string;
}

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit, OnDestroy {
  @Input() orderTotal: number = 579.97;

  @Output("payment-completed")
  public paymentCompletedEvent: EventEmitter<any> = new EventEmitter<any>();

  @Output("back-requested")
  public backRequested: EventEmitter<void> = new EventEmitter<void>();

  private subscriptions: Subscription[] = [];
  public currentPaymentData: PaymentData | null = null;
  public paymentInProgress: boolean = false;

  public paymentMethods: PaymentMethod[] = [
    { id: 'credit', name: 'Credit Card', icon: '💳' },
    { id: 'debit', name: 'Debit Card', icon: '💳' },
    { id: 'paypal', name: 'PayPal', icon: '🅿️' },
    { id: 'apple', name: 'Apple Pay', icon: '🍎' }
  ];

  public selectedMethod: string = 'credit';

  public paymentInfo: PaymentInfo = {
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: ''
  };

  public isProcessing: boolean = false;
  public paymentCompleted: boolean = false;
  public transactionId: string = '';
  public paymentDate: Date = new Date();

  constructor(private communicationService: MFECommunicationService) {}

  ngOnInit(): void {
    // Listen for payment initiation from checkout
    const paymentInitSub = this.communicationService.onEvent('payment-initiated', 'checkout')
      .subscribe((event) => {
        this.handlePaymentInitiation(event.payload);
      });

    // Listen for cart updates
    const cartSub = this.communicationService.cartState$
      .subscribe((items) => {
        this.updateOrderFromCart(items);
      });

    this.subscriptions.push(paymentInitSub, cartSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private handlePaymentInitiation(paymentData: PaymentData): void {
    this.currentPaymentData = paymentData;
    this.orderTotal = paymentData.amount;
    this.paymentInProgress = true;
    console.log('Payment initiated with data:', paymentData);
  }

  private updateOrderFromCart(items: CartItem[]): void {
    if (items && items.length > 0) {
      this.orderTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }
  }

  public get subtotal(): number {
    return this.orderTotal * 0.85; // Assuming tax and shipping are included
  }

  public get tax(): number {
    return this.subtotal * 0.08; // 8% tax
  }

  public get shipping(): number {
    return this.subtotal > 100 ? 0 : 15.99; // Free shipping over $100
  }

  public get totalAmount(): number {
    return this.subtotal + this.tax + this.shipping;
  }

  public selectPaymentMethod(methodId: string): void {
    this.selectedMethod = methodId;
  }

  public getSelectedMethodName(): string {
    const method = this.paymentMethods.find(m => m.id === this.selectedMethod);
    return method ? method.name : '';
  }

  public formatCardNumber(event: any): void {
    let value = event.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
    let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;

    if (formattedValue.length > 19) {
      formattedValue = formattedValue.substring(0, 19);
    }

    this.paymentInfo.cardNumber = formattedValue;
    event.target.value = formattedValue;
  }

  public formatExpiryDate(event: any): void {
    let value = event.target.value.replace(/\D/g, '');

    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }

    this.paymentInfo.expiryDate = value;
    event.target.value = value;
  }

  public getCardType(): string {
    const number = this.paymentInfo.cardNumber.replace(/\s/g, '');

    if (number.startsWith('4')) return 'visa';
    if (number.startsWith('5') || number.startsWith('2')) return 'mastercard';
    if (number.startsWith('3')) return 'amex';
    if (number.startsWith('6')) return 'discover';

    return 'unknown';
  }

  public getCardIcon(): string {
    const type = this.getCardType();
    const icons: {[key: string]: string} = {
      'visa': 'VISA',
      'mastercard': 'MC',
      'amex': 'AMEX',
      'discover': 'DISC',
      'unknown': '💳'
    };
    return icons[type] || icons['unknown'];
  }

  public isFormValid(): boolean {
    if (this.selectedMethod === 'credit' || this.selectedMethod === 'debit') {
      return !!(
        this.paymentInfo.cardNumber.length >= 19 &&
        this.paymentInfo.expiryDate.length === 5 &&
        this.paymentInfo.cvv.length >= 3 &&
        this.paymentInfo.cardName.trim()
      );
    }

    return true; // For PayPal and Apple Pay, assume external validation
  }

  public async processPayment(): Promise<void> {
    if (!this.isFormValid()) return;

    this.isProcessing = true;

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Simulate random payment failure (10% chance)
      const success = Math.random() > 0.1;

      if (success) {
        this.transactionId = this.generateTransactionId();
        this.paymentDate = new Date();
        this.paymentCompleted = true;

        const paymentResult: PaymentResult = {
          success: true,
          transactionId: this.transactionId,
          amount: this.totalAmount
        };

        // Emit through communication service
        this.communicationService.completePayment(paymentResult);

        // Also emit the original event for backward compatibility
        const paymentData = {
          transactionId: this.transactionId,
          amount: this.totalAmount,
          paymentMethod: this.selectedMethod,
          date: this.paymentDate,
          success: true
        };

        this.paymentCompletedEvent.emit(paymentData);
      } else {
        // Simulate payment failure
        const paymentResult: PaymentResult = {
          success: false,
          error: 'Payment declined by bank. Please try a different card.',
          amount: this.totalAmount
        };

        this.communicationService.completePayment(paymentResult);
      }
    } catch (error) {
      // Handle unexpected errors
      const paymentResult: PaymentResult = {
        success: false,
        error: 'An unexpected error occurred during payment processing.',
        amount: this.totalAmount
      };

      this.communicationService.reportError(error, 'payment');
      this.communicationService.completePayment(paymentResult);
    } finally {
      this.isProcessing = false;
      this.paymentInProgress = false;
    }
  }

  public goBack(): void {
    this.backRequested.emit();
  }

  public continueToConfirmation(): void {
    // This would typically navigate to a confirmation page
    console.log('Navigating to confirmation page...');
    this.communicationService.requestNavigation('confirmation', 'payment');
  }

  public retryPayment(): void {
    this.paymentCompleted = false;
    this.transactionId = '';
    this.processPayment();
  }

  private generateTransactionId(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TXN-${timestamp.slice(-8)}-${random}`;
  }
}
