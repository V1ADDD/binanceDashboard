import { ChangeDetectionStrategy, Component, input, output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Ticker24hr } from '../../shared/models/binance-types';

@Component({
  selector: 'app-symbols-table',
  imports: [
    CommonModule,
    RouterLink,
    ScrollingModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    FormsModule
  ],
  templateUrl: './symbols-table.html',
  styleUrl: './symbols-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SymbolsTable {
  public symbols = input<Ticker24hr[]>([]);
  public favorites = input<string[]>([]);
  
  public symbolSelected = output<string>();
  public favoriteToggled = output<string>();

  public searchTerm = signal('');
  public sortColumn = signal<string>('');
  public sortDirection = signal<'asc' | 'desc' | ''>('');

  public filteredAndSortedData = computed(() => {
    let data = this.symbols();
    
    // поиск
    const search = this.searchTerm().toLowerCase();
    if (search) {
      data = data.filter(symbol => 
        symbol.symbol.toLowerCase().includes(search)
      );
    }
    
    // сортировка
    const column = this.sortColumn();
    const direction = this.sortDirection();
    if (column && direction) {
      data = this.sortData([...data], column, direction);
    }
    
    return data;
  });

  public onSearchChange(term: string): void {
    this.searchTerm.set(term);
  }

  public onSort(column: string): void {
    const currentColumn = this.sortColumn();
    const currentDirection = this.sortDirection();
    
    if (currentColumn === column) {
      this.sortDirection.set(currentDirection === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  public toggleFavorite(symbol: string): void {
    this.favoriteToggled.emit(symbol);
  }

  public isFavorite(symbol: string): boolean {
    return this.favorites().includes(symbol);
  }

  public getPriceChange(symbol: Ticker24hr): number {
    return +symbol.priceChange;
  }

  public formatVolume(volume: string): string {
    const num = +volume;
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
    return num.toFixed(2);
  }

  public getSortIcon(column: string): string {
    if (this.sortColumn() !== column) return 'unfold_more';
    return this.sortDirection() === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  private sortData(data: Ticker24hr[], column: string, direction: string): Ticker24hr[] {
    return [...data].sort((a, b) => {
      let valueA = a[column as keyof Ticker24hr];
      let valueB = b[column as keyof Ticker24hr];
      
      if (column === 'lastPrice' || column === 'priceChangePercent' || column === 'volume') {
        valueA = +valueA;
        valueB = +valueB;
      }
      
      if (valueA < valueB) return direction === 'asc' ? -1 : 1;
      if (valueA > valueB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }
}