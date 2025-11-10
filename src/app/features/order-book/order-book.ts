import { Component, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { DepthEvent, OrderBook } from '../../shared/models/binance-types';
import { catchError, of } from 'rxjs';
import { BinanceApi } from '../../shared/services/binance-api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BinanceWs } from '../../shared/services/binance-ws';

@Component({
  selector: 'app-order-book',
  imports: [],
  templateUrl: './order-book.html',
  styleUrl: './order-book.scss',
})
export class OrderBookComponent implements OnInit {
  public symbol = input('');
  public orderBook = signal<OrderBook | null>(null);

  private binanceApi = inject(BinanceApi);
  private binanceWebSocket = inject(BinanceWs);
  private destroyRef = inject(DestroyRef);

  public ngOnInit(): void {
    this.binanceApi
      .getOrderBook(this.symbol(), 20)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          console.error('Error loading order book:', error);
          return of(null);
        }),
      )
      .subscribe((value) => this.orderBook.set(value));
    this.binanceWebSocket
      .createDepthStream(this.symbol())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.updateOrderBook(data),
        error: (error) => console.error('WebSocket error (depth):', error),
      });
  }

  private updateOrderBook(orderBook: DepthEvent): void {
    const currentOrders = this.orderBook();
    if (currentOrders) {
      this.orderBook.set({
        ...currentOrders,
        bids: orderBook.b,
        asks: orderBook.a,
      });
    }
  }

  public calculateSpread(orderBook: OrderBook): string {
    if (!orderBook.asks.length || !orderBook.bids.length) return 'N/A';
    const bestAsk = parseFloat(orderBook.asks[0][0]);
    const bestBid = parseFloat(orderBook.bids[0][0]);
    const spread = bestAsk - bestBid;
    const spreadPercent = (spread / bestBid) * 100;

    return `${this.formatNumber(spread)} (${this.formatNumber(spreadPercent)}%)`;
  }

  public formatNumber(num: number | string) {
    if (typeof num === 'string') num = parseFloat(num);
    return num.toLocaleString('en-US', { maximumFractionDigits: 8 });
  }

  public calculateMul(a: string, b: string) {
    return parseFloat(a) * parseFloat(b);
  }
}
