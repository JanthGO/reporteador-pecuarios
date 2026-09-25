import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideRefreshCw } from '@lucide/angular';
import { AuthService } from '../../core/services/auth.service';
import { VisitasService } from '../../core/services/visitas.service';
import { Secciones } from '../../core/interfaces/dashboard/visitas';
import { environment } from '../../../environments/environment';
import {
  DateRangeComponent,
  DateRange,
} from '../../shared/components/date-range/date-range.component';
import { Search } from '../../shared/components/search/search';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { KpiBand } from './components/kpi-band/kpi-band';
import { ProductRow } from './components/product-row/product-row';
import { ProductsVisitorProfile } from './components/products-visitor-profile/products-visitor-profile';
import {
  ORDENES,
  OrdenProductos,
  formatNumber,
  formatRango,
  hayDatosPeriodo,
  selectProductos,
} from './productos.mapper';

/** Esqueletos del listado mientras llegan los productos. */
const ESQUELETONS_FILA = [1, 2, 3, 4, 5, 6];

/**
 * Vista de productos.
 *
 * Reúne en una sola pantalla la lectura completa de la sección: cuánto detuvo el
 * periodo en visitas y con qué forma llegó ese volumen, cuántos productos hay
 * publicados, cuál se llevó el tráfico, quién los visitó y el ranking completo
 * con sus conteos. La fuente es el endpoint de secciones del proyecto
 * (`GET /visits/{division}/{empresa}/productos/{fi}/{ff}`), y el periodo, el
 * nombre, el orden y el estado activo se resuelven en el cliente sobre esos
 * mismos datos: ninguna vista necesita un modelo paralelo.
 *
 * La agregación y la lectura de los totales viven en `productos.mapper` y en
 * `<app-kpi-band>`; aquí solo quedan el periodo, los filtros y los estados de la
 * vista.
 */
@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [
    DateRangeComponent,
    Search,
    EmptyState,
    KpiBand,
    ProductRow,
    ProductsVisitorProfile,
    LucideRefreshCw,
  ],
  templateUrl: './productos.html',
  styleUrl: './productos.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Productos {
  private readonly visitasService = inject(VisitasService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly division = environment.division;
  private readonly sitio = environment.nombre_dominio;

  /** Periodo aplicado. Lo inicializa `<app-date-range>` al montarse. */
  protected readonly rango = signal<DateRange>({ fecha_inicio: '', fecha_fin: '' });

  protected readonly busqueda = signal('');
  protected readonly orden = signal<OrdenProductos>('visitas-desc');

  /**
   * Estado activo del listado. El proyecto filtra los productos por
   * `estatus === 1`, así que el control arranca encendido y el comportamiento de
   * negocio no cambia: solo se vuelve visible y reversible.
   */
  protected readonly soloActivos = signal(true);

  protected readonly cargando = signal(false);
  protected readonly errorMsg = signal<string | null>(null);

  /** Datos de la sección de productos. `null` mientras no haya respuesta. */
  protected readonly seccion = signal<Secciones | null>(null);

  protected readonly formatNumber = formatNumber;
  protected readonly formatRango = formatRango;
  protected readonly ordenes = ORDENES;
  protected readonly esqueletos = ESQUELETONS_FILA;
  protected readonly sitioNombre = this.sitio;

  /* ── Datos derivados ── */

  protected readonly perfil = computed(() => this.seccion()?.perfilVisita ?? null);
  protected readonly hayDatos = computed(() => hayDatosPeriodo(this.seccion()));

  protected readonly productos = computed(() =>
    selectProductos(this.seccion()?.contenidos, this.busqueda(), this.orden(), this.soloActivos()),
  );

  /** Vacío de búsqueda: hay productos, pero ninguno con ese nombre. */
  protected readonly sinCoincidencias = computed(
    () => this.productos().length === 0 && this.busqueda().trim().length > 0,
  );

  /** Vacío de listado: el periodo no trae productos que cumplan los filtros. */
  protected readonly sinProductos = computed(
    () => this.productos().length === 0 && this.busqueda().trim().length === 0,
  );

  /* ── Eventos ── */

  /**
   * Aplica el periodo emitido por `<app-date-range>` y recarga la sección.
   *
   * @param rango - Periodo a consultar.
   */
  onRangeChange(rango: DateRange): void {
    this.rango.set(rango);
    this.cargar(rango);
  }

  /**
   * Cambia el criterio de ordenamiento del listado.
   *
   * @param orden - Criterio elegido en el control segmentado.
   */
  onOrdenChange(orden: OrdenProductos): void {
    this.orden.set(orden);
  }

  /** Alterna el filtro de productos activos. */
  alternarSoloActivos(): void {
    this.soloActivos.update((valor) => !valor);
  }

  /** Reintenta la carga del periodo tras un fallo. */
  reintentar(): void {
    this.cargar(this.rango());
  }

  /* ── Carga de datos ── */

  /**
   * Consulta la sección de productos del periodo indicado.
   *
   * @param rango - Periodo a consultar.
   */
  private cargar(rango: DateRange): void {
    const empresa = this.authService.currentUser()?.empresa;
    if (!empresa) {
      this.errorMsg.set('No se pudo identificar la empresa de la sesión.');
      return;
    }

    this.cargando.set(true);
    this.errorMsg.set(null);

    this.visitasService
      .seccion(this.division, empresa, 'productos', rango.fecha_inicio, rango.fecha_fin)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.seccion.set(res?.data ?? null);
          this.cargando.set(false);
        },
        error: () => {
          this.seccion.set(null);
          this.cargando.set(false);
          this.errorMsg.set(
            'No se pudo cargar la información de productos. Verifica tu conexión e intenta de nuevo.',
          );
        },
      });
  }
}
