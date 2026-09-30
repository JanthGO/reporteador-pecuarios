import { ChangeDetectionStrategy, Component, PLATFORM_ID, computed, effect, inject, input, signal} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HighchartsChartComponent } from 'highcharts-angular';
import type Highcharts from 'highcharts';
import { LucideCalendarDays, LucideImageOff, LucideTrendingUp } from '@lucide/angular';
import { Contenidos, Secciones, Visitas, elemento } from '../../../../core/interfaces/dashboard/visitas';
import { Skeleton } from '../../../../shared/components/skeleton/skeleton';
import { formatNumber } from '../../../../shared/utils/numeros';

const DIA = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' });

/**
 * Cuenta los productos que recibieron al menos una visita en el periodo.
 *
 * @param contenidos - Contenidos de productos devueltos por el endpoint.
 * @returns Número de productos con visitas mayores que cero.
 */
export function cuentaConVisitas(contenidos: Contenidos | null | undefined): number {
  if (!Array.isArray(contenidos?.data)) return 0;
  return contenidos.data.filter((item) => (item?.visitas ?? 0) > 0).length;
}

/**
 * Elige el producto con más visitas del periodo.
 * 
 * @param contenidos - Contenidos de productos devueltos por el endpoint.
 * @returns El producto más visitado, o `null` si no hay productos.
 */
export function selectTopProducto(contenidos: Contenidos | null | undefined): elemento | null {
  const candidatos = [
    ...(Array.isArray(contenidos?.popular) ? contenidos.popular : []),
    ...(Array.isArray(contenidos?.data) ? contenidos.data : []),
  ].filter((item): item is elemento => !!item);

  if (!candidatos.length) return null;

  return candidatos.reduce((mejor, actual) =>
    (actual.visitas ?? 0) > (mejor.visitas ?? 0) ? actual : mejor,
  );
}

/**
 * Localiza el día con más visitas de la serie.
 *
 * @param serie - Serie temporal devuelta por el endpoint.
 * @returns El punto máximo, o `null` si la serie está vacía.
 */
export function selectPico(serie: Visitas[] | null | undefined): Visitas | null {
  if (!Array.isArray(serie) || !serie.length) return null;

  return serie.reduce((pico, punto) =>
    (punto?.visitas ?? 0) > (pico?.visitas ?? 0) ? punto : pico,
  );
}

/**
 * Acorta una fecha de la serie a día y mes en español (p. ej. `12 mar`).
 *
 * @param fecha - Fecha cruda del endpoint (`YYYY-MM-DD`).
 * @returns Etiqueta corta, o la fecha tal cual si no es un ISO reconocible.
 */
export function formatDia(fecha: string | null | undefined): string {
  const iso = (fecha ?? '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return fecha ?? '';

  const [anio, mes, dia] = iso.split('-').map(Number);
  return DIA.format(new Date(anio, mes - 1, dia));
}

@Component({
  selector: 'app-kpi-band',
  standalone: true,
  imports: [
    HighchartsChartComponent,
    LucideCalendarDays,
    LucideImageOff,
    LucideTrendingUp,
    Skeleton,
  ],
  templateUrl: './kpi-band.html',
  styleUrl: './kpi-band.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiBand {
  readonly seccion = input<Secciones | null>(null);
  readonly loading = input(false);

  protected readonly totalVisitas = computed(() => this.seccion()?.visitas?.total ?? 0);
  protected readonly serieVisitas = computed<Visitas[]>(() => this.seccion()?.visitas?.data ?? []);
  protected readonly promedioDiario = computed(() => this.seccion()?.visitas?.prom_dia ?? 0);
  protected readonly totalProductos = computed(() => this.seccion()?.contenidos?.total ?? 0);
  protected readonly conVisitas = computed(() => cuentaConVisitas(this.seccion()?.contenidos));
  protected readonly topProducto = computed(() => selectTopProducto(this.seccion()?.contenidos));
  protected readonly pico = computed(() => selectPico(this.serieVisitas()));

  protected readonly imagenTopFallida = signal(false);

  protected readonly formatNumber = formatNumber;
  protected readonly formatDia = formatDia;

  /**
   * Color de acento de la división, leído del token `--color-sitio`.
   *
   * Highcharts no hereda variables CSS en su configuración, así que el valor se
   * resuelve en el navegador y la gráfica sigue al color del sitio cuando la
   * división cambia. En SSR se parte del verde de ganadería.
   */
  private readonly colorSitio = signal('#0F261D');

  /** Serie temporal en categorías y valores para la gráfica de la tarjeta. */
  protected readonly chartOptions = computed<Highcharts.Options>(() => {
    const color = this.colorSitio();
    const serie = this.serieVisitas();
    const labels = serie.map((punto) => punto.fecha);
    // Con muchos días se espacia el eje para que las fechas no se solapen.
    const step = labels.length > 40 ? Math.ceil(labels.length / 16) : 1;

    return {
      chart: {
        type: 'areaspline',
        height: 88,
        backgroundColor: 'transparent',
        margin: [4, 4, 0, 0],
        spacing: [0, 0, 0, 0],
        style: { fontFamily: 'inherit' },
      },
      title: { text: undefined },
      credits: { enabled: false },
      legend: { enabled: false },
      xAxis: {
        categories: labels,
        tickLength: 0,
        lineColor: 'transparent',
        labels: { step, style: { fontSize: '0.625rem', color: '#94a3b8' } },
      },
      yAxis: {
        title: { text: undefined },
        min: 0,
        gridLineWidth: 0,
        labels: { enabled: false },
      },
      tooltip: {
        backgroundColor: '#fff',
        borderColor: '#e2e8f0',
        borderRadius: 8,
        shadow: { color: 'rgba(0,0,0,0.08)', offsetX: 0, offsetY: 2, width: 8 },
        style: { fontSize: '0.8125rem', color: '#1a202c' },
        formatter: function (): string {
          const punto = this;
          return `<b>${punto.category}</b><br/>Visitas: <b>${(punto.y ?? 0).toLocaleString('es-MX')}</b>`;
        },
        useHTML: true,
      },
      plotOptions: {
        series: { animation: { duration: 320 }, states: { hover: { lineWidthPlus: 0 } } },
        areaspline: {
          threshold: null,
          lineWidth: 2,
          lineColor: color,
          fillColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
              [0, conAlfa(color, 0.22)],
              [1, conAlfa(color, 0.02)],
            ],
          },
          marker: { enabled: false },
        },
      },
      series: [
        { type: 'areaspline', name: 'Visitas', data: serie.map((punto) => punto.visitas ?? 0) },
      ],
    };
  });

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      const valor = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-sitio')
        .trim();
      if (valor) this.colorSitio.set(valor);
    }

    // El producto más visitado cambia con el periodo: se reintenta su foto.
    effect(() => {
      this.topProducto()?.imagen;
      this.imagenTopFallida.set(false);
    });
  }
}

/**
 * Convierte un color hexadecimal en `rgba()` con la opacidad indicada.
 *
 * Lo usa la configuración de Highcharts, que no admite variables CSS ni colores
 * con canal alfa.
 *
 * @param hex - Color en formato `#rgb` o `#rrggbb`.
 * @param alfa - Opacidad entre 0 y 1.
 * @returns Color en notación `rgba()`; si el valor no es hexadecimal devuelve
 *   el color original, para no perder el tono del token.
 */
function conAlfa(hex: string, alfa: number): string {
  const valor = hex.trim();
  const match = /^#?([\da-f]{3}|[\da-f]{6})$/i.exec(valor);
  if (!match) return valor;

  const completo =
    match[1].length === 3
      ? match[1]
          .split('')
          .map((c) => c + c)
          .join('')
      : match[1];

  const [r, g, b] = [0, 2, 4].map((i) => parseInt(completo.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${alfa})`;
}