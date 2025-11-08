import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { AggTradeEvent, DepthEvent, KlineEvent, PriceEvent } from '../models/binance-types';

@Injectable({
  providedIn: 'root',
})
export class BinanceWs {
  private baseUrl = 'wss://fstream.binance.com/ws';
  private multiStreamUrl = 'wss://fstream.binance.com/stream';

  public createAggTradeStream(symbol: string): WebSocketSubject<AggTradeEvent> {
    const stream = `${symbol.toLowerCase()}@aggTrade`;
    return webSocket<AggTradeEvent>(`${this.baseUrl}/${stream}`);
  }

  public createPriceStream(symbol: string): WebSocketSubject<PriceEvent> {
    const stream = `${symbol.toLowerCase()}@markPrice`;
    return webSocket<PriceEvent>(`${this.baseUrl}/${stream}`);
  }
  public createDepthStream(symbol: string): WebSocketSubject<DepthEvent> {
    const stream = `${symbol.toLowerCase()}@depth20@100ms`;
    return webSocket<DepthEvent>(`${this.baseUrl}/${stream}`);
  }

  public createKlineStream(symbol: string, interval: string): WebSocketSubject<KlineEvent> {
    const stream = `${symbol.toLowerCase()}@kline_${interval}`;
    return webSocket<KlineEvent>(`${this.baseUrl}/${stream}`);
  }

  public createMultiStream(
    streams: string[],
  ): WebSocketSubject<{ stream: string; data: AggTradeEvent | DepthEvent | KlineEvent }> {
    const streamParam = streams.join('/');
    return webSocket<{ stream: string; data: AggTradeEvent | DepthEvent | KlineEvent }>(
      `${this.multiStreamUrl}?streams=${streamParam}`,
    );
  }
}
