import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { LucideSearch, LucideX } from '@lucide/angular';

/**
 * Buscador compartido.
 *
 * Caja de texto con icono de búsqueda y botón de limpiar. El valor vive en el
 * consumidor vía two-way binding con `value`. Es un filtro de texto puro: no
 * sabe qué filtra, solo notifica el texto escrito.
 */
@Component({
  selector: 'app-search',
  standalone: true,
  imports: [LucideSearch, LucideX],
  templateUrl: './search.html',
  styleUrl: './search.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Search {
  /** Texto de búsqueda; se sincroniza con el consumidor con `[(value)]`. */
  readonly value = model('');

  /** Texto del placeholder. */
  readonly placeholder = input('Buscar...');

  /** Etiqueta accesible del campo. */
  readonly ariaLabel = input('Buscar');

  /** Indica si hay texto (no solo espacios) para mostrar el botón de limpiar. */
  protected readonly hayTexto = computed(() => this.value().trim().length > 0);

  /** Sincroniza el texto escrito hacia el consumidor. */
  onInput(event: Event): void {
    this.value.set((event.target as HTMLInputElement).value);
  }

  /** Vacía la búsqueda. */
  clear(): void {
    this.value.set('');
  }
}