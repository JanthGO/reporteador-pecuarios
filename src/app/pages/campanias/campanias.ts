import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideMegaphone } from '@lucide/angular';
import { Campania } from '../../core/interfaces/campanias/Campania';
import { DateRangeComponent, DateRange } from '../../shared/components/date-range/date-range.component';
import { AuthService } from '../../core/services/auth.service';
import { Footer } from '../../shared/components/footer/footer';
import { CampaignCard } from './components/campaign-card/campaign-card';
import { selectCampanias, toCampania } from './campanias.mapper';
import { CampaniasService } from '../../core/services/campanias.service';
import { environment } from '../../../environments/environment';
import { Search } from '../../shared/components/search/search';

/**
 * Vista de campañas.
 *
 * Permite consultar las campañas publicadas por la empresa dentro de un
 * periodo y localizarlas por nombre. El listado es un grid de tarjetas
 * horizontales: sin tablas en ningún breakpoint.
 *
 * La fuente de datos es el endpoint `GET /mailchimp/{division}/{empresa}/...`:
 * el periodo elegido se envía al backend y el nombre se filtra en el cliente.
 */
@Component({
  selector: 'app-campanias',
  standalone: true,
  imports: [DateRangeComponent, CampaignCard, LucideMegaphone, Search],
  templateUrl: './campanias.html',
  styleUrl: './campanias.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Campanias {
  private readonly campanService = inject(CampaniasService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly division = environment.division;

  /** Periodo aplicado. Lo inicializa `<app-date-range>` al montarse. */
  protected readonly rango = signal<DateRange>({ fecha_inicio: '', fecha_fin: '' });

  /** Texto del buscador por nombre de campaña. */
  protected readonly busqueda = signal('');

  private readonly campanas = signal<Campania[]>([]);

  /** Campañas que se pintan: periodo + búsqueda, de más reciente a más antigua. */
  protected readonly campanasVisibles = computed(() =>
    selectCampanias(this.campanas(), this.rango(), this.busqueda()),
  );

  /**
   * Aplica el periodo elegido en el filtro de fechas.
   *
   * @param rango - Periodo emitido por `<app-date-range>`.
   */
  onRangeChange(rango: DateRange): void {
    this.rango.set(rango);
    this.cargar(rango);
  }

  /**
   * Carga las campañas del periodo desde el endpoint de Mailchimp.
   *
   * Convierte la respuesta cruda (`CampaniaMail`) al modelo interno
   * (`Campania`) con `toCampania`; el filtrado por periodo y nombre lo hace
   * `selectCampanias` en los computados de la vista.
   *
   * @param rango - Periodo a consultar.
   */
  private cargar(rango: DateRange): void {
    const empresa = this.authService.currentUser()?.empresa;
    if (!empresa) return;

    this.campanService
      .mailchimp(this.division, empresa, rango.fecha_inicio, rango.fecha_fin)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.campanas.set(Array.isArray(res?.data) ? res.data.map(toCampania) : []);
        },
        error: () => {
          this.campanas.set([]);
        },
      });
  }
}