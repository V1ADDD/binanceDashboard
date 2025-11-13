import { TestBed } from '@angular/core/testing';

import { BinanceWs } from './binance-ws';

describe('BinanceWs', () => {
  let service: BinanceWs;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BinanceWs);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
