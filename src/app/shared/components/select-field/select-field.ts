import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { LucideChevronDown } from '@lucide/angular';

/** Opción de un desplegable de filtro. */
export interface OpcionSelect {
  valor: string;
  label: string;
  /** Peso de la opción en la base; se muestra junto a la etiqueta. */
  conteo?: number;
}

const NUMERO = new Intl.NumberFormat('es-MX');

/**
 * Desplegable de filtro compartido.
 *
 * Envuelve un `<select>` nativo con la etiqueta, el caret y el anillo de foco del
 * sistema. Se apoya en el control nativo a propósito: hereda el teclado, el
 * lector de pantalla y el comportamiento móvil del sistema operativo, y en este
 * catálogo las opciones son decenas o cientos, no miles — un combobox propio solo
 * añadiría código sin ganar accesibilidad.
 *
 * El valor se sincroniza en las dos direcciones con `[(value)]` y el primer
 * `<option>` representa "sin filtro", de modo que limpiar es una elección más del
 * desplegable y no un control aparte.
 */
@Component({
  selector: 'app-select-field',
  standalone: true,
  imports: [LucideChevronDown],
  templateUrl: './select-field.html',
  styleUrl: './select-field.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectField {
  /** Rótulo del filtro. */
  readonly label = input.required<string>();

  /** Valor seleccionado; se sincroniza con el consumidor con `[(value)]`. */
  readonly value = model('');

  /** Opciones disponibles. El valor vacío es la que se muestra como "sin filtro". */
  readonly options = input<readonly OpcionSelect[]>([]);

  /** Texto de la opción sin filtro. */
  readonly placeholder = input('Todos');

  /** Bloquea el control, por ejemplo mientras la base de un filtro aún carga. */
  readonly disabled = input(false);

  /**
   * `field` apila la etiqueta sobre el control; `inline` la coloca al lado, que es
   * lo que necesitan los controles compactos como el tamaño de página.
   */
  readonly variant = input<'field' | 'inline'>('field');

  /**
   * Añade el conteo a la etiqueta de la opción.
   *
   * En el desplegable importa que "Jalisco (312)" y "Colima (9)" no se lean igual:
   * el número orienta la elección antes de aplicarla, y `title` deja el valor
   * completo en el tooltip para el que se queda corto el ancho.
   *
   * @param opcion - Opción a etiquetar.
   * @returns Texto visible de la opción.
   */
  protected texto(opcion: OpcionSelect): string {
    if (opcion.conteo === undefined || opcion.conteo === null) return opcion.label;
    return `${opcion.label} (${NUMERO.format(opcion.conteo)})`;
  }

  /**
   * Propaga el valor elegido.
   *
   * @param event - Cambio del `<select>` nativo.
   */
  onChange(event: Event): void {
    this.value.set((event.target as HTMLSelectElement).value);
  }
}
