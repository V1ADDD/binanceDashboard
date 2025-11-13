import { TestBed } from '@angular/core/testing';

import { BinanceApi } from './binance-api';

describe('BinanceApi', () => {
  let service: BinanceApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BinanceApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
