import {  Component, ChangeDetectionStrategy, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';
import { VisitasService } from '../../core/services/visitas.service';
import { Contenidos, OpcionOrden, Orden, Secciones, elemento } from '../../core/interfaces/dashboard/visitas';
import { environment } from '../../../environments/environment';
import { DateRangeComponent, DateRange } from '../../shared/components/date-range/date-range.component';
import { Search } from '../../shared/components/search/search';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { KpiBand } from './components/kpi-band/kpi-band';
import { ProductCard } from './components/product-card/product-card';
import { VisitorProfile } from '../../shared/components/visitor-profile/visitor-profile';
import { Skeleton } from '../../shared/components/skeleton/skeleton';
import { formatNumber } from '../../shared/utils/numeros';
import { normalizar } from '../../shared/utils/texto';

export const ORDENES: readonly OpcionOrden[] = [
  { key: 'visitas-desc', label: 'Más visitados' },
  { key: 'visitas-asc', label: 'Menos visitados' },
  { key: 'nombre-asc', label: 'Nombre A–Z' },
];

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [
    DateRangeComponent,
    Search,
    EmptyState,
    KpiBand,
    ProductCard,
    VisitorProfile,
    Skeleton,
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

  protected readonly periodo = signal<DateRange>({ fecha_inicio: '', fecha_fin: '' });

  protected readonly busqueda = signal('');
  protected readonly orden = signal<Orden>('visitas-desc');

  protected readonly soloActivos = signal(true);

  protected readonly cargando = signal(false);

  /** Datos de la sección de productos. `null` mientras no haya respuesta. */
  protected readonly seccion = signal<Secciones | null>(null);

  protected readonly formatNumber = formatNumber;
  protected readonly formatRango = formatRango;
  protected readonly ordenes = ORDENES;
  protected readonly esqueletos = [1, 2, 3, 4, 5, 6];
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


  onRangeChange(periodo: DateRange): void {
    this.periodo.set(periodo);
    this.cargar(periodo);
  }

  onOrdenChange(orden: Orden): void {
    this.orden.set(orden);
  }

  alternarSoloActivos(): void {
    this.soloActivos.update((valor) => !valor);
  }

  /**
   * Consulta la sección de productos del periodo indicado.
   *
   * @param periodo - Periodo a consultar.
   */
  private cargar(periodo: DateRange): void {
    const empresa = this.authService.currentUser()?.empresa;
    if (!empresa) return;

    this.cargando.set(true);
    this.visitasService
      .seccion(this.division, empresa, 'productos', periodo.fecha_inicio, periodo.fecha_fin)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.seccion.set(res?.data ?? null);
          this.cargando.set(false);
        },
        error: () => {
          this.seccion.set(null);
          this.cargando.set(false);
        },
      });
  }
}

const COMPARADORES: Record<Orden, (a: elemento, b: elemento) => number> = {
  'visitas-desc': (a, b) =>
    (b.visitas ?? 0) - (a.visitas ?? 0) || (a.nombre ?? '').localeCompare(b.nombre ?? '', 'es'),
  'visitas-asc': (a, b) =>
    (a.visitas ?? 0) - (b.visitas ?? 0) || (a.nombre ?? '').localeCompare(b.nombre ?? '', 'es'),
  'nombre-asc': (a, b) =>
    (a.nombre ?? '').localeCompare(b.nombre ?? '', 'es', { sensitivity: 'base' }),
};

/**
 * Selecciona el listado de productos del periodo.
 *
 * @param contenidos - Contenidos de productos devueltos por el endpoint.
 * @param busqueda - Texto de búsqueda por nombre.
 * @param orden - Criterio de ordenamiento.
 * @param soloActivos - Cuando es `true`, descarta los productos no activos.
 * @returns Productos listos para el template, con su posición y su escala.
 */
export function selectProductos(
  contenidos: Contenidos | null | undefined,
  busqueda = '',
  orden: Orden = 'visitas-desc',
  soloActivos = true,
): elemento[] {
  const fuente = Array.isArray(contenidos?.data) ? contenidos.data : [];
  const termino = normalizar(busqueda);

  const filtrados = fuente.filter((item) => {
    if (soloActivos && item?.estatus !== 1) return false;
    if (termino && !normalizar(item?.nombre).includes(termino)) return false;
    return true;
  });

  const ordenados = [...filtrados].sort(COMPARADORES[orden] ?? COMPARADORES['visitas-desc']);
  const maxVisitas = ordenados.reduce((max, item) => Math.max(max, item?.visitas ?? 0), 0);

  return ordenados.map((item, index) => ({
    id: item?.id ?? index,
    nombre: item?.nombre?.trim() ?? '',
    imagen: item?.imagen ?? '',
    visitas: item?.visitas ?? 0,
    estatus: item?.estatus ?? 0,
    activo: item?.estatus === 1,
    posicion: index + 1,
    proporcion: maxVisitas > 0 ? ((item?.visitas ?? 0) / maxVisitas) * 100 : 0,
    url: item?.url ?? '',
  }));
}

/**
 * Formatea un periodo para la línea de resultados.
 *
 * @param periodo - Periodo aplicado, con ambos extremos en `YYYY-MM-DD`.
 * @returns Rango legible (`dd/mm/aaaa – dd/mm/aaaa`) o cadena vacía.
 */
export function formatRango(periodo: DateRange | null): string {
  if (!periodo?.fecha_inicio || !periodo?.fecha_fin) return '';
  return `${periodo.fecha_inicio.split('-').reverse().join('/')} – ${periodo.fecha_fin
    .split('-')
    .reverse()
    .join('/')}`;
}

/**
 * Indica si el endpoint trajo algo que mostrar para el periodo.
 *
 * Sin esta comprobación, un rango sin actividad se confunde con un módulo vacío:
 * los skeletons se sustituyen por un estado vacío explícito.
 *
 * @param seccion - Datos de la sección de productos.
 * @returns `true` si hay visitas, productos o perfil demográfico.
 */
export function hayDatosPeriodo(seccion: Secciones | null | undefined): boolean {
  if (!seccion) return false;

  const totalVisitas = seccion.visitas?.total ?? 0;
  const totalProductos = seccion.contenidos?.total ?? 0;
  const serie = Array.isArray(seccion.visitas?.data) ? seccion.visitas.data.length : 0;
  const perfil = seccion.perfilVisita;
  const categorias = (perfil?.ocupaciones?.length ?? 0) + (perfil?.paises?.length ?? 0);

  return totalVisitas > 0 || totalProductos > 0 || serie > 0 || categorias > 0;
}