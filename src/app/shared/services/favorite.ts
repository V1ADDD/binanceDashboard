import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Favorite {
  private readonly STORAGE_KEY = 'binance-favorites';
  private favoritesSubject = new BehaviorSubject<string[]>(this.getStoredFavorites());

  public get favorites$(): Observable<string[]> {
    return this.favoritesSubject.asObservable();
  }

  public get favorites(): string[] {
    return this.favoritesSubject.value;
  }

  public toggleFavorite(symbol: string): void {
    const currentFavorites = this.favorites;
    const newFavorites = currentFavorites.includes(symbol)
      ? currentFavorites.filter(s => s !== symbol)
      : [...currentFavorites, symbol];

    this.favoritesSubject.next(newFavorites);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newFavorites));
  }

  public isFavorite(symbol: string): boolean {
    return this.favorites.includes(symbol);
  }

  private getStoredFavorites(): string[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
}