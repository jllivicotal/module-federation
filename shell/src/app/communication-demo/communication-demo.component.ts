import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { MFECommunicationService, MFEEvent } from '../shared/services/mfe-communication.service';

@Component({
  selector: 'app-communication-demo',
  template: `
    <div class="demo-container">
      <div class="demo-header">
        <h2>🔄 Micro Frontend Communication Demo</h2>
        <p>This page demonstrates real-time communication between Checkout and Payment micro frontends</p>
      </div>

      <div class="demo-content">
        <div class="event-monitor">
          <h3>📡 Live Event Monitor</h3>
          <div class="events-list">
            <div *ngFor="let event of recentEvents; trackBy: trackEvent"
                 class="event-item"
                 [ngClass]="'event-' + event.type.replace('-', '_')">
              <div class="event-header">
                <span class="event-type">{{ event.type }}</span>
                <span class="event-source">from: {{ event.source }}</span>
                <span class="event-target" *ngIf="event.target">to: {{ event.target }}</span>
                <span class="event-time">{{ formatTime(event.timestamp) }}</span>
              </div>
              <div class="event-payload" *ngIf="event.payload">
                <pre>{{ formatPayload(event.payload) }}</pre>
              </div>
            </div>
          </div>
          <div *ngIf="recentEvents.length === 0" class="no-events">
            No events yet. Navigate to the MFE pages to see communication in action!
          </div>
        </div>

        <div class="demo-actions">
          <h3>🎮 Test Communication</h3>
          <div class="action-buttons">
            <button (click)="simulateCartUpdate()" class="demo-btn primary">
              🛒 Simulate Cart Update
            </button>
            <button (click)="simulatePaymentFlow()" class="demo-btn secondary">
              💳 Simulate Payment Flow
            </button>
            <button (click)="clearEvents()" class="demo-btn danger">
              🗑️ Clear Events
            </button>
          </div>
        </div>

        <div class="communication-info">
          <h3>📋 Communication Features</h3>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">🔄</div>
              <h4>Event-Based Communication</h4>
              <p>Real-time events between checkout and payment MFEs using RxJS observables</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🛒</div>
              <h4>Shared State Management</h4>
              <p>Cart state synchronized across micro frontends with BehaviorSubjects</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">💳</div>
              <h4>Payment Flow Coordination</h4>
              <p>Checkout initiates payment, payment reports back success/failure</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🌐</div>
              <h4>Cross-Window Events</h4>
              <p>Events work across different windows using native browser events</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .demo-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .demo-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .demo-header h2 {
      color: #2d3748;
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .demo-header p {
      color: #718096;
      font-size: 1.1rem;
    }

    .demo-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .event-monitor {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      border: 1px solid #e2e8f0;
    }

    .event-monitor h3 {
      margin-bottom: 1rem;
      color: #2d3748;
    }

    .events-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .event-item {
      background: #f7fafc;
      border-left: 4px solid #cbd5e0;
      margin-bottom: 0.5rem;
      padding: 0.75rem;
      border-radius: 0 8px 8px 0;
      font-size: 0.9rem;
    }

    .event-item.event-cart_updated { border-left-color: #3182ce; }
    .event-item.event-payment_initiated { border-left-color: #ed8936; }
    .event-item.event-payment_completed { border-left-color: #38a169; }
    .event-item.event-error_occurred { border-left-color: #e53e3e; }

    .event-header {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .event-type {
      background: #4299e1;
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-weight: 600;
      font-size: 0.8rem;
    }

    .event-source, .event-target {
      background: #68d391;
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
    }

    .event-target {
      background: #f56565;
    }

    .event-time {
      margin-left: auto;
      color: #a0aec0;
      font-size: 0.8rem;
    }

    .event-payload pre {
      background: #edf2f7;
      padding: 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      overflow-x: auto;
      margin: 0;
    }

    .no-events {
      text-align: center;
      color: #a0aec0;
      padding: 2rem;
      font-style: italic;
    }

    .demo-actions {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      border: 1px solid #e2e8f0;
    }

    .demo-actions h3 {
      margin-bottom: 1rem;
      color: #2d3748;
    }

    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .demo-btn {
      padding: 0.75rem 1rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: left;
    }

    .demo-btn.primary {
      background: linear-gradient(45deg, #4299e1, #3182ce);
      color: white;
    }

    .demo-btn.secondary {
      background: linear-gradient(45deg, #ed8936, #dd6b20);
      color: white;
    }

    .demo-btn.danger {
      background: linear-gradient(45deg, #f56565, #e53e3e);
      color: white;
    }

    .demo-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }

    .communication-info {
      grid-column: 1 / -1;
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      border: 1px solid #e2e8f0;
    }

    .communication-info h3 {
      margin-bottom: 1rem;
      color: #2d3748;
      text-align: center;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }

    .feature-card {
      background: #f7fafc;
      padding: 1rem;
      border-radius: 8px;
      text-align: center;
      border: 1px solid #e2e8f0;
    }

    .feature-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .feature-card h4 {
      margin-bottom: 0.5rem;
      color: #2d3748;
    }

    .feature-card p {
      color: #718096;
      font-size: 0.9rem;
      margin: 0;
    }

    @media (max-width: 768px) {
      .demo-content {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CommunicationDemoComponent implements OnInit, OnDestroy {
  recentEvents: MFEEvent[] = [];
  private subscription: Subscription = new Subscription();

  constructor(private communicationService: MFECommunicationService) {}

  ngOnInit(): void {
    // Subscribe to all events
    this.subscription.add(
      this.communicationService.events$.subscribe(event => {
        this.recentEvents.unshift(event);
        // Keep only the last 10 events
        if (this.recentEvents.length > 10) {
          this.recentEvents = this.recentEvents.slice(0, 10);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  trackEvent(index: number, event: MFEEvent): string {
    return `${event.timestamp}-${event.type}`;
  }

  formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString();
  }

  formatPayload(payload: any): string {
    if (!payload) return '';
    return JSON.stringify(payload, null, 2);
  }

  simulateCartUpdate(): void {
    const mockItems = [
      { id: 1, name: 'Test Product 1', price: 29.99, quantity: 2 },
      { id: 2, name: 'Test Product 2', price: 49.99, quantity: 1 }
    ];
    this.communicationService.updateCart(mockItems);
  }

  simulatePaymentFlow(): void {
    const mockPaymentData = {
      amount: 109.97,
      currency: 'USD',
      items: [
        { id: 1, name: 'Test Product 1', price: 29.99, quantity: 2 },
        { id: 2, name: 'Test Product 2', price: 49.99, quantity: 1 }
      ]
    };

    this.communicationService.initiatePayment(mockPaymentData);

    // Simulate payment completion after 2 seconds
    setTimeout(() => {
      this.communicationService.completePayment({
        success: true,
        transactionId: 'TXN-DEMO-' + Date.now(),
        amount: 109.97
      });
    }, 2000);
  }

  clearEvents(): void {
    this.recentEvents = [];
  }
}
