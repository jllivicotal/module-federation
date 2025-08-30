import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface MFEEvent {
  type: string;
  source: string;
  target?: string;
  payload?: any;
  timestamp: number;
}

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export interface PaymentData {
  amount: number;
  currency: string;
  items: CartItem[];
  customerInfo?: any;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  amount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class MFECommunicationService {
  private eventSubject = new Subject<MFEEvent>();
  private cartStateSubject = new BehaviorSubject<CartItem[]>([]);
  private paymentStateSubject = new BehaviorSubject<PaymentResult | null>(null);

  // Public observables
  public events$ = this.eventSubject.asObservable();
  public cartState$ = this.cartStateSubject.asObservable();
  public paymentState$ = this.paymentStateSubject.asObservable();

  constructor() {
    // Listen to window events for cross-MFE communication
    window.addEventListener('mfe-event', (event: any) => {
      this.handleWindowEvent(event.detail);
    });
  }

  // Emit events
  emitEvent(type: string, source: string, payload?: any, target?: string): void {
    const event: MFEEvent = {
      type,
      source,
      target,
      payload,
      timestamp: Date.now()
    };

    this.eventSubject.next(event);

    // Also dispatch to window for cross-MFE communication
    window.dispatchEvent(new CustomEvent('mfe-event', { detail: event }));
  }

  // Listen to specific event types
  onEvent(eventType: string, source?: string): Observable<MFEEvent> {
    return this.events$.pipe(
      filter(event => event.type === eventType && (!source || event.source === source))
    );
  }

  // Cart management
  updateCart(items: CartItem[]): void {
    this.cartStateSubject.next(items);
    this.emitEvent('cart-updated', 'checkout', { items });
  }

  getCartItems(): CartItem[] {
    return this.cartStateSubject.value;
  }

  // Payment management
  initiatePayment(paymentData: PaymentData): void {
    this.emitEvent('payment-initiated', 'checkout', paymentData, 'payment');
  }

  completePayment(result: PaymentResult): void {
    this.paymentStateSubject.next(result);
    this.emitEvent('payment-completed', 'payment', result, 'checkout');
  }

  // Navigation events
  requestNavigation(destination: string, source: string): void {
    this.emitEvent('navigation-requested', source, { destination });
  }

  // Error handling
  reportError(error: any, source: string): void {
    this.emitEvent('error-occurred', source, { error });
  }

  private handleWindowEvent(event: MFEEvent): void {
    // Handle cross-window events if needed
    this.eventSubject.next(event);
    console.log('MFE Communication Event received:', event);
  }

  // Get events by target
  getEventsForTarget(target: string): Observable<MFEEvent> {
    return this.events$.pipe(
      filter(event => !event.target || event.target === target)
    );
  }

  // Cleanup
  destroy(): void {
    this.eventSubject.complete();
    this.cartStateSubject.complete();
    this.paymentStateSubject.complete();
  }
}
