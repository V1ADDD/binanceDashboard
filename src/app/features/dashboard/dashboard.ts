import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { SymbolsTable } from '../symbols-table/symbols-table';
import { BinanceApi } from '../../shared/services/binance-api';
import { Favorite } from '../../shared/services/favorite';
import { Router } from '@angular/router';
import { switchMap, timer, catchError, of, tap, Observable } from 'rxjs';
import { Ticker24hr } from '../../shared/models/binance-types';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  imports: [
    DatePipe,
    SymbolsTable,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {
  private binanceApi = inject(BinanceApi);
  private favoritesService = inject(Favorite);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  public symbols = signal<Ticker24hr[]>([]);
  public favorites = signal<string[]>([]);
  public isLoading = signal(true);
  public lastUpdate = signal<Date | null>(null);
  public error = signal<string | null>(null);

  public hasSymbols = computed(() => this.symbols().length > 0);

  public ngOnInit(): void {
    // получаем избранное
    this.favoritesService.favorites$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(this.favorites.set);

    // обновляем символы раз в 30 секунд
    timer(0, 30000)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => this.setLoadingState()),
        switchMap(() => this.fetchSymbols()),
      )
      .subscribe({
        next: (data) => this.handleSymbolsData(data as Ticker24hr[]),
        error: (error) => this.handleError('Polling error:', error),
      });
  }

  // мануальное обновление данных
  public refreshData(): void {
    this.error.set(null);
    this.isLoading.set(true);
    this.error.set(null);
    this.fetchSymbols()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.handleSymbolsData(data as Ticker24hr[]),
        error: (error) => this.handleError('Manual load error:', error),
      });
  }

  public onSymbolSelected(symbol: string): void {
    this.router.navigate(['/symbol', symbol]);
  }

  public onFavoriteToggled(symbol: string): void {
    this.favoritesService.toggleFavorite(symbol);
  }

  private fetchSymbols(): Observable<Ticker24hr[] | Ticker24hr> {
    return this.binanceApi.get24hrTicker().pipe(
      catchError((error) => {
        console.error('API Error:', error);
        this.error.set('Failed to load data. Please try again.');
        this.isLoading.set(false);
        return of([]);
      }),
    );
  }

  private handleSymbolsData(data: Ticker24hr[]): void {
    const symbolsArray = data;
    this.symbols.set(symbolsArray);
    this.lastUpdate.set(new Date());
    this.isLoading.set(false);
    this.error.set(null);
  }

  private handleError(message: string, error: string): void {
    console.error(message, error);
    this.error.set('Error');
    this.isLoading.set(false);
  }

  private setLoadingState(): void {
    // Устанавливаем loading только если данных еще нет
    if (!this.hasSymbols()) {
      this.isLoading.set(true);
    }
  }
}
