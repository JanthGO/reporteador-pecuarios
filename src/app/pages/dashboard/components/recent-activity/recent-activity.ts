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

/** Ícono de Lucide por clase de badge de sección, espejo de las secciones del dashboard. */
const SECTION_ICONS: Record<string, string> = {
  'activity-badge--productos': 'syringe',
  'activity-badge--articulos': 'file-text',
  'activity-badge--micrositio': 'globe',
  'activity-badge--noticias': 'newspaper',
  'activity-badge--eventos': 'calendar',
  'activity-badge--vacante': 'users',
  'activity-badge--videos': 'video',
  'activity-badge--general': 'activity',
};

@Component({
  selector: 'app-recent-activity',
  standalone: true,
  imports: [LucideDynamicIcon, LucideInbox, LucideMonitor, LucideSmartphone],
  templateUrl: './recent-activity.html',
  styleUrl: './recent-activity.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentActivity {
  private authService = inject(AuthService);
  readonly actividad = input<ActivityItem[]>([]);
  readonly empresa = this.authService.empresaNombre();

  /** Nombre del ícono de Lucide para la sección de la actividad. */
  iconFor(item: ActivityItem): string {    
    return SECTION_ICONS[item.seccionClass] ?? 'activity';
  }
}