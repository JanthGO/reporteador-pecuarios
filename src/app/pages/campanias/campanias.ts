import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideMegaphone } from '@lucide/angular';
import { CampaniaMail } from '../../core/interfaces/campanias/Campania';
import { DateRangeComponent, DateRange } from '../../shared/components/date-range/date-range.component';
import { AuthService } from '../../core/services/auth.service';
import { CampaignCard } from './components/campaign-card/campaign-card';
import { CampaniasService } from '../../core/services/campanias.service';
import { environment } from '../../../environments/environment';
import { Search } from '../../shared/components/search/search';
import { Skeleton } from '../../shared/components/skeleton/skeleton';
import { aIso } from '../../shared/utils/fechas';
import { normalizar } from '../../shared/utils/texto';

@Component({
  selector: 'app-campanias',
  standalone: true,
  imports: [DateRangeComponent, CampaignCard, LucideMegaphone, Search, Skeleton],
  templateUrl: './campanias.html',
  styleUrl: './campanias.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Campanias {
  private readonly campanService = inject(CampaniasService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly division = environment.division;
  private readonly IMAGEN_BASE = environment.IMAGEN_BASE + 'mailchimp/';

  protected readonly esqueletos = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  protected readonly busqueda = signal('');
  protected readonly periodo = signal<DateRange>({ fecha_inicio: '', fecha_fin: '' });
  protected readonly cargando = signal(false);
  private readonly campanas = signal<CampaniaMail[]>([]);

  /** Campañas que se pintan: periodo + búsqueda, de más reciente a más antigua. */
  protected readonly campanasVisibles = computed(() =>
    this.selectCampanias(this.campanas(), this.periodo(), this.busqueda()),
  );

  /**
   * Aplica el periodo elegido en el filtro de fechas.
   * @param rango - Periodo emitido por `<app-date-range>`.
   */
  onRangeChange(rango: DateRange): void {
    this.periodo.set(rango);
    this.cargar(rango);
  }

  /**
   * Carga las campañas del periodo desde el endpoint de Mailchimp.
   *
   * Normaliza la respuesta cruda (`CampaniaMail`) con `toCampaniaMail`; el
   * filtrado por periodo y nombre lo hace `selectCampanias` en los computados
   * de la vista.
   *
   * @param rango - Periodo a consultar.
   */
  protected cargar(rango: DateRange): void {
    const empresa = this.authService.currentUser()?.empresa;
    if (!empresa) return;

    this.cargando.set(true);

    this.campanService
      .mailchimp(this.division, empresa, rango.fecha_inicio, rango.fecha_fin)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.campanas.set(Array.isArray(res?.data) ? res.data.map((m) => this.toCampaniaMail(m)) : []);
          this.cargando.set(false);
        },
        error: () => {
          this.campanas.set([]);
          this.cargando.set(false);
        },
      });
  }


  /**
   * Normaliza un registro del endpoint de Mailchimp para el grid de tarjetas.
   *
   * La fecha se deja cruda: `selectCampanias` la usa para filtrar por rango y la
   * tarjeta la formatea para mostrarla.
   *
   * @param mail - Registro crudo de `GET /mailchimp/...`.
   * @returns Registro `CampaniaMail` listo para la tarjeta.
   */
  toCampaniaMail(mail: CampaniaMail): CampaniaMail {
    return {
      id: mail.id,
      nombre: mail.nombre?.trim() ?? '',
      fecha_publicacion: mail.fecha_publicacion ?? '',
      imagen: mail.imagen ? this.IMAGEN_BASE + mail.imagen : '',
      url: mail.url ?? '',
    };
  }

  /**
   * Selecciona las campañas que corresponden a un periodo y a una búsqueda.
   *
   * @param campanas - Conjunto de campañas de origen.
   * @param rango    - Periodo aplicado; ambos extremos son `YYYY-MM-DD`.
   * @param busqueda - Texto de búsqueda por nombre.
   * @returns Campañas filtradas, ordenadas y listas para el template.
   */
  selectCampanias(campanas: CampaniaMail[] | null | undefined, rango: DateRange, busqueda = ''): CampaniaMail[] {
    if (!Array.isArray(campanas)) return [];

    const desde = aIso(rango?.fecha_inicio ?? '');
    const hasta = aIso(rango?.fecha_fin ?? '');
    const termino = normalizar(busqueda);

    return campanas
      .filter((campania) => {
        const iso = aIso(campania?.fecha_publicacion ?? '');
        if (desde && iso < desde) return false;
        if (hasta && iso > hasta) return false;
        if (termino && !normalizar(campania?.nombre).includes(termino)) return false;
        return true;
      })
      .sort((a, b) => aIso(b?.fecha_publicacion ?? '').localeCompare(aIso(a?.fecha_publicacion ?? '')));
  }
}