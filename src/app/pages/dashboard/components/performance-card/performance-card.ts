import { DecimalPipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';
import { HighchartsChartComponent } from 'highcharts-angular';
import type Highcharts from 'highcharts';
import { Visitas } from '../../../../core/interfaces/dashboard/visitas';

@Component({
  imports: [DecimalPipe, LucideDynamicIcon, HighchartsChartComponent],
  selector: 'app-performance-card',
  styleUrl: './performance-card.css',
  templateUrl: './performance-card.html',
})
export class PerformanceCard {
  titulo = input<string>('');
  visitas = input<number>(0);
  iconClass = input<string>('');
  iconName = input<string>('');
  selected = input<boolean>(false);
  /** Serie temporal de visitas para el sparkline. */
  sparklineData = input<Visitas[]>([]);

  cardClick = output<void>();

  /** Opciones de Highcharts para el sparkline. Se recalculan cuando cambian los datos. */
  readonly sparklineOptions = computed<Highcharts.Options>(() => ({
    chart: {
      type: 'areaspline',
      backgroundColor: 'transparent',
      borderWidth: 0,
      margin: [2, 0, 2, 0],
      width: 128,
      height: 48,
      style: { overflow: 'visible' },
      skipClone: true,
    },
    title: { text: undefined },
    subtitle: { text: undefined },
    credits: { enabled: false },
    xAxis: {
      visible: false,
      startOnTick: false,
      endOnTick: false,
      tickPositions: [],
    },
    yAxis: {
      visible: false,
      startOnTick: false,
      endOnTick: false,
      tickPositions: [],
      min: 0,
    },
    legend: { enabled: false },
    tooltip: { enabled: false },
    plotOptions: {
      areaspline: {
        lineWidth: 1.5,
        lineColor: this.selected() ? '#2563eb' : '#94a3b8',
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: this.selected()
            ? [[0, 'rgba(37, 99, 235, 0.15)'], [1, 'rgba(37, 99, 235, 0.01)']]
            : [[0, 'rgba(148, 163, 184, 0.12)'], [1, 'rgba(148, 163, 184, 0.01)']],
        },
        marker: { enabled: false },
        states: { hover: { lineWidth: 2 } },
        threshold: null,
      },
    },
    series: [{
      type: 'areaspline',
      name: 'Visitas',
      data: this.sparklineData().map(d => d.visitas),
      animation: { duration: 300 },
    }],
  }));
}
