import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import {
  LucideLayoutGrid,
  LucideMail,
  LucideImage,
  LucideFileText,
  LucideGlobe,
  LucideNewspaper,
  LucideCalendar,
  LucideVideo,
  LucideUsers,
  LucideSyringe,
} from '@lucide/angular';

/**
 * Barra lateral de navegación compartida por todas las vistas autenticadas.
 *
 * Se renderiza dentro del shell (`app-layout`) por lo que persiste entre
 * navegaciones. En pantallas pequeñas se comporta como panel off-canvas: el
 * layout aplica `.layout--sidebar-open` para mostrarla y `close` se emite al
 * elegir una opción.
 */
@Component({
  imports: [
    RouterLink,
    RouterLinkActive,
    LucideLayoutGrid,
    LucideMail,
    LucideImage,
    LucideFileText,
    LucideGlobe,
    LucideNewspaper,
    LucideCalendar,
    LucideVideo,
    LucideUsers,
    LucideSyringe
  ],
  selector: 'app-sidebar',
  styleUrl: './sidebar.css',
  templateUrl: './sidebar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  protected readonly authService = inject(AuthService);
  public readonly empresaNombre = this.authService.empresaNombre;

  /** Notifica al layout la elección de una opción para cerrar el menú en móvil. */
  readonly close = output<void>();

}