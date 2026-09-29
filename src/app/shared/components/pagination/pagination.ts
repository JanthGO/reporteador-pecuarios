import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { LucideChevronLeft, LucideChevronRight } from '@lucide/angular';
import { SelectField } from '../select-field/select-field';

const NUMERO = new Intl.NumberFormat('es-MX');

/** Marca de los tramos que la ventana de páginas no muestra. */
const HUECO = '…';

/** Máximo de páginas visibles a la vez; el resto se resume con la marca de hueco. */
const VENTANA = 7;

/**
 * Paginación compartida.
 *
 * Vive en `shared` porque el problema —recorrer miles de registros que ya están
 * en el cliente— no es de esta página: cualquier listado largo va a necesitarlo.
 * El componente no pide datos ni los filtra; solo conoce cuántas páginas hay, cuál
 * se está viendo y cuántas filas caben, y avisa de los cambios.
 *
 * En un listado de miles de filas el número de páginas llega a doscientas, así que
 * los botones no se dibujan todos: se muestra una ventana alrededor de la página
 * activa con la primera y la última siempre visibles, que es la disposición que
 * mantiene predecible el salto al final de la lista.
 */
@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [LucideChevronLeft, LucideChevronRight, SelectField],
  templateUrl: './pagination.html',
  styleUrl: './pagination.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Pagination {
  /** Página visible, base 1. */
  readonly pagina = input.required<number>();

  /** Número de páginas del conjunto filtrado. */
  readonly totalPaginas = input.required<number>();

  /** Registros del conjunto filtrado, antes de paginar. */
  readonly total = input.required<number>();

  /** Registros por página. */
  readonly pageSize = input.required<number>();

  /** Tamaños de página ofrecidos. */
  readonly pageSizes = input<readonly number[]>([25, 50, 100]);

  /** Sustantivo con el que se cuenta lo que hay en la lista. */
  readonly unidad = input('registros');

  /** Petición de salto a otra página. */
  readonly paginaChange = output<number>();

  /** Petición de otro tamaño de página. */
  readonly pageSizeChange = output<number>();

  /** Primer registro de la página visible, o cero si el conjunto está vacío. */
  protected readonly desde = computed(() => {
    if (this.total() === 0) return 0;
    return (Math.max(1, this.pagina()) - 1) * this.pageSize() + 1;
  });

  /** Último registro de la página visible. */
  protected readonly hasta = computed(() => Math.min(this.pagina() * this.pageSize(), this.total()));

  /**
   * Opciones del selector de tamaño de página.
   *
   * Se ofrecen los tamaños declarados en `pageSizes` y, si el tamaño actual no
   * está entre ellos, también ese: así el control nunca muestra un valor que no
   * corresponde a lo que realmente hace.
   *
   * @returns Tamaños disponibles como opciones del desplegable.
   */
  protected readonly opcionesTamano = computed(() => {
    const declarados = [...this.pageSizes()];
    const actual = this.pageSize();
    if (actual > 0 && !declarados.includes(actual)) declarados.push(actual);
    return [...new Set(declarados)]
      .sort((a, b) => a - b)
      .map((tamano) => ({ valor: String(tamano), label: String(tamano) }));
  });

  /** ¿Se puede ir hacia atrás? */
  protected readonly hayAnterior = computed(() => this.pagina() > 1);

  /** ¿Se puede ir hacia adelante? */
  protected readonly haySiguiente = computed(() => this.pagina() < this.totalPaginas());

  /**
   * Botones de la ventana de páginas, con la marca de hueco donde no cabe todo.
   *
   * @returns Secuencia de números de página y separadores.
   */
  protected readonly paginas = computed<readonly (number | typeof HUECO)[]>(() => {
    const total = this.totalPaginas();
    const actual = this.pagina();

    if (total <= 1) return total === 1 ? [1] : [];
    if (total <= VENTANA) {
      return Array.from({ length: total }, (_, indice) => indice + 1);
    }

    const alcance = Math.floor((VENTANA - 3) / 2);
    const visibles = new Set<number>([1, total, actual]);
    for (let salto = 1; salto <= alcance; salto++) {
      visibles.add(actual - salto);
      visibles.add(actual + salto);
    }

    const botones: (number | typeof HUECO)[] = [];
    let anterior = 0;
    for (const numero of [...visibles].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b)) {
      if (anterior && numero - anterior > 1) botones.push(HUECO);
      botones.push(numero);
      anterior = numero;
    }
    return botones;
  });

  /**
   * Salta a una página, sin salirse del rango.
   *
   * @param pagina - Página destino.
   */
  irA(pagina: number): void {
    const destino = Math.min(Math.max(1, pagina), this.totalPaginas());
    if (destino === this.pagina()) return;
    this.paginaChange.emit(destino);
  }

  /** Avanza una página. */
  siguiente(): void {
    this.irA(this.pagina() + 1);
  }

  /** Retrocede una página. */
  anterior(): void {
    this.irA(this.pagina() - 1);
  }

  /**
   * Propaga el nuevo tamaño de página.
   *
   * @param valor - Tamaño elegido, en texto porque llega del desplegable.
   */
  onPageSize(valor: string): void {
    const tamano = Number(valor);
    if (!tamano || tamano === this.pageSize()) return;
    this.pageSizeChange.emit(tamano);
  }

  /**
   * Escribe un número con separadores de miles.
   *
   * @param valor - Número a formatear.
   * @returns Cadena con separadores de miles.
   */
  protected formatNumber(valor: number): string {
    return NUMERO.format(valor);
  }

  /**
   * Compone la frase de cobertura, con el sustantivo en singular cuando corresponde.
   *
   * @returns Texto de la línea de resultados.
   */
  protected readonly cobertura = computed(() => {
    const total = this.total();
    if (total === 0) return `Sin ${this.unidad()}`;
    const unidad = total === 1 ? this.unidad().replace(/s$/, '') : this.unidad();
    return `Mostrando ${this.formatNumber(this.desde())}–${this.formatNumber(this.hasta())} de ${this.formatNumber(total)} ${unidad}`;
  });
}
