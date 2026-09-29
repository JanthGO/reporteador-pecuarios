import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  LucideArrowUpDown,
  LucideChevronDown,
  LucideChevronUp,
  LucideRefreshCw,
} from '@lucide/angular';
import { StatisticService } from '../../core/services/statistic.service';
import { Usuarios as UsuariosRespuesta } from '../../core/interfaces/users/user';
import { environment } from '../../../environments/environment';
import { DateRange, DateRangeComponent } from '../../shared/components/date-range/date-range.component';
import { Search } from '../../shared/components/search/search';
import { SelectField } from '../../shared/components/select-field/select-field';
import { Pagination } from '../../shared/components/pagination/pagination';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { Skeleton } from '../../shared/components/skeleton/skeleton';
import { UserKpi } from './components/user-kpi/user-kpi';
import { UsersProfile } from './components/users-profile/users-profile';
import { UserRow } from './components/user-row/user-row';
import {
  COLUMNAS,
  CampoOrden,
  FILTROS_VACIOS,
  FiltrosDirectorio,
  ORDEN_INICIAL,
  OrdenUsuario,
  formatNumber,
  formatRango,
  gruposPerfil,
  hayFiltros,
  opcionesFiltro,
  paginar,
  selectUsuarios,
  toUsuarios,
  totalPaginas,
} from './usuarios.mapper';

/** Filas de esqueleto que se dibujan mientras llega la base. */
const ESQUELETONS_FILA = [1, 2, 3, 4, 5, 6, 7, 8];

/**
 * Cómo se nombra cada sentido de orden en el desplegable compacto de móvil.
 *
 * "Registro descendente" no dice nada; "más recientes primero" sí. En el resto de
 * columnas —texto— el nombre alfabético basta como etiqueta de los dos sentidos.
 */
const SENTIDO: Record<CampoOrden, Record<'asc' | 'desc', string>> = {
  nombre: { asc: 'A–Z', desc: 'Z–A' },
  pais: { asc: 'A–Z', desc: 'Z–A' },
  estado: { asc: 'A–Z', desc: 'Z–A' },
  ocupacion: { asc: 'A–Z', desc: 'Z–A' },
  fecha: { asc: 'Más antiguos primero', desc: 'Más recientes primero' },
};

/**
 * Vista de usuarios registrados.
 *
 * Reúne en una pantalla la lectura completa de la base: cuánto mide el periodo y
 * cómo llegó ese total, cómo se reparte la gente por país, edad y ocupación, y el
 * directorio completo con sus filtros, su orden y su paginación.
 *
 * La fuente es `GET users/{division}/{fecha_inicio}/{fecha_fin}`, que devuelve el
 * periodo entero sin paginar ni filtrar. Por eso el reparto es explícito: el perfil
 * y los totales describen la base completa —para eso están los KPIs— y los filtros
 * del directorio acotan solo el listado. Mezclarlos daría cifras que no
 * corresponden a nada que el analista pueda leer.
 *
 * Toda la agregación, el filtrado y el orden viven en `usuarios.mapper`; aquí solo
 * quedan el periodo, el estado de la vista y el recorte a la página visible.
 */
@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    DateRangeComponent,
    Search,
    SelectField,
    Pagination,
    EmptyState,
    Skeleton,
    UserKpi,
    UsersProfile,
    UserRow,
    LucideArrowUpDown,
    LucideChevronDown,
    LucideChevronUp,
    LucideRefreshCw,
  ],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Usuarios {
  private readonly statisticService = inject(StatisticService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly division = environment.division;

  /** Periodo aplicado. Lo inicializa `<app-date-range>` al montarse. */
  protected readonly rango = signal<DateRange>({ fecha_inicio: '', fecha_fin: '' });

  protected readonly cargando = signal(false);
  protected readonly errorMsg = signal<string | null>(null);

  /** Respuesta cruda del endpoint; `null` mientras no haya carga válida. */
  private readonly crudos = signal<UsuariosRespuesta[] | null>(null);

  /* ── Estado del directorio ── */

  protected readonly busqueda = signal('');
  protected readonly filtros = signal<FiltrosDirectorio>(FILTROS_VACIOS);
  protected readonly orden = signal<OrdenUsuario>(ORDEN_INICIAL);
  protected readonly pagina = signal(1);
  protected readonly pageSize = signal(25);

  protected readonly columnas = COLUMNAS;
  protected readonly esqueletos = ESQUELETONS_FILA;
  protected readonly pageSizes = [25, 50, 100];
  protected readonly formatNumber = formatNumber;
  protected readonly formatRango = formatRango;

  /**
   * Día contra el que se mide la edad de los usuarios.
   *
   * Se fija una sola vez al montar la vista: recalcularlo en cada lectura haría que
   * las edades cambiaran a mitad de la sesión sin que cambie ningún dato.
   */
  private readonly hoy = new Date();

  /* ── Base del periodo ── */

  /** Usuarios del periodo ya normalizados, que es la base de KPIs y perfil. */
  protected readonly usuarios = computed(() => toUsuarios(this.crudos(), this.hoy));

  protected readonly hayDatos = computed(() => this.usuarios().length > 0);

  protected readonly grupos = computed(() => gruposPerfil(this.usuarios()));

  /* ── Filtros del directorio ── */

  protected readonly paises = computed(() => opcionesFiltro(this.usuarios(), 'pais'));

  protected readonly ocupaciones = computed(() => opcionesFiltro(this.usuarios(), 'ocupacionLabel'));

  /**
   * Estados disponibles, acotados al país elegido.
   *
   * El endpoint no encadena filtros, así que la dependencia se resuelve en el
   * cliente: con un país seleccionado solo tiene sentido ofrecer los estados que
   * existen dentro de él, y con todos los países la lista completa sigue válida.
   */
  private readonly baseEstados = computed(() => {
    const pais = this.filtros().pais;
    const usuarios = this.usuarios();
    return pais ? usuarios.filter((usuario) => usuario.pais === pais) : usuarios;
  });

  protected readonly estados = computed(() => opcionesFiltro(this.baseEstados(), 'estado'));

  /* ── Directorio ── */

  protected readonly filtrados = computed(() =>
    selectUsuarios(this.usuarios(), this.filtros(), this.busqueda(), this.orden()),
  );

  protected readonly totalPaginas = computed(() => totalPaginas(this.filtrados().length, this.pageSize()));

  /** Solo los registros de la página visible: al DOM no llegan los miles. */
  protected readonly visibles = computed(() =>
    paginar(this.filtrados(), this.pagina(), this.pageSize()),
  );

  /** Hay filtros o búsqueda activos: el vacío es del listado, no del periodo. */
  protected readonly directorioAcotado = computed(
    () => hayFiltros(this.filtros()) || this.busqueda().trim().length > 0,
  );

  /**
   * Orden activo serializado, para el desplegable compacto de móvil.
   *
   * @returns Valor `campo:direccion` del criterio vigente.
   */
  protected readonly ordenActual = computed(() => `${this.orden().campo}:${this.orden().direccion}`);

  /** Criterios del desplegable compacto, uno por columna y sentido. */
  protected readonly opcionesOrden = computed(() =>
    this.columnas.flatMap((columna) =>
      (['asc', 'desc'] as const).map((direccion) => ({
        valor: `${columna.campo}:${direccion}`,
        label: `${columna.label} · ${SENTIDO[columna.campo][direccion]}`,
      })),
    ),
  );

  constructor() {
    // Un filtro o una búsqueda distinta pueden dejar la página actual fuera de
    // rango; se vuelve a la primera en vez de mostrar un listado vacío.
    effect(() => {
      const total = this.totalPaginas();
      if (this.pagina() > total) this.pagina.set(total);
    });
  }

  /* ── Eventos ── */

  /**
   * Aplica el periodo emitido por `<app-date-range>` y recarga la base.
   *
   * @param rango - Periodo a consultar.
   */
  onRangeChange(rango: DateRange): void {
    this.rango.set(rango);
    this.cargar(rango);
  }

  /**
   * Reintenta la carga del periodo tras un fallo.
   */
  reintentar(): void {
    this.cargar(this.rango());
  }

  /**
   * Aplica el texto del buscador y vuelve a la primera página.
   *
   * @param valor - Texto escrito.
   */
  onBusqueda(valor: string): void {
    this.busqueda.set(valor);
    this.pagina.set(1);
  }

  /**
   * Filtra por país y limpia el estado, que puede haber quedado de otro país.
   *
   * @param pais - País elegido; vacío significa todos.
   */
  onFiltroPais(pais: string): void {
    this.filtros.update((actual) => ({ ...actual, pais, estado: '' }));
    this.pagina.set(1);
  }

  /**
   * Filtra por estado.
   *
   * @param estado - Estado elegido; vacío significa todos.
   */
  onFiltroEstado(estado: string): void {
    this.filtros.update((actual) => ({ ...actual, estado }));
    this.pagina.set(1);
  }

  /**
   * Filtra por ocupación.
   *
   * @param ocupacion - Ocupación elegida; vacía significa todas.
   */
  onFiltroOcupacion(ocupacion: string): void {
    this.filtros.update((actual) => ({ ...actual, ocupacion }));
    this.pagina.set(1);
  }

  /**
   * Cambia el campo de ordenamiento; repetir el campo activo invierte el sentido.
   *
   * Voltear con el mismo control es lo que espera quien ya sabe que está ordenando
   * por ese campo, y evita un segundo grupo de botones en la cabecera.
   *
   * @param campo - Columna pulsada.
   */
  onOrden(campo: CampoOrden): void {
    this.orden.update((actual) =>
      actual.campo === campo
        ? { campo, direccion: actual.direccion === 'asc' ? 'desc' : 'asc' }
        : { campo, direccion: 'asc' },
    );
    this.pagina.set(1);
  }

  /**
   * Valor de `aria-sort` de una columna.
   *
   * @param campo - Columna a describir.
   * @returns `"ascending"`, `"descending"` o `"none"`.
   */
  ariaSort(campo: CampoOrden): 'ascending' | 'descending' | 'none' {
    if (this.orden().campo !== campo) return 'none';
    return this.orden().direccion === 'asc' ? 'ascending' : 'descending';
  }

  /**
   * Aplica el criterio elegido en el desplegable compacto de móvil.
   *
   * @param valor - Criterio en formato `campo:direccion`.
   */
  onOrdenValor(valor: string): void {
    const [campo, direccion] = valor.split(':');
    if (!campo || (direccion !== 'asc' && direccion !== 'desc')) return;
    this.orden.set({ campo: campo as CampoOrden, direccion });
    this.pagina.set(1);
  }

  /**
   * Cambia de página dentro del directorio.
   *
   * @param pagina - Página destino.
   */
  onPagina(pagina: number): void {
    this.pagina.set(pagina);
  }

  /**
   * Cambia el número de filas por página y vuelve a la primera.
   *
   * @param pageSize - Nuevo tamaño de página.
   */
  onPageSize(pageSize: number): void {
    this.pageSize.set(pageSize);
    this.pagina.set(1);
  }

  /* ── Carga de datos ── */

  /**
   * Consulta los usuarios registrados del periodo indicado.
   *
   * @param rango - Periodo a consultar.
   */
  private cargar(rango: DateRange): void {
    if (!rango.fecha_inicio || !rango.fecha_fin) return;

    this.cargando.set(true);
    this.errorMsg.set(null);

    this.statisticService
      .users(this.division, rango.fecha_inicio, rango.fecha_fin)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.crudos.set(res?.data ?? null);
          // El directorio arranca limpio con cada periodo: un estado o una
          // ocupación que no existen en la base nueva dejaría el desplegable
          // sin opción marcada y el listado sin explicar por qué está vacío.
          this.busqueda.set('');
          this.filtros.set(FILTROS_VACIOS);
          this.pagina.set(1);
          this.cargando.set(false);
        },
        error: () => {
          this.crudos.set(null);
          this.cargando.set(false);
          this.errorMsg.set(
            'No se pudo cargar la información de usuarios. Verifica tu conexión e intenta de nuevo.',
          );
        },
      });
  }
}
