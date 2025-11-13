import { IndicatorConfig } from './chart-types';

export const timeIntervals = [
  { value: '1m', label: '1 Minute' },
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
  { value: '1d', label: '1 Day' },
];

export const indicators: IndicatorConfig[] = [
  { type: 'sma', period: 20, color: '#FF6B6B', visible: true },
  { type: 'ema', period: 20, color: '#4ECDC4', visible: true },
  { type: 'sma', period: 50, color: '#45B7D1', visible: false },
  { type: 'ema', period: 50, color: '#96CEB4', visible: false },
];
