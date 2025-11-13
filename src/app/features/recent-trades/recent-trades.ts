import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { AggTradeEvent } from '../../shared/models/binance-types';
import { DatePipe } from '@angular/common';
import { BinanceWs } from '../../shared/services/binance-ws';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-recent-trades',
  imports: [DatePipe],
  templateUrl: './recent-trades.html',
  styleUrl: './recent-trades.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentTrades implements OnInit {
  public symbol = input('');
  public recentTrades = signal<AggTradeEvent[]>([]);

  private binanceWebSocket = inject(BinanceWs);
  private destroyRef = inject(DestroyRef);

  public ngOnInit(): void {
    // подключаемся к последним трейдам
    this.binanceWebSocket
      .createAggTradeStream(this.symbol())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.updateRecentTrades(data),
        error: (error) => console.error('WebSocket error (trades):', error),
      });
  }

  // обновление информации для отображения
  private updateRecentTrades(tradeEvent: AggTradeEvent): void {
    const currentTrades = this.recentTrades();
    const newTrade: AggTradeEvent = {
      ...tradeEvent,
      T: tradeEvent.T || Date.now(),
    };

    const updatedTrades = [newTrade, ...currentTrades.slice(0, 19)];
    this.recentTrades.set(updatedTrades);
  }

  public formatNumber(num: number | string) {
    if (typeof num === 'string') num = parseFloat(num);
    return num.toLocaleString('en-US', { maximumFractionDigits: 8 });
  }

  public calculateMul(a: string, b: string) {
    return parseFloat(a) * parseFloat(b);
  }
}
