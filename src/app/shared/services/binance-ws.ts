import { Injectable, inject } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Observable } from 'rxjs';
import { AggTradeEvent, DepthEvent, KlineEvent } from '../models/binance-types';

@Injectable({
  providedIn: 'root',
})
export class BinanceWs {
  private baseUrl = 'wss://fstream.binance.com/ws';
  private multiStreamUrl = 'wss://fstream.binance.com/stream';

  createAggTradeStream(symbol: string): WebSocketSubject<AggTradeEvent> {
    const stream = `${symbol.toLowerCase()}@aggTrade`;
    return webSocket<AggTradeEvent>(`${this.baseUrl}/${stream}`);
  }

  createDepthStream(symbol: string): WebSocketSubject<DepthEvent> {
    const stream = `${symbol.toLowerCase()}@depth20@100ms`;
    return webSocket<DepthEvent>(`${this.baseUrl}/${stream}`);
  }

  createKlineStream(symbol: string, interval: string): WebSocketSubject<KlineEvent> {
    const stream = `${symbol.toLowerCase()}@kline_${interval}`;
    return webSocket<KlineEvent>(`${this.baseUrl}/${stream}`);
  }

  createMultiStream(streams: string[]): WebSocketSubject<{ stream: string; data: AggTradeEvent | DepthEvent | KlineEvent }> {
    const streamParam = streams.join('/');
    return webSocket<{ stream: string; data: AggTradeEvent | DepthEvent | KlineEvent }>(
      `${this.multiStreamUrl}?streams=${streamParam}`
    );
  }
}
