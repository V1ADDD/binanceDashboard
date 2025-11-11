import {
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  signal,
  viewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

import {
  Chart,
  ChartConfiguration,
  ChartDataset,
  LineController,
  LineElement,
  PointElement,
} from 'chart.js';
import { LinearScale, CategoryScale, TimeScale, Title, Tooltip, Legend } from 'chart.js';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import 'chartjs-adapter-moment';
import zoomPlugin from 'chartjs-plugin-zoom';

import { BinanceApi } from '../../shared/services/binance-api';
import {
  CandlestickData,
  CandlestickDataset,
  IndicatorConfig,
  unitType,
} from '../../shared/models/chart-types';
import { indicators, timeIntervals } from '../../shared/models/mock-data';

// Регистрируем компоненты Chart.js
Chart.register(
  LinearScale,
  CategoryScale,
  TimeScale,
  Title,
  Tooltip,
  Legend,
  CandlestickElement,
  CandlestickController,
  zoomPlugin,
  LineController,
  LineElement,
  PointElement,
);

@Component({
  selector: 'app-symbol-chart',
  imports: [FormsModule],
  templateUrl: './symbol-chart.html',
  styleUrl: './symbol-chart.scss',
})
export class SymbolChart implements OnInit, OnDestroy {
  public chartFinancial!: Chart;
  public symbol = input.required<string>();
  public recentCandles = signal<CandlestickData[]>([]);

  // Интервалы
  public intervals = timeIntervals;
  public selectedInterval = signal<string>('1h');

  // Индикаторы
  public indicators = signal<IndicatorConfig[]>(indicators);

  private canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  private binanceApi = inject(BinanceApi);
  private destroyRef = inject(DestroyRef);

  public ngOnInit(): void {
    this.fetchCandles();
  }

  public ngOnDestroy(): void {
    this.destroyChart();
  }

  public onIntervalChange(interval: string): void {
    this.selectedInterval.set(interval);
    this.fetchCandles();
  }

  public toggleIndicator(index: number): void {
    const indicators = this.indicators();
    indicators[index].visible = !indicators[index].visible;
    this.indicators.set([...indicators]);
    this.updateChart();
  }

  public resetZoom(): void {
    if (this.chartFinancial) {
      this.chartFinancial.resetZoom();
    }
  }

  private fetchCandles(): void {
    this.binanceApi
      .getKlines(this.symbol(), this.selectedInterval())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((candles) => {
        const formattedCandles = this.formatCandles(candles);
        this.recentCandles.set(formattedCandles);
        this.createChart();
      });
  }

  private formatCandles(candles: (string | number)[][]): CandlestickData[] {
    return candles.map((candle) => ({
      x: Number(candle[0]),
      o: Number(candle[1]),
      h: Number(candle[2]),
      l: Number(candle[3]),
      c: Number(candle[4]),
    }));
  }

  private calculateSMA(period: number): number[] {
    const prices = this.recentCandles().map((candle) => candle.c);
    const sma: number[] = [];

    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }

    return [...Array(period - 1).fill(null), ...sma];
  }

  private calculateEMA(period: number): number[] {
    const prices = this.recentCandles().map((candle) => candle.c);
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);

    let emaValue = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
    ema.push(emaValue);

    for (let i = period; i < prices.length; i++) {
      emaValue = (prices[i] - emaValue) * multiplier + emaValue;
      ema.push(emaValue);
    }

    return [...Array(period - 1).fill(null), ...ema];
  }

  private createChart(): void {
    const canvas = this.canvasRef()?.nativeElement;
    this.destroyChart();

    const chartConfig = this.getChartConfig();
    this.chartFinancial = new Chart(canvas, chartConfig);
  }

  private updateChart(): void {
    if (!this.chartFinancial) return;

    const chartConfig = this.getChartConfig();
    this.chartFinancial.data = chartConfig.data;
    this.chartFinancial.update('none');
  }

  private getChartConfig(): ChartConfiguration {
    const indicatorDatasets = this.calculateIndicators();

    const dataset: CandlestickDataset = {
      label: this.symbol(),
      data: this.recentCandles(),
      borderColor: '#000',
      borderWidth: 1,
      color: {
        up: '#26a69a',
        down: '#ef5350',
        unchanged: '#999',
      },
    };

    return {
      type: 'candlestick',
      data: {
        datasets: [dataset, ...indicatorDatasets],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          },
          zoom: {
            zoom: {
              wheel: {
                enabled: true,
              },
              pinch: {
                enabled: true,
              },
              mode: 'x',
            },
            pan: {
              enabled: true,
              mode: 'x',
            },
          },
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: this.getTimeUnit(),
              displayFormats: {
                hour: 'MMM DD HH:mm',
                day: 'MMM DD',
                minute: 'HH:mm',
              },
            },
            title: {
              display: true,
              text: 'Time',
            },
          },
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: 'Price',
            },
            ticks: {
              callback: (value: string | number) => Number(value).toFixed(2),
            },
          },
        },
        interaction: {
          mode: 'index',
          intersect: false,
        },
      },
    };
  }

  private calculateIndicators(): ChartDataset[] {
    const datasets: ChartDataset[] = [];

    this.indicators().forEach((indicator) => {
      if (!indicator.visible) return;

      let values: number[];
      switch (indicator.type) {
        case 'sma':
          values = this.calculateSMA(indicator.period);
          break;
        case 'ema':
          values = this.calculateEMA(indicator.period);
          break;
        default:
          values = [];
      }

      const data = this.recentCandles().map((candle, i) => ({
        x: candle.x,
        y: values[i],
      }));

      datasets.push({
        label: indicator.type.toUpperCase() + '(' + indicator.period + ')',
        data: data,
        borderColor: indicator.color,
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
        type: 'line',
      });
    });

    return datasets;
  }

  private getTimeUnit(): unitType {
    const interval = this.selectedInterval();
    if (interval.includes('m')) return 'minute';
    if (interval.includes('h')) return 'hour';
    if (interval.includes('d')) return 'day';
    return 'hour';
  }

  private destroyChart(): void {
    if (this.chartFinancial) {
      this.chartFinancial.destroy();
    }
  }
}
