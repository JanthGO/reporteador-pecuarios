import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LucideUser, LucideClock, LucideGlobe } from '@lucide/angular';
import { AgeBucket, PerfilVisitante, info } from '../../../../core/interfaces/dashboard/PerfilVisitante';


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
  readonly sitio = input(this.storedSite());

  /** Nombre del sitio (dominio) a mostrar en la nota al pie, con fallback a localStorage. */
  private storedSite(): string {
    if (typeof localStorage === 'undefined') return '';
    return localStorage.getItem('sitio') ?? '';
  }

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
   */
  protected readonly rangosEdad = computed<AgeBucket[]>(() => {
    const perfil = this.perfil();
    if (!perfil?.visitasXgenero) return [];

    const man = perfil.visitasXgenero.porcientoMan;
    const woman = perfil.visitasXgenero.porcientoWoman;

    return [
      { label: 'Menos de 20 años', value: man.menos20 + woman.menos20 },
      { label: '20–30 años', value: man.entre20y30 + woman.entre20y30 },
      { label: '30–40 años', value: man.entre30y40 + woman.entre30y40 },
      { label: '40–50 años', value: man.entre40y50 + woman.entre40y50 },
      { label: '50–60 años', value: man.entre50y60 + woman.entre50y60 },
      { label: 'Más de 60 años', value: man.mas60 + woman.mas60 },
    ].sort((a, b) => b.value - a.value);
  });

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