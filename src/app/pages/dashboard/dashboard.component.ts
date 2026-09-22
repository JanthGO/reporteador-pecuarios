import { Component, inject, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { Sidebar } from '../../shared/components/sidebar/sidebar';
import { DateRangeComponent, DateRange } from '../../shared/components/date-range/date-range.component';
import { environment } from '../../../environments/environment';
import { VisitasService } from '../../core/services/visitas.service';
import { Visitas, ResponseVisitasTotales } from '../../core/interfaces/visitas/visitas';
import { HighchartsChartComponent } from 'highcharts-angular';
import { PerformanceCard } from './components/performance-card/performance-card';
import type Highcharts from 'highcharts';

export interface SectionDef {
  key: string;
  nombre: string;
  iconClass: string;
  svgIcon: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, Sidebar, DateRangeComponent, HighchartsChartComponent, PerformanceCard],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private visitasService = inject(VisitasService);

  protected readonly empresaNombre = this.authService.empresaNombre;
  protected readonly usuario = this.authService.currentUser;
  protected readonly sitio = environment.nombre_dominio;

  protected readonly totalVisitas = signal(0);
  protected readonly promMensual = signal(0);
  protected readonly promDiario = signal(0);
  protected readonly chartData = signal<Visitas[]>([]);
  protected readonly loading = signal(false);
  protected readonly currentRange = signal<DateRange>({ fecha_inicio: '', fecha_fin: '' });

  chartOptions: Highcharts.Options = {};
  readonly chartUpdateFlag = signal(false);

  readonly selectedSection = signal<string>('total');

  readonly sectionData = signal<Map<string, ResponseVisitasTotales>>(new Map());

  chartTitle = 'Visitas a la marca';

  readonly sections: SectionDef[] = [
    {
      key: 'productos',
      nombre: 'Productos',
      iconClass: 'content-card__icon--products',
      svgIcon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
    },
    {
      key: 'articulos',
      nombre: 'Artículos',
      iconClass: 'content-card__icon--articles',
      svgIcon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    },
    {
      key: 'micrositio',
      nombre: 'Micrositio',
      iconClass: 'content-card__icon--microsite',
      svgIcon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    },
    {
      key: 'noticias',
      nombre: 'Noticias',
      iconClass: 'content-card__icon--news',
      svgIcon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><line x1="10" y1="6" x2="18" y2="6"/><line x1="12" y1="10" x2="18" y2="10"/><line x1="10" y1="14" x2="18" y2="14"/></svg>',
    },
    {
      key: 'eventos',
      nombre: 'Eventos',
      iconClass: 'content-card__icon--events',
      svgIcon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    },
    {
      key: 'vacante',
      nombre: 'Vacantes',
      iconClass: 'content-card__icon--jobs',
      svgIcon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>',
    },
    {
      key: 'videos',
      nombre: 'Videos',
      iconClass: 'content-card__icon--videos',
      svgIcon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>',
    },
  ];

  readonly chartTabs: { key: string; label: string }[] = [
    { key: 'total', label: 'Total' },
    ...this.sections.map(s => ({ key: s.key, label: s.nombre })),
  ];

  private chartInstance: Highcharts.Chart | null = null;

  private readonly chartEffect = effect(() => {
    const data = this.chartData();
    this.updateChart(data);
  });

  ngOnInit(): void {
    this.initChart();
  }

  onChartInstance(chart: Highcharts.Chart): void {
    this.chartInstance = chart;
  }

  onRangeChange(range: DateRange): void {
    this.currentRange.set(range);
    this.loadVisitas(this.selectedSection(), range);
    this.loadAllSections(range);
  }

  onCardClick(sectionKey: string): void {
    this.selectedSection.set(sectionKey);
    this.chartTitle = sectionKey === 'total'
      ? 'Visitas a la marca'
      : `Visitas - ${this.sections.find(s => s.key === sectionKey)?.nombre ?? sectionKey}`;

    const data = this.sectionData().get(sectionKey);
    if (data) {
      this.totalVisitas.set(data.data.total);
      this.promMensual.set(data.data.prom_mensual);
      this.promDiario.set(data.data.prom_dia);
      this.chartData.set(data.data.data);
    }
  }

  onTabClick(tabKey: string): void {
    this.onCardClick(tabKey);
  }

  getSectionTotal(sectionKey: string): number {
    return this.sectionData().get(sectionKey)?.data.total ?? 0;
  }

  isSelected(sectionKey: string): boolean {
    return this.selectedSection() === sectionKey;
  }

  private initChart(): void {
    this.chartOptions = this.buildChartOptions([]);
  }

  private updateChart(data: Visitas[]): void {
    const categories = data.map(d => this.formatChartDate(d.fecha));
    const values = data.map(d => d.visitas);

    this.chartOptions = this.buildChartOptions(categories, values);
    this.chartUpdateFlag.update(v => !v);
  }

  private buildChartOptions(categories: string[], values: number[] = []): Highcharts.Options {
    return {
      chart: {
        type: 'areaspline',
        height: 350,
        backgroundColor: 'transparent',
        spacing: [10, 0, 0, 0],
        style: { fontFamily: 'inherit' },
      },
      title: { text: undefined },
      credits: { enabled: false },
      legend: { enabled: false },
      xAxis: {
        categories,
        crosshair: {
          width: 1,
          color: '#2563eb',
          dashStyle: 'Dash',
        },
        labels: {
          style: {
            fontSize: '0.6875rem',
            color: '#94a3b8',
          },
        },
        lineColor: '#e2e8f0',
        tickLength: 0,
      },
      yAxis: {
        title: { text: undefined },
        gridLineColor: '#e2e8f0',
        gridLineDashStyle: 'Solid',
        labels: {
          style: {
            fontSize: '0.6875rem',
            color: '#94a3b8',
          },
        },
        min: 0,
      },
      tooltip: {
        backgroundColor: '#fff',
        borderColor: '#e2e8f0',
        borderRadius: 8,
        shadow: {
          color: 'rgba(0,0,0,0.08)',
          offsetX: 0,
          offsetY: 2,
          width: 8,
        },
        style: {
          fontSize: '0.8125rem',
          color: '#1a202c',
        },
        formatter: function (): string {
          const ctx = this;
          return `<b>${ctx.x}</b><br/>Visitas: <b>${(ctx.y ?? 0).toLocaleString('es-MX')}</b>`;
        },
        useHTML: true,
      },
      plotOptions: {
        areaspline: {
          fillColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
              [0, 'rgba(37, 99, 235, 0.2)'],
              [1, 'rgba(37, 99, 235, 0.02)'],
            ],
          },
          lineWidth: 2.5,
          lineColor: '#2563eb',
          marker: {
            enabled: true,
            radius: 4,
            fillColor: '#fff',
            lineWidth: 2,
            lineColor: '#2563eb',
            states: {
              hover: {
                radius: 6,
              },
            },
          },
          states: {
            hover: {
              lineWidth: 3,
            },
          },
        },
      },
      series: [{
        type: 'areaspline',
        name: 'Visitas',
        data: values,
        animation: {
          duration: 600,
        },
      }],
    };
  }

  private formatChartDate(fecha: string): string {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const [year, month] = fecha.split('-');
    return `${months[parseInt(month, 10) - 1]} ${year.slice(2)}`;
  }

  private loadVisitas(tipo: string, range: DateRange): void {
    const empresa = this.usuario()?.empresa;
    if (!empresa) return;

    this.loading.set(true);

    this.visitasService
      .visitasXseccion(environment.division, empresa, tipo, range.fecha_inicio, range.fecha_fin)
      .subscribe({
        next: (res) => {
          if (tipo === this.selectedSection()) {
            this.totalVisitas.set(res.data.total);
            this.promMensual.set(res.data.prom_mensual);
            this.promDiario.set(res.data.prom_dia);
            this.chartData.set(res.data.data);
          }
          this.sectionData.update(map => {
            const next = new Map(map);
            next.set(tipo, res);
            return next;
          });
          this.loading.set(false);
        },
        error: () => {
          if (tipo === this.selectedSection()) {
            this.totalVisitas.set(0);
            this.promMensual.set(0);
            this.promDiario.set(0);
            this.chartData.set([]);
          }
          this.loading.set(false);
        },
      });
  }

  private loadAllSections(range: DateRange): void {
    for (const section of this.sections) {
      this.loadVisitas(section.key, range);
    }
  }

  protected formatNumber(value: number): string {
    return value.toLocaleString('es-MX');
  }
}
