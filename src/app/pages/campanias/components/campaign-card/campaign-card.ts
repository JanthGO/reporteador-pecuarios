import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';
import { LucideArrowUpRight, LucideImageOff } from '@lucide/angular';
import { CampaniaItem } from '../../../../core/interfaces/campanias/Campania';

/**
 * Tarjeta de una campaña.
 *
 * La tarjeta completa es el enlace: un solo ancla que abre la campaña en una
 * pestaña nueva. Así el elemento se lee como clickeable sin duplicar el
 * destino en un segundo enlace anidado, y el icono de la derecha es
 * decorativo (`aria-hidden`).
 */
@Component({
  selector: 'app-campaign-card',
  standalone: true,
  imports: [LucideArrowUpRight, LucideImageOff],
  templateUrl: './campaign-card.html',
  styleUrl: './campaign-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignCard {
  readonly campania = input.required<CampaniaItem>();

  /** Sustituye la imagen por un marcador cuando el recurso no carga. */
  readonly imagenFallida = signal(false);

  constructor() {
    // Al cambiar de campaña se reintenta la imagen: Angular reutiliza esta
    // instancia entre elementos del `@for`.
    effect(() => {
      this.campania().imagen;
      this.imagenFallida.set(false);
    });
  }
}
