import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../shared/components/sidebar/sidebar';
import { Header } from '../shared/components/header/header';
import { AuthService } from '../core/services/auth.service';
@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, Sidebar, Header],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent {
  private authService = inject(AuthService);

  protected readonly sidebarOpen = signal(false);
  protected readonly usuario = this.authService.currentUser;
  protected readonly empresaNombre = this.authService.empresaNombre;
  protected readonly breadcrumb = computed(() => [
    'Marca',
    this.authService.empresaNombre() ?? '',
    'Resumen',
  ]);

  protected toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  protected closeSidebar(): void {
    this.sidebarOpen.set(false);
  }
}