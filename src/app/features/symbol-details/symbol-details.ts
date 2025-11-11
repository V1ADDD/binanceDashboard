import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderBook, PriceEvent, Ticker24hr } from '../../shared/models/binance-types';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BinanceApi } from '../../shared/services/binance-api';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { BinanceWs } from '../../shared/services/binance-ws';
import { finalize } from 'rxjs/operators';
import { OrderBookComponent } from '../order-book/order-book';
import { RecentTrades } from '../recent-trades/recent-trades';
import { SymbolChart } from '../symbol-chart/symbol-chart';

@Component({
  selector: 'app-symbol-details',
  imports: [
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatTabsModule,
    OrderBookComponent,
    RecentTrades,
    SymbolChart,
  ],
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
  public symbol = signal<string>('');

  public ticker24hr = signal<Ticker24hr | null>(null);
  public price = signal<string | null>('');

  public activeTab = signal<number>(0);

  public ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const symbol = params.get('symbol');
      if (symbol) {
        this.symbol.set(symbol);

        this.isLoading.set(true);
        this.binanceApi
          .get24hrTicker(symbol)
          .pipe(
            takeUntilDestroyed(this.destroyRef),
            finalize(() => this.isLoading.set(false)),
          )
          .subscribe((value) => this.ticker24hr.set(value as Ticker24hr));

        this.binanceWebSocket
          .createPriceStream(symbol)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (data) => this.updatePrice(data),
            error: (error) => console.error('WebSocket error (price):', error),
          });
      } else {
        this.error.set('Symbol not found');
      }
    });
  }

  private updatePrice(price: PriceEvent): void {
    const currentPrice = this.price();
    if (currentPrice !== price.p) {
      this.price.set(price.p);
    }
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
