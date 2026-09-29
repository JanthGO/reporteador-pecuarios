import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import {
  LucideArrowRight,
  LucideDynamicIcon,
  LucideInbox,
  LucideMonitor,
  LucideSmartphone,
} from '@lucide/angular';
import { ActivityItem } from '../../../../core/interfaces/dashboard/ActividadReciente';
import { AuthService } from '../../../../core/services/auth.service';
import { Skeleton } from '../../../../shared/components/skeleton/skeleton';

/** Ícono de Lucide por clase de badge de sección, espejo de las secciones del dashboard. */
const SECTION_ICONS: Record<string, string> = {
  'icon-productos': 'syringe',
  'icon-articulos': 'file-text',
  'icon-micrositio': 'globe',
  'icon-noticias': 'newspaper',
  'icon-eventos': 'calendar',
  'icon-vacantes': 'users',
  'icon-videos': 'video',
  'icon-general': 'activity',
};

/** Esqueletos de tarjetas de actividad mientras la sección carga. */
const ESQUELETOS_ACTIVIDAD = [1, 2, 3, 4, 5, 6];

@Component({
  selector: 'app-recent-activity',
  standalone: true,
  imports: [LucideDynamicIcon, LucideInbox, LucideMonitor, LucideSmartphone, Skeleton],
  templateUrl: './recent-activity.html',
  styleUrl: './recent-activity.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentActivity {
  private authService = inject(AuthService);
  readonly actividad = input<ActivityItem[]>([]);
  readonly loading = input(false);
  readonly empresa = this.authService.empresaNombre();
  protected readonly esqueletos = ESQUELETOS_ACTIVIDAD;

  /** Nombre del ícono de Lucide para la sección de la actividad. */
  iconFor(item: ActivityItem): string {        
    return SECTION_ICONS[item.seccionClass] ?? 'activity';
  }
}