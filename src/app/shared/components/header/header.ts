import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { LucideMenu } from '@lucide/angular';

/**
 * Encabezado global del shell.
 *
 * Presentacional: recibe la miga de pan y el nombre del usuario por `input` y
 * emite `menuClick` para abrir la navegación en pantallas pequeñas.
 */
@Component({
  imports: [LucideMenu],
  selector: 'app-header',
  styleUrl: './header.css',
  templateUrl: './header.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  readonly breadcrumb = input<string[]>([]);
  readonly userName = input('');

  /** Emitido al pulsar el botón de menú (visible solo en pantallas pequeñas). */
  readonly menuClick = output<void>();

  protected readonly avatarInitial = computed(() => {
    const name = this.userName().trim();
    if (!name) return '?';
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  });
}