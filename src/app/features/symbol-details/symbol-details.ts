import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderBook, PriceEvent, Ticker24hr } from '../../shared/models/binance-types';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BinanceApi } from '../../shared/services/binance-api';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { BinanceWs } from '../../shared/services/binance-ws';
import { finalize, switchMap, tap } from 'rxjs/operators';
import { OrderBookComponent } from '../order-book/order-book';
import { RecentTrades } from '../recent-trades/recent-trades';
import { SymbolChart } from '../symbol-chart/symbol-chart';
import { MatIconButton } from '@angular/material/button';
import { of } from 'rxjs';

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
    MatIconButton,
  ],
  templateUrl: './symbol-details.html',
  styleUrl: './symbol-details.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    this.route.paramMap
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((params) => {
          const symbol = params.get('symbol');

          if (!symbol) {
            return of(null);
          }

          this.symbol.set(symbol);
          this.error.set(null);
          this.isLoading.set(true);

          const apiCall$ = this.binanceApi.get24hrTicker(symbol).pipe(
            tap({
              next: (data) => this.ticker24hr.set(data as Ticker24hr),
              error: () => this.router.navigate(['/dashboard']),
            }),
          );

          const wsCall$ = this.binanceWebSocket.createPriceStream(symbol).pipe(
            tap({
              next: (data) => this.updatePrice(data),
              error: (error) => console.error('WebSocket error:', error),
            }),
          );

          // Запускаем оба потока
          return apiCall$.pipe(
            finalize(() => this.isLoading.set(false)),
            switchMap(() => wsCall$),
          );
        }),
      )
      .subscribe();
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
