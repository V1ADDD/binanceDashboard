import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ExchangeInfo, OrderBook, Ticker24hr } from '../models/binance-types';

@Injectable({
  providedIn: 'root',
})
export class BinanceApi {
  private readonly BASE_URL = 'https://fapi.binance.com';
  private http = inject(HttpClient);

  public getExchangeInfo(): Observable<ExchangeInfo> {
    return this.http.get<ExchangeInfo>(`${this.BASE_URL}/fapi/v1/exchangeInfo`);
  }

  public get24hrTicker(symbol: string): Observable<Ticker24hr>;
  public get24hrTicker(): Observable<Ticker24hr[]>;
  public get24hrTicker(symbol?: string): Observable<Ticker24hr | Ticker24hr[]> {
    const url = symbol
      ? `${this.BASE_URL}/fapi/v1/ticker/24hr?symbol=${symbol}`
      : `${this.BASE_URL}/fapi/v1/ticker/24hr`;

    return this.http.get<Ticker24hr | Ticker24hr[]>(url);
  }

  public getKlines(
    symbol: string,
    interval: string,
    limit = 150,
  ): Observable<(string | number)[][]> {
    return this.http.get<(string | number)[][]>(
      `${this.BASE_URL}/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
    );
  }

  public getOrderBook(symbol: string, limit = 20): Observable<OrderBook> {
    return this.http.get<OrderBook>(
      `${this.BASE_URL}/fapi/v1/depth?symbol=${symbol}&limit=${limit}`,
    );
  }
}
