import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AggTradeEvent,
  DepthEvent,
  OrderBook,
  Ticker24hr,
} from '../../shared/models/binance-types';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BinanceApi } from '../../shared/services/binance-api';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { DatePipe } from '@angular/common';
import { BinanceWs } from '../../shared/services/binance-ws';

@Component({
  selector: 'app-symbol-details',
  imports: [MatIconModule, MatProgressSpinnerModule, MatCardModule, MatTabsModule, DatePipe],
  templateUrl: './symbol-details.html',
  styleUrl: './symbol-details.scss',
})
export class SymbolDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private binanceApi = inject(BinanceApi);
  private binanceWebSocket = inject(BinanceWs);

  public error = signal<string | null>(null);
  public isLoading = signal(true);
  public orderBook = signal<OrderBook | null>(null);
  public symbol = signal<string>('');
  public recentTrades = signal<AggTradeEvent[]>([]);

  public ticker24hr = signal<Ticker24hr | null>(null);

  public activeTab = signal<number>(0);

  public ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const symbol = params.get('symbol');
      if (symbol) {
        this.symbol.set(symbol);
        this.loadSymbolData(symbol);
        this.setupWebSockets(symbol);
      } else {
        this.error.set('Symbol not found');
      }
    });
  }

  private loadSymbolData(symbol: string): void {
    this.isLoading.set(true);

    Promise.all([
      this.load24hrTicker(symbol),
      // this.loadKlines(symbol),
      this.loadOrderBook(symbol),
    ]).finally(() => {
      this.isLoading.set(false);
    });
  }

  private setupWebSockets(symbol: string): void {
    // WebSocket для стакана ордеров
    this.binanceWebSocket
      .createDepthStream(symbol)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.updateOrderBook(data),
        error: (error) => console.error('WebSocket error (depth):', error),
      });

    // WebSocket для агрегированных сделок
    this.binanceWebSocket
      .createAggTradeStream(symbol)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.updateRecentTrades(data),
        error: (error) => console.error('WebSocket error (trades):', error),
      });
  }

  private load24hrTicker(symbol: string): Promise<void> {
    return new Promise((resolve) => {
      this.binanceApi
        .get24hrTicker(symbol)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data) => {
            this.ticker24hr.set(data as Ticker24hr);
            resolve();
          },
          error: (error) => {
            console.error('Error loading 24hr ticker:', error);
            resolve();
          },
        });
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

  private updateRecentTrades(tradeEvent: AggTradeEvent): void {
    const currentTrades = this.recentTrades();
    const newTrade: AggTradeEvent = {
      ...tradeEvent,
      T: tradeEvent.T || Date.now(),
    };

    const updatedTrades = [newTrade, ...currentTrades.slice(0, 19)];
    this.recentTrades.set(updatedTrades);
  }

  private loadOrderBook(symbol: string): Promise<void> {
    return new Promise((resolve) => {
      this.binanceApi
        .getOrderBook(symbol, 20)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data) => {
            this.orderBook.set(data);
            resolve();
          },
          error: (error) => {
            console.error('Error loading order book:', error);
            resolve();
          },
        });
    });
  }

  public goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  public onTabChange(tabIndex: number): void {
    this.activeTab.set(tabIndex);
  }

  public getPriceChangeClass(change: string): string {
    const numChange = parseFloat(change);
    return numChange >= 0 ? 'positive' : 'negative';
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
