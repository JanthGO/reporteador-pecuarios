import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { Sidebar } from '../shared/components/sidebar/sidebar';
import { Header } from '../shared/components/header/header';
import { AuthService } from '../core/services/auth.service';
import { Footer } from '../shared/components/footer/footer';

/** Rótulo de la sección en la migas de pan, por segmento de ruta. */
const SECCIONES: Record<string, string> = {
  dashboard: 'Resumen',
  productos: 'Productos',
  campanias: 'Campañas',
  'usuarios-registrados': 'Usuarios registrados',
};

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, Sidebar, Header, Footer],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent {
  private authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly sidebarOpen = signal(false);
  protected readonly usuario = this.authService.currentUser;
  protected readonly empresaNombre = this.authService.empresaNombre;

  /**
   * Ruta activa, como señal.
   *
   * `Router.url` es un valor plano, no reactivo, así que la migas se quedaría
   * congelada en la primera sección visitada; los eventos de navegación son lo que
   * la mantiene al día sin recargar la vista.
   */
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  /** Nombre de la sección que se está viendo. */
  protected readonly seccion = computed(() => {
    const [segmento = ''] = this.url().split('?')[0].split('/').filter(Boolean);
    return SECCIONES[segmento] ?? SECCIONES['dashboard'];
  });

  protected readonly breadcrumb = computed(() => [
    'Marca',
    this.authService.empresaNombre() ?? '',
    this.seccion(),
  ]);

  protected toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  protected closeSidebar(): void {
    this.sidebarOpen.set(false);
  }
}