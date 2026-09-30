import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { LucideArrowUpRight, LucideImageOff } from '@lucide/angular';
import { CampaniaMail } from '../../../../core/interfaces/campanias/Campania';
import { aIso, formatFechaLarga } from '../../../../shared/utils/fechas';

@Component({
  selector: 'app-campaign-card',
  standalone: true,
  imports: [LucideArrowUpRight, LucideImageOff],
  templateUrl: './campaign-card.html',
  styleUrl: './campaign-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignCard {
  readonly campania = input.required<CampaniaMail>();
  readonly imagenFallida = signal(false);

  readonly fechaLabel = computed(() => formatFechaLarga(this.campania().fecha_publicacion));

  constructor() {
    // Al cambiar de campaña se reintenta la imagen: Angular reutiliza esta instancia entre elementos del `@for`.
    effect(() => {
      this.campania().imagen;
      this.imagenFallida.set(false);
    });
  }
}
