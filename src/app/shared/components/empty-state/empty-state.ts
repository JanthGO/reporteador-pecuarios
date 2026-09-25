import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';

/**
 * Estado vacío compartido.
 *
 * Resuelve una sola vez la pregunta que cualquier panel de datos tiene que
 * responder —qué mostrar cuando no hay nada—: marco punteado, icono sobre disco
 * tintado, el título de lo que falta y la acción de recuperación. La página de
 * productos lo usa en los cuatro casos en que una vista puede quedarse sin
 * contenido.
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [LucideDynamicIcon],
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyState {
  /** Nombre del icono de Lucide; identifica el tipo de vacío. Opcional. */
  readonly icon = input<string>();

  /** Qué falta, en una línea. */
  readonly title = input.required<string>();

  /** Qué hacer al respecto. Opcional cuando no hay acción posible. */
  readonly detail = input<string>('');

  /** `danger` invierte el color para errores de carga. */
  readonly tone = input<'neutral' | 'danger'>('neutral');
}
