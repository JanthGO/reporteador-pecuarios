import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  signal,
} from '@angular/core';
import { LucideImageOff } from '@lucide/angular';
import { ProductoItem, formatNumber } from '../../productos.mapper';

/**
 * Fila de un producto dentro del ranking.
 *
 * La jerarquía la fija el módulo: el nombre manda, el conteo de visitas resuelve
 * la comparación y la imagen solo confirma el reconocimiento. Por eso el número
 * va alineado a la derecha en cifras tabulares —una columna de cifras que se
 * lee de un vistazo al bajar por la lista— y la miniatura se queda en el tamaño
 * de un recordatorio, no de un escaparate.
 */
@Component({
  selector: 'app-product-row',
  standalone: true,
  imports: [LucideImageOff],
  templateUrl: './product-row.html',
  styleUrl: './product-row.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductRow {
  readonly producto = input.required<ProductoItem>();

  /** Sustituye la foto por un marcador cuando el recurso no carga. */
  readonly imagenFallida = signal(false);

  /** El endpoint puede devolver el producto sin foto: se muestra el marcador. */
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
