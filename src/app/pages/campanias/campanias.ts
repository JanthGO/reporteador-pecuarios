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
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { Skeleton } from '../../shared/components/skeleton/skeleton';

/** Esqueletos de tarjetas del grid mientras carga el periodo. */
const ESQUELETOS_CAMPANIA = [1, 2, 3, 4];

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
  imports: [DateRangeComponent, CampaignCard, LucideMegaphone, Search, EmptyState, Skeleton],
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

  /** `true` mientras el endpoint del periodo está respondiendo. */
  protected readonly cargando = signal(false);

  /** Mensaje de error de la última carga, o `null` si todo fue bien. */
  protected readonly errorMsg = signal<string | null>(null);

  protected readonly esqueletos = ESQUELETOS_CAMPANIA;

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
  protected cargar(rango: DateRange): void {
    const empresa = this.authService.currentUser()?.empresa;
    if (!empresa) return;

    this.cargando.set(true);
    this.errorMsg.set(null);

    this.campanService
      .mailchimp(this.division, empresa, rango.fecha_inicio, rango.fecha_fin)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.campanas.set(Array.isArray(res?.data) ? res.data.map(toCampania) : []);
          this.cargando.set(false);
        },
        error: () => {
          this.campanas.set([]);
          this.errorMsg.set('No pudimos cargar las campañas del periodo. Verifica tu conexión e intenta de nuevo.');
          this.cargando.set(false);
        },
      });
  }
}