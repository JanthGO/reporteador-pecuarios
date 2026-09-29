import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { UsuarioItem } from '../../usuarios.mapper';

/**
 * Fila del directorio de usuarios.
 *
 * Cada fila es una rejilla de cinco celdas que en escritorio se alinean con la
 * cabecera y en móvil se apila mostrando la etiqueta de cada dato. El marcado usa
 * los roles de `table`/`row`/`cell` sobre `div`: el listado se presenta como una
 * tabla de datos —lo que es— aunque su apariencia no lo sea, para que un lector de
 * pantalla pueda recorrer cabecera y celdas por columnas.
 *
 * La plantilla de columnas no vive aquí sino en la página, que la publica como
 * variable CSS: cabecera y filas comparten así una sola definición y no pueden
 * desalinearse por un cambio en el reparto de anchos.
 */
@Component({
  selector: 'app-user-row',
  standalone: true,
  templateUrl: './user-row.html',
  styleUrl: './user-row.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserRow {
  /** Usuario que se muestra en la fila, ya normalizado por el mapper. */
  readonly usuario = input.required<UsuarioItem>();
}
