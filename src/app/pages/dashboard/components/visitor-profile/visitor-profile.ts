import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LucideUser, LucideClock, LucideGlobe } from '@lucide/angular';
import {
  AgeBucket,
  PerfilVisitante,
  info,
  rangosEdad,
} from '../../../../core/interfaces/dashboard/PerfilVisitante';
import { environment } from '../../../../../environments/environment';


@Component({
  selector: 'app-visitor-profile',
  standalone: true,
  imports: [LucideUser, LucideClock, LucideGlobe],
  templateUrl: './visitor-profile.html',
  styleUrl: './visitor-profile.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisitorProfile {
  readonly perfil = input<PerfilVisitante | null>(null);
  readonly sitio = environment.nombre_dominio;
  /** Top de ocupaciones (hasta 7). Se ordena descendentemente por el backend. */
  protected readonly ocupaciones = computed<info[]>(
    () => (this.perfil()?.ocupaciones ?? []).slice(0, 7),
  );
  protected readonly ocupacionPrincipal = computed<info | null>(
    () => this.ocupaciones()[0] ?? null,
  );
  protected readonly ocupacionesSecundarias = computed<info[]>(
    () => this.ocupaciones().slice(1),
  );

  /**
   * Distribución combinada de edad (hombre + mujer por rango), ordenada de forma
   * descendente. El backend entrega los porcentajes separados por género, y la
   * regla de negocio los agrega para mostrar el desglose total por rango de edad.
   * La transformación vive en `rangosEdad` porque el módulo de productos consume
   * exactamente la misma regla.
   */
  protected readonly rangosEdad = computed<AgeBucket[]>(() => rangosEdad(this.perfil()));

  protected readonly edadPrincipal = computed<AgeBucket | null>(
    () => this.rangosEdad()[0] ?? null,
  );
  protected readonly edadesSecundarias = computed<AgeBucket[]>(
    () => this.rangosEdad().slice(1),
  );

  /** Top de países */
  protected readonly paises = computed<info[]>(
    () => (this.perfil()?.paises ?? []).slice(0, 8),
  );
  protected readonly paisPrincipal = computed<info | null>(
    () => this.paises()[0] ?? null,
  );
  protected readonly paisesSecundarios = computed<info[]>(
    () => this.paises().slice(1),
  );

  /**
   * Formatea un porcentaje con dos decimales y sufijo `%`.
   *
   * @param value - Valor porcentual (0–100). Si no está definido, muestra `'0.00%'`.
   * @returns String formateado (e.g. `'75.81%'`).
   */
  protected formatPct(value: number | undefined): string {
    return `${(value ?? 0).toFixed(2)}%`;
  }
}