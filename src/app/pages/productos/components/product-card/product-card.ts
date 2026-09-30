import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { LucideImageOff } from '@lucide/angular';
import { formatNumber } from '../../../../shared/utils/numeros';
import { elemento } from '../../../../core/interfaces/dashboard/visitas';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [LucideImageOff],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCard {
  readonly producto = input.required<elemento>();
  readonly imagenFallida = signal(false);

  protected readonly tieneImagen = computed(() => (this.producto().imagen ?? '').trim().length > 0);

  protected readonly formatNumber = formatNumber;

  constructor() {
    // Al cambiar de producto se reintenta la imagen: Angular reutiliza esta
    // instancia entre elementos del `@for`.
    effect(() => {
      this.producto().imagen;
      this.imagenFallida.set(false);
    });
  }
}