import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { SymbolsTable } from '../symbols-table/symbols-table';
import { BinanceApi } from '../../shared/services/binance-api';
import { Favorite } from '../../shared/services/favorite';
import { Router } from '@angular/router';
import { switchMap, timer, catchError, of } from 'rxjs';
import { Ticker24hr } from '../../shared/models/binance-types';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
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

  public ngOnInit(): void {
    this.favoritesService.favorites$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((favorites) => {
        this.favorites.set(favorites);
      });

    timer(0, 30000)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => {
          if (this.symbols().length === 0) {
            this.isLoading.set(true);
          }
          return this.binanceApi.get24hrTicker().pipe(
            catchError((error) => {
              console.error('Error fetching symbols:', error);
              this.isLoading.set(false);
              return of([]);
            }),
          );
        }),
      )
      .subscribe({
        next: (data) => {
          const symbolsArray = Array.isArray(data) ? data : [data];
          this.symbols.set(symbolsArray);
          this.lastUpdate.set(new Date());
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error in subscription:', error);
          this.isLoading.set(false);
        },
      });
  }

  public refreshData(): void {
    this.isLoading.set(true);
    this.loadSymbols();
  }

  public onSymbolSelected(symbol: string): void {
    this.router.navigate(['/symbol', symbol]);
  }

  public onFavoriteToggled(symbol: string): void {
    this.favoritesService.toggleFavorite(symbol);
  }

  private loadSymbols(): void {
    console.log('Loading symbols...');
    this.binanceApi
      .get24hrTicker()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          const symbolsArray = Array.isArray(data) ? data : [data];
          this.symbols.set(symbolsArray);
          this.lastUpdate.set(new Date());
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading symbols:', error);
          this.isLoading.set(false);
        },
      });
  }
}
