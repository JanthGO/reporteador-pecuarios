import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';
import { PerfilVisitante } from '../../../../core/interfaces/dashboard/PerfilVisitante';
import { environment } from '../../../../../environments/environment';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { GrupoPerfil, formatPct, selectPerfilGrupos } from '../../productos.mapper';

/** Iconografía de cada bloque demográfico, siguiendo la del perfil del dashboard. */
const ICONOS: Record<GrupoPerfil['clave'], string> = {
  ocupacion: 'user',
  edad: 'clock',
  pais: 'globe',
};

/**
 * Perfil del visitante de la sección de productos.
 *
 * Reagrupa los tres bloques demográficos en barras rankeadas: cada categoría
 * ocupa una fila con su nombre, su porcentaje real y una barra escalada contra
 * el máximo de su propio grupo. Así una cuota del 4% sigue siendo visible y
 * comparable con la de 48%, que es justo lo que se pierde al dibujar el
 * porcentaje sobre una escala de 0 a 100.
 */
@Component({
  selector: 'app-products-visitor-profile',
  standalone: true,
  imports: [LucideDynamicIcon, EmptyState],
  templateUrl: './products-visitor-profile.html',
  styleUrl: './products-visitor-profile.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsVisitorProfile {
  readonly perfil = input<PerfilVisitante | null>(null);
  readonly loading = input(false);

  protected readonly sitio = environment.nombre_dominio;

  protected readonly grupos = computed(() =>
    selectPerfilGrupos(this.perfil()).map((grupo) => ({
      ...grupo,
      icono: ICONOS[grupo.clave],
    })),
  );

  /** Sin ninguna categoría en los tres bloques, la sección no dice nada. */
  protected readonly vacio = computed(() => this.grupos().every((grupo) => !grupo.items.length));

  protected readonly formatPct = formatPct;
}
