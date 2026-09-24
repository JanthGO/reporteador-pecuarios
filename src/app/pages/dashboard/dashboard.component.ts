import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';
import { Sidebar } from '../../shared/components/sidebar/sidebar';
import { DateRangeComponent, DateRange } from '../../shared/components/date-range/date-range.component';
import { environment } from '../../../environments/environment';
import { VisitasService } from '../../core/services/visitas.service';
import { Visitas, ResponseVisitasTotales, SectionDef } from '../../core/interfaces/dashboard/visitas';
import { HighchartsChartComponent } from 'highcharts-angular';
import { PerformanceCard } from './components/performance-card/performance-card';
import type Highcharts from 'highcharts';
import {
  LucideDownload,
  LucideEye,
  LucideUser,
  LucideClock,
  LucideGlobe,
  LucideArrowRight,
  LucideSmartphone,
  LucideMonitor,
  LucideCalendarRange,
  LucideCalendarDays,
} from '@lucide/angular';
import { ResponsePerfilVisitante, PerfilVisitante, info } from '../../core/interfaces/dashboard/PerfilVisitante';

/** Mapeo de nombres de país (con/sin acentos) a bandera emoji para la card de país. */
const FLAGS = new Map<string, string>([
  ['México', '🇲🇽'], ['Mexico', '🇲🇽'],
  ['Colombia', '🇨🇴'],
  ['Chile', '🇨🇱'],
  ['Costa Rica', '🇨🇷'],
  ['Honduras', '🇭🇳'],
  ['Panamá', '🇵🇦'], ['Panama', '🇵🇦'],
  ['Argentina', '🇦🇷'],
  ['Perú', '🇵🇪'], ['Peru', '🇵🇪'],
  ['Ecuador', '🇪🇨'],
  ['Venezuela', '🇻🇪'],
  ['Bolivia', '🇧🇴'],
  ['Paraguay', '🇵🇾'],
  ['Uruguay', '🇺🇾'],
  ['Guatemala', '🇬🇹'],
  ['El Salvador', '🇸🇻'],
  ['Nicaragua', '🇳🇮'],
  ['República Dominicana', '🇩🇴'], ['Republica Dominicana', '🇩🇴'],
  ['Cuba', '🇨🇺'],
  ['Puerto Rico', '🇵🇷'],
  ['España', '🇪🇸'], ['Espana', '🇪🇸'],
  ['Estados Unidos', '🇺🇸'], ['Estados Unidos de América', '🇺🇸'], ['Estados Unidos de America', '🇺🇸'], ['USA', '🇺🇸'], ['EE. UU.', '🇺🇸'],
  ['Canadá', '🇨🇦'], ['Canada', '🇨🇦'],
  ['Brasil', '🇧🇷'],
  ['Alemania', '🇩🇪'],
  ['Francia', '🇫🇷'],
  ['Inglaterra', '🇬🇧'], ['Reino Unido', '🇬🇧'], ['UK', '🇬🇧'],
  ['Italia', '🇮🇹'],
  ['Japón', '🇯🇵'], ['Japon', '🇯🇵'],
  ['China', '🇨🇳'],
]);


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    Sidebar,
    DateRangeComponent,
    HighchartsChartComponent,
    PerformanceCard,
    LucideDownload,
    LucideEye,
    LucideUser,
    LucideClock,
    LucideGlobe,
    LucideArrowRight,
    LucideSmartphone,
    LucideMonitor,
    LucideCalendarRange,
    LucideCalendarDays
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private visitasService = inject(VisitasService);
  private destroyRef = inject(DestroyRef);

  protected readonly empresaNombre = this.authService.empresaNombre;
  protected readonly usuario = this.authService.currentUser;
  protected readonly sitio = environment.nombre_dominio;

  protected readonly totalVisitas = signal(0);
  protected readonly promMensual = signal(0);
  protected readonly promDiario = signal(0);
  protected readonly chartData = signal<Visitas[]>([]);
  protected readonly loading = signal(false);
  protected readonly currentRange = signal<DateRange>({ fecha_inicio: '', fecha_fin: '' });
  protected readonly errorMsg = signal<string | null>(null);

  chartOptions: Highcharts.Options = {};
  /** Flag que se alterna para forzar la re-renderización del chart en el primer ciclo. */
  readonly chartUpdateFlag = signal(false);

  /** Clave de la sección activa. `'total'` por defecto. */
  readonly selectedSection = signal<string>('total');

  /** Mapa en memoria de respuestas por sección. Evita reconsultas al cambiar de pestaña. */
  readonly sectionData = signal<Map<string, ResponseVisitasTotales>>(new Map());

  readonly perfilData = signal<Map<string, ResponsePerfilVisitante>>(new Map());

  /** Indica si se está cargando el perfil del visitante del rango actual. */
  protected readonly perfilLoading = signal(false);

  // ── Datos derivados del perfil del visitante ──
  // Solo se recomputan cuando cambia `perfilData` o el rango seleccionado.

  /** Clave sólida de la caché: `fecha_inicio|fecha_fin`. */
  private readonly currentRangeKey = computed(
    () => `${this.currentRange().fecha_inicio}|${this.currentRange().fecha_fin}`,
  );

  /** Perfil del visitante correspondiente al rango seleccionado actualmente. */
  protected readonly perfilActual = computed<PerfilVisitante | null>(
    () => this.perfilData().get(this.currentRangeKey())?.data ?? null,
  );

  /** Top de ocupaciones (hasta 7). Se ordena descendentemente por el backend. */
  protected readonly ocupaciones = computed<info[]>(
    () => (this.perfilActual()?.ocupaciones ?? []).slice(0, 7),
  );
  protected readonly ocupacionPrincipal = computed<info | null>(
    () => this.ocupaciones()[0] ?? null,
  );
  protected readonly ocupacionesSecundarias = computed<info[]>(
    () => this.ocupaciones().slice(1),
  );

  /**
   * Distribución combinada de edad (hombre + mujer por rango), ordenada de forma
   * descendente. El backend entrega los porcentajes separados por género, y la
   * regla de negocio los agrega para mostrar el desglose total por rango de edad.
   */
  protected readonly rangosEdad = computed<{ label: string; value: number }[]>(() => {
    const perfil = this.perfilActual();
    if (!perfil?.visitasXgenero) return [];

    const man = perfil.visitasXgenero.porcientoMan;
    const woman = perfil.visitasXgenero.porcientoWoman;

    return [
      { label: 'Menos de 20 años', value: man.menos20 + woman.menos20 },
      { label: '20–30 años', value: man.entre20y30 + woman.entre20y30 },
      { label: '30–40 años', value: man.entre30y40 + woman.entre30y40 },
      { label: '40–50 años', value: man.entre40y50 + woman.entre40y50 },
      { label: '50–60 años', value: man.entre50y60 + woman.entre50y60 },
      { label: 'Más de 60 años', value: man.mas60 + woman.mas60 },
    ].sort((a, b) => b.value - a.value);
  });
  protected readonly edadPrincipal = computed<{ label: string; value: number } | null>(
    () => this.rangosEdad()[0] ?? null,
  );
  protected readonly edadesSecundarias = computed<{ label: string; value: number }[]>(
    () => this.rangosEdad().slice(1),
  );

  /** Top de países (hasta 7). */
  protected readonly paises = computed<info[]>(
    () => (this.perfilActual()?.paises ?? []).slice(0, 7),
  );
  protected readonly paisPrincipal = computed<info | null>(
    () => this.paises()[0] ?? null,
  );
  protected readonly paisesSecundarios = computed<info[]>(
    () => this.paises().slice(1),
  );

  /** Porcentaje agregado del resto de países (`paises_aux`). */
  protected readonly otrosPaises = computed<number>(
    () => (this.perfilActual()?.paises_aux ?? []).reduce((acc, p) => acc + (p.promedio ?? 0), 0),
  );

  chartTitle = 'Visitas a la marca';

  /** Definición estática de las secciones de contenido disponibles. */
  readonly sections: SectionDef[] = [
    {
      key: 'productos',
      nombre: 'Productos',
      iconClass: 'content-card__icon--products',
      iconName: 'shopping-bag',
    },
    {
      key: 'articulos',
      nombre: 'Artículos',
      iconClass: 'content-card__icon--articles',
      iconName: 'file-text',
    },
    {
      key: 'micrositio',
      nombre: 'Micrositio',
      iconClass: 'content-card__icon--microsite',
      iconName: 'globe',
    },
    {
      key: 'noticias',
      nombre: 'Noticias',
      iconClass: 'content-card__icon--news',
      iconName: 'newspaper',
    },
    {
      key: 'eventos',
      nombre: 'Eventos',
      iconClass: 'content-card__icon--events',
      iconName: 'calendar',
    },
    {
      key: 'vacante',
      nombre: 'Vacantes',
      iconClass: 'content-card__icon--jobs',
      iconName: 'users',
    },
    {
      key: 'videos',
      nombre: 'Videos',
      iconClass: 'content-card__icon--videos',
      iconName: 'video',
    },
  ];

  /** Pestañas de la gráfica: la primera es `'total'`, el resto son las secciones. */
  readonly chartTabs: { key: string; label: string }[] = [
    { key: 'total', label: 'Total' },
    ...this.sections.map(s => ({ key: s.key, label: s.nombre })),
  ];

  private chartInstance: Highcharts.Chart | null = null;

  /** Contador de peticiones HTTP pendientes. Se incrementa al enviar y decrementa al recibir. */
  private pendingRequests = 0;



  ngOnInit(): void {
    this.initChart();
  }

  // ──────────────────────────────────────────────
  //  Eventos del template
  // ──────────────────────────────────────────────

  /**
   * Callback invocado por el componente `highcharts-chart` cuando la instancia
   * de Highcharts está lista. Se usa para obtener acceso directo al objeto
   * `Chart` y poder actualizar series sin reconstruir las opciones completas.
   *
   * @param chart - Instancia del chart de Highcharts.
   */
  onChartInstance(chart: Highcharts.Chart): void {
    this.chartInstance = chart;
  }

  /**
   * Se ejecuta cuando el usuario selecciona un nuevo rango de fechas.
   * Actualiza el rango actual y dispara la carga de todas las secciones.
   *
   * @param range - Objeto con `fecha_inicio` y `fecha_fin` en formato ISO.
   */
  onRangeChange(range: DateRange): void {
    this.currentRange.set(range);
    this.loadAllSections(range);
  }

  /**
   * Se ejecuta cuando el usuario hace clic en una tarjeta de rendimiento
   * o en una pestaña de la gráfica. Cambia la sección activa y actualiza
   * la gráfica con los datos de esa sección (ya cacheados).
   *
   * @param sectionKey - Clave de la sección seleccionada (e.g. `'total'`, `'productos'`).
   */
  onCardClick(sectionKey: string): void {
    this.selectedSection.set(sectionKey);

    this.chartTitle = sectionKey === 'total'
      ? 'Visitas a la marca'
      : `Visitas - ${this.sections.find(s => s.key === sectionKey)?.nombre ?? sectionKey}`;

    this.applySectionChart(sectionKey);
  }

  /**
   * Wrapper de `onCardClick` para el evento de clic en las pestañas
   * de la gráfica.
   *
   * @param tabKey - Clave de la pestaña seleccionada.
   */
  onTabClick(tabKey: string): void {
    this.onCardClick(tabKey);
  }

  /**
   * Obtiene el total de visitas de una sección específica desde el caché local.
   * Se usa para mostrar el número en cada tarjeta de rendimiento.
   *
   * @param sectionKey - Clave de la sección a consultar.
   * @returns El total de visitas de la sección, o `0` si aún no se ha cargado.
   */
  getSectionTotal(sectionKey: string): number {
    return this.sectionData().get(sectionKey)?.data.total ?? 0;
  }

  /**
   * Determina si una sección es la actualmente seleccionada.
   * Se usa para aplicar la clase CSS activa en tarjetas y pestañas.
   *
   * @param sectionKey - Clave de la sección a comparar.
   * @returns `true` si la sección coincide con la seleccionada.
   */
  isSelected(sectionKey: string): boolean {
    return this.selectedSection() === sectionKey;
  }

  /**
   * Obtiene la serie temporal de visitas de una sección para el sparkline.
   *
   * @param sectionKey - Clave de la sección.
   * @returns Array de `Visitas` con la evolución histórica, o array vacío si aún no hay datos.
   */
  getSectionSparkline(sectionKey: string): Visitas[] {
    return this.sectionData().get(sectionKey)?.data.data ?? [];
  }

 

  // ──────────────────────────────────────────────
  //  Lógica interna de la gráfica
  // ──────────────────────────────────────────────

  /**
   * Inicializa la gráfica con datos vacíos.
   * Se llama una sola vez en `ngOnInit`.
   */
  private initChart(): void {
    this.chartOptions = this.buildChartOptions([], []);
  }

  /**
   * Aplica los datos de una sección cacheada a la gráfica.
   * Si la sección tiene datos disponibles, actualiza la serie y las categorías.
   * No realiza peticiones HTTP; lee directamente de `sectionData`.
   *
   * @param sectionKey - Clave de la sección cuyos datos se quieren mostrar.
   */
  private applySectionChart(sectionKey: string): void {
    const data = this.sectionData().get(sectionKey);
    if (data) {
      this.chartData.set(data.data.data);
      this.updateChartSeries(data.data.data);
    }
  }

  /**
   * Actualiza la gráfica con nuevos datos de forma in-place.
   *
   * Si la instancia de Highcharts ya existe (`chartInstance`), usa los métodos
   * `xAxis.setCategories` y `series.setData` para actualizar sin destruir el chart,
   * lo que permite una transición animada de 400 ms.
   *
   * Si la instancia aún no existe (primer render), reconstruye `chartOptions`
   * y fuerza la re-renderización a través de `chartUpdateFlag`.
   *
   * @param data - Arreglo de objetos `Visitas` con `fecha` y `visitas`.
   */
  private updateChartSeries(data: Visitas[]): void {
    const categories = data.map(d => d.fecha);
    const values = data.map(d => d.visitas);

    if (this.chartInstance) {
      const chart = this.chartInstance;
      chart.xAxis[0].setCategories(categories, true);
      chart.series[0].setData(values, true, { duration: 500 });
    } else {
      this.chartOptions = this.buildChartOptions(categories, values);
      this.chartUpdateFlag.update(v => !v);
    }
  }

  /**
   * Construye el objeto de configuración completo de Highcharts.
   *
   * Define un gráfico de tipo `areaspline` con:
   * - Degradado azul semitransparente como relleno.
   * - Marcadores circulares con borde azul.
   * - Tooltip con formato localizado en español (MX).
   * - Animación de 400 ms para transiciones suaves.
   *
   * @param categories - Array de etiquetas para el eje X (fechas formateadas).
   * @param values     - Array de valores numéricos para el eje Y (visitas).
   * @returns Objeto `Highcharts.Options` listo para asignar al chart.
   */
  private buildChartOptions(categories: string[], values: number[]): Highcharts.Options {
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
          return `<b>${ctx.category}</b><br/>Visitas: <b>${(ctx.y ?? 0).toLocaleString('es-MX')}</b>`;
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
          duration: 400,
        },
      }],
    };
  }

  // ──────────────────────────────────────────────
  //  Carga de datos
  // ──────────────────────────────────────────────

  /**
   * Dispara la carga concurrente de todas las secciones más el total.
   *
   * **Flujo:**
   * 1. Limpia errores previos y resetea el contador de peticiones pendientes.
   * 2. Muestra el spinner de carga.
   * 3. Lanza una petición HTTP por cada sección definida + la clave `'total'`.
   * 4. Cada respuesta:
   *    - Si es `'total'`: actualiza los KPIs (visitas, promedio mensual, promedio diario).
   *    - Si coincide con `selectedSection()`: actualiza la gráfica.
   *    - Siempre almacena la respuesta en `sectionData` para acceso futuro.
   * 5. Al completarse cada petición, decrementa `pendingRequests`.
   * 6. Cuando `pendingRequests` llega a 0, oculta el spinner.
   *
   * Todas las suscripciones se gestionan con `takeUntilDestroyed` para
   * cancelar automáticamente las peticiones pendientes al destruir el componente.
   *
   * @param range - Rango de fechas a consultar.
   */
  private loadAllSections(range: DateRange): void {
    this.errorMsg.set(null);
    this.pendingRequests = 0;
    this.loading.set(true);

    const empresa = this.usuario()?.empresa;
    if (!empresa) {
      this.loading.set(false);
      return;
    }

    const keys = ['total', ...this.sections.map(s => s.key)];

    for (const key of keys) {
      this.pendingRequests++;

      this.visitasService
        .visitasXseccion(environment.division, empresa, key, range.fecha_inicio, range.fecha_fin)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res) => {
            if (key === 'total') {
              this.totalVisitas.set(res.data.total);
              this.promMensual.set(res.data.prom_mensual);
              this.promDiario.set(res.data.prom_dia);
            }

            if (key === this.selectedSection()) {
              this.chartData.set(res.data.data);
              this.updateChartSeries(res.data.data);
            }

            this.sectionData.update(map => {
              const next = new Map(map);
              next.set(key, res);
              return next;
            });

            this.finishRequest();
          },
          error: () => {
            if (key === 'total') {
              this.totalVisitas.set(0);
              this.promMensual.set(0);
              this.promDiario.set(0);
            }
            if (key === this.selectedSection()) {
              this.chartData.set([]);
              this.updateChartSeries([]);
            }

            this.errorMsg.set(
              `No se pudo cargar la sección "${key}". Verifica tu conexión e intenta de nuevo.`
            );

            this.finishRequest();
          },
        });
    }

    this.loadPerfil(range);

  }

  /**
   * Carga el perfil del visitante para el rango dado, con caché en memoria.
   *
   * - Si el rango ya fue consultado antes, se reutiliza la respuesta cacheada
   *   en `perfilData` y no se realiza ninguna petición HTTP.
   * - La clave de caché es `fecha_inicio|fecha_fin`.
   * - La respuesta es agregada (volumen fijo y acotado), por lo que no requiere
   *   paginación; el backend la entrega completa por rango.
   *
   * @param range - Rango de fechas a consultar.
   */
  private loadPerfil(range: DateRange): void {
    const empresa = this.usuario()?.empresa;
    if (!empresa) return;

    const key = `${range.fecha_inicio}|${range.fecha_fin}`;
    if (this.perfilData().has(key)) return;

    this.perfilLoading.set(true);

    this.visitasService
      .perfilVisitante(environment.division, empresa, range.fecha_inicio, range.fecha_fin)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.perfilData.update(map => {
            const nextMap = new Map(map);
            nextMap.set(key, res);
            return nextMap;
          });
          this.perfilLoading.set(false);
        },
        error: () => {
          this.perfilLoading.set(false);
        },
      });
  }

  /**
   * Decrementa el contador de peticiones pendientes.
   * Cuando todas las peticiones han terminado, oculta el spinner de carga.
   */
  private finishRequest(): void {
    this.pendingRequests--;
    if (this.pendingRequests <= 0) {
      this.pendingRequests = 0;
      this.loading.set(false);
    }
  }

  /**
   * Formatea un número usando la configuración regional español (MX).
   * Se usa para mostrar los valores de visitas en los KPIs y tarjetas.
   *
   * @param value - Número a formatear.
   * @returns String formateado con separadores de miles (e.g. `'12,345'`).
   */
  protected formatNumber(value: number): string {
    return value.toLocaleString('es-MX');
  }

  /**
   * Formatea un porcentaje con dos decimales y sufijo `%`.
   *
   * @param value - Valor porcentual (0–100). Si no está definido, muestra `'0.00%'`.
   * @returns String formateado (e.g. `'75.81%'`).
   */
  protected formatPct(value: number | undefined): string {
    return `${(value ?? 0).toFixed(2)}%`;
  }

  /**
   * Calcula el `stroke-dasharray` del anillo donut del país principal.
   *
   * @param pct - Porcentaje del país principal (0–100).
   * @returns Cadena `"lleno total"` para un círculo de radio 34 (C ≈ 213.63).
   */
  protected donutDasharray(pct: number | undefined): string {
    const circumference = 213.63;
    const value = Math.max(0, Math.min(100, pct ?? 0));
    return `${(value / 100) * circumference} ${circumference}`;
  }

  /**
   * Devuelve la bandera emoji de un país para la card de país.
   *
   * @param nombre - Nombre del país tal como llega del backend.
   * @returns Emoji de la bandera, o un globo predeterminado si no hay mapeo.
   */
  protected flagEmoji(nombre?: string): string {
    if (!nombre) return '🌐';
    return FLAGS.get(nombre) ?? FLAGS.get(nombre.trim()) ?? '🌐';
  }
}
