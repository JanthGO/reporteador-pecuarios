import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Bloque de carga reutilizable.
 *
 * Representa una pieza de contenido que aún no llegó (petición asíncrona o
 * contenido dinámico). El consumidor controla el tamaño con `width` y `height`
 * (cualquier valor CSS; por defecto `100%` x `1rem`) y decide el radio de
 * esquinas con `radius` (por defecto el token `--radius-sm`). Es decorativo:
 * se expone con `aria-hidden` y conviene marcarlo dentro de contenedores con
 * `aria-busy` mientras la vista carga.
 */
@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    <span
      class="skeleton"
      [style.width]="width()"
      [style.height]="height()"
      [style.borderRadius]="radius()"
      aria-hidden="true"
    ></span>
  `,
  styleUrl: './skeleton.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Skeleton {
  /** Anchura del bloque (px, rem, %, ...). */
  readonly width = input<string | number>('100%');
  /** Altura del bloque (px, rem, %, ...). */
  readonly height = input<string | number>('1rem');
  /** Radio de esquinas; por defecto hereda el token del sistema. */
  readonly radius = input<string>('var(--radius-sm)');
}