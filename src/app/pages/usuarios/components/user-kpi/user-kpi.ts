import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LucideUsers } from '@lucide/angular';
import { Skeleton } from '../../../../shared/components/skeleton/skeleton';
import {
  TOPE_DIAS,
  UMBRALES_ALTAS,
  DiaAltas,
  RangoFechas,
  UsuarioItem,
  formatDia,
  formatNumber,
  formatVariacion,
  mapaDeAltas,
} from '../../usuarios.mapper';

/** Niveles de intensidad que se pintan en la leyenda del mapa. */
const NIVELES = [0, 1, 2, 3, 4] as const;

/** Iniciales de los días de la semana, con la semana empezando en lunes. */
const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;

/** Cifras de apoyo de la banda, en el orden en que se pintan. */
const APOYOS = [1, 2, 3, 4] as const;

/**
 * Banda de KPIs de usuarios registrados.
 *
 * La tarjeta lleva la cifra del periodo y, debajo, el mapa de altas por día:
 * un total suelto obliga a cambiar de vista para entender cómo llegó hasta ahí,
 * y el mapa lo dice de un vistazo y sin pedir interacción —si las altas se
 * agrupan en campañas sueltas o si la base crece de forma constante, y qué fines
 * de semana se quedaron flojos, que una serie por meses promedia hasta
 * borrarlos.
 *
 * Las cuatro cifras de abajo responden a lo que el mapa no puede decir con una
 * sola palabra: cuál es el ritmo normal, hacia dónde va, cuál fue el mejor día
 * y si las altas se reparten o se concentran en pocos días.
 *
 * Recibe la base ya normalizada y el periodo aplicado, y deriva aquí todo lo que
 * se muestra, para que la página no cargue con la agregación.
 */
@Component({
  selector: 'app-user-kpi',
  standalone: true,
  imports: [LucideUsers, Skeleton],
  templateUrl: './user-kpi.html',
  styleUrl: './user-kpi.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserKpi {
  /** Base de usuarios del periodo, ya normalizada por el mapper. */
  readonly usuarios = input<readonly UsuarioItem[]>([]);

  /** Periodo aplicado, que es el eje del mapa de altas. */
  readonly rango = input<RangoFechas | null>(null);

  /** Marca la vista como en carga para mostrar los esqueletos. */
  readonly loading = input(false);

  protected readonly niveles = NIVELES;
  protected readonly diasSemana = DIAS_SEMANA;
  protected readonly apoyos = APOYOS;
  protected readonly formatNumber = formatNumber;
  protected readonly formatVariacion = formatVariacion;

  protected readonly total = computed(() => this.usuarios().length);

  /** Mapa de altas del periodo y sus cifras de ritmo. */
  protected readonly mapa = computed(() => mapaDeAltas(this.usuarios(), this.rango()));

  /** Media diaria redondeada: una fracción de alta no dice nada. */
  protected readonly media = computed(() => Math.round(this.mapa().media));

  /** Altas de la última semana del mapa. */
  protected readonly ultimosSiete = computed(() => this.mapa().ultimosSiete);

  /** Días del periodo que registró al menos un alta. */
  protected readonly diasConAltas = computed(() => this.mapa().diasConAltas);

  /** Variación de la última semana frente a la anterior, en porcentaje. */
  protected readonly variacion = computed(() => this.mapa().variacion);

  /** Sentido de la variación, para el icono y el color de la cifra. */
  protected readonly sentido = computed<'sube' | 'baja' | 'plano'>(() => {
    const variacion = this.variacion();
    if (variacion === null || variacion === 0) return 'plano';
    return variacion > 0 ? 'sube' : 'baja';
  });

  /** Fecha del día con más altas, o cadena vacía si el periodo no tuvo ninguna. */
  protected readonly picoLabel = computed(() => {
    const pico = this.mapa().pico;
    return pico ? formatDia(pico.iso) : '';
  });

  /** Cuántos días cubre el mapa, en el mismo formato que el resto de cifras. */
  protected readonly diasMapa = computed(() => formatNumber(this.mapa().diasMapa));

  /** Título del eje de meses cuando el mapa se recorta por su final. */
  protected readonly recorte = computed(
    () => `Mapa de altas por día · últimos ${formatNumber(TOPE_DIAS)} días`,
  );

  /** Título del eje de meses con el periodo completo. */
  protected readonly periodo = computed(() => `Mapa de altas por día · ${this.diasMapa()} días`);

  /**
   * Texto que anuncia el mapa a un lector de pantalla.
   *
   * Trescientas casillas no se leen una a una: lo que hace falta es la magnitud
   * de la ventana, su densidad y el día que la marcaría. Todas las cifras son de
   * la ventana pintada —no del periodo completo cuando este se recortó— porque es
   * lo que el mapa muestra.
   *
   * @returns Descripción del mapa completo.
   */
  protected readonly descripcionMapa = computed(() => {
    const mapa = this.mapa();
    if (!mapa.diasMapa) return '';

    const ventana = mapa.recortado
      ? `de los últimos ${formatNumber(mapa.diasMapa)} días del periodo consultado`
      : `de ${formatNumber(mapa.diasMapa)} días`;
    const pico = mapa.pico
      ? ` El día con más altas fue el ${formatDia(mapa.pico.iso)}, con ${formatNumber(mapa.pico.conteo)} altas.`
      : '';
    return `Mapa de altas por día ${ventana}: ${formatNumber(mapa.total)} altas repartidas en ${formatNumber(mapa.diasConAltas)} días con registro y con la intensidad proporcional al día con más altas.${pico}`;
  });

  /**
   * Tramo de altas que representa un nivel del mapa.
   *
   * El tono es relativo al día más lleno del periodo, así que los tramos solo
   * existen al pintarlos: salen de los mismos umbrales con los que el mapper
   * asigna el nivel, y no de una segunda escala que se desincronizaría de la
   * primera.
   *
   * @param nivel - Nivel de la muestra de la leyenda.
   * @returns Rango de altas que cubre ese tono.
   */
  protected rangoDeNivel(nivel: number): string {
    const max = this.mapa().max;
    if (nivel === 0) return 'Días sin altas';
    if (max <= 0) return 'Días sin altas';

    const desde = nivel === 1 ? 1 : Math.floor(UMBRALES_ALTAS[nivel - 2] * max) + 1;
    const hasta = nivel === 4 ? max : Math.max(desde, Math.floor(UMBRALES_ALTAS[nivel - 1] * max));
    return `${formatNumber(desde)}–${formatNumber(hasta)} altas`;
  }

  /**
   * Texto que aparece al pasar el puntero sobre una casilla.
   *
   * @param dia - Celda del mapa.
   * @returns Fecha y número de altas de ese día; cadena vacía fuera del periodo.
   */
  protected tituloDeDia(dia: DiaAltas): string {
    if (!dia.enPeriodo) return '';
    const altas = dia.conteo === 1 ? '1 alta' : `${formatNumber(dia.conteo)} altas`;
    return `${formatDia(dia.iso)} · ${altas}`;
  }
}
