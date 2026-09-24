import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { LucideChevronDown, LucideLogOut, LucideMenu } from '@lucide/angular';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Encabezado global del shell.
 *
 * Muestra la miga de pan, el botón de menú (pantallas pequeñas) y el menú de
 * usuario con la opción de cerrar sesión. Es una barra `sticky`: permanece
 * visible en la parte superior al hacer scroll sin superponer el contenido.
 *
 * Presentacional respecto a los datos de sesión: recibe los textos por `input`
 * y delega el cierre de sesión en `AuthService` (limpieza de credenciales) +
 * navegación a `/login`, con manejo de errores visible dentro del dropdown.
 */
@Component({
  imports: [LucideMenu, LucideChevronDown, LucideLogOut],
  selector: 'app-header',
  styleUrl: './header.css',
  templateUrl: './header.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  private authService = inject(AuthService);
  private router = inject(Router);
  private host = inject(ElementRef<HTMLElement>);

  /** Segmentos de la miga de pan (p. ej. `['Marca', 'Ganaderia', 'Resumen']`). */
  readonly breadcrumb = input<string[]>([]);

  /** Nombre del usuario autenticado mostrado en la barra superior y el menú. */
  readonly userName = input('');

  /** Línea secundaria opcional del menú de usuario (p. ej. nombre de la empresa). */
  readonly subtitle = input('');

  /** Emitido al pulsar el botón de menú (visible solo en pantallas pequeñas). */
  readonly menuClick = output<void>();

  /** Controla la apertura/cierre del dropdown del usuario. */
  protected readonly isMenuOpen = signal(false);

  /** Evita clics duplicados mientras el cierre de sesión está en curso. */
  protected readonly isLoggingOut = signal(false);

  /** `true` si el cierre de sesión falló; se muestra en el dropdown. */
  protected readonly logoutError = signal(false);

  /** Iniciales del nombre del usuario para el avatar. */
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

  protected toggleMenu(): void {
    this.isMenuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  /** Cierra el menú al hacer clic fuera del encabezado. */
  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.isMenuOpen()) return;
    if (this.host.nativeElement.contains(event.target as Node)) return;
    this.isMenuOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.isMenuOpen.set(false);
  }

  /**
   * Cierra la sesión del usuario.
   *
   * - Limpia las credenciales almacenadas (token, usuario y empresa) a través
   *   de `AuthService.logout()`, que resetea las señales y `localStorage`.
   * - Redirige a `/login`.
   * - Ante cualquier fallo muestra un mensaje de error en el dropdown y
   *   mantiene la sesión intacta para reintentar.
   */
  protected async logout(): Promise<void> {
    if (this.isLoggingOut()) return;

    this.isLoggingOut.set(true);
    this.logoutError.set(false);

    try {
      this.authService.logout();
      const navigated = await this.router.navigate(['/login']);
      if (!navigated) {
        throw new Error('No se pudo navegar al inicio de sesión.');
      }
      this.isMenuOpen.set(false);
    } catch {
      this.logoutError.set(true);
    } finally {
      this.isLoggingOut.set(false);
    }
  }
}