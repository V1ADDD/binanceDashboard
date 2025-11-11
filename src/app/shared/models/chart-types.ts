import { ChartDataset } from 'chart.js';

export interface CandlestickData {
  x: number;
  o: number;
  h: number;
  l: number;
  c: number;
}

export interface IndicatorConfig {
  type: 'sma' | 'ema';
  period: number;
  color: string;
  visible: boolean;
}

export type unitType =
  | false
  | 'hour'
  | 'day'
  | 'minute'
  | 'millisecond'
  | 'second'
  | 'week'
  | 'month'
  | 'quarter'
  | 'year'
  | undefined;

export interface CandlestickDataset extends ChartDataset<'candlestick'> {
  color?: {
    up: string;
    down: string;
    unchanged: string;
  };
}
