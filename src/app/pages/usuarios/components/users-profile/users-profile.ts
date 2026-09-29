import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LucideBriefcase, LucideGlobe, LucideUsers } from '@lucide/angular';
import { HighchartsChartComponent } from 'highcharts-angular';
import type Highcharts from 'highcharts';
import { Skeleton } from '../../../../shared/components/skeleton/skeleton';
import { GrupoPerfil, formatNumber, formatPct } from '../../usuarios.mapper';

/** Cuántas tarjetas de esqueleto se dibujan mientras llega la base. */
const ESQUELETONS = [1, 2, 3];

/** Diámetro del anillo, compartido por la gráfica y el centro. */
const ANILLO = 140;

/** Tono del icono de cada dimensión, del que se tiñe su paleta. */
const TONOS: Record<GrupoPerfil['clave'], number> = {
  pais: 158,
  edad: 250,
  ocupacion: 185,
};

/**
 * Composición demográfica de la base de usuarios registrados.
 *
 * Tres paneles —país, edad y ocupación— con la misma gramática de tarjeta que el
 * resto del sistema. Cada panel es un donut: la proporción de cada categoría se
 * lee del arco a un vistazo, el centro sostiene el tamaño de la base y la lista
 * de abajo devuelve la cifra exacta, con el punto de color del segmento que la
 * representa. Así lo que antes comparaba longitudes ahora compara superficies,
 * sin perder el detalle por categoría.
 *
 * La edad es la excepción que ya estaba: su lista mantiene el orden cronológico
 * y nada se resalta como destacado, porque señalar el tramo con más gente no
 * dice nada del cambio de edad de la base.
 */
@Component({
  selector: 'app-users-profile',
  standalone: true,
  imports: [HighchartsChartComponent, LucideBriefcase, LucideGlobe, LucideUsers, Skeleton],
  templateUrl: './users-profile.html',
  styleUrl: './users-profile.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersProfile {
  /** Grupos demográficos calculados sobre el periodo completo. */
  readonly grupos = input.required<GrupoPerfil[]>();

  /** Marca la vista como en carga para mostrar los esqueletos. */
  readonly loading = input(false);

  protected readonly esqueletos = ESQUELETONS;
  protected readonly formatNumber = formatNumber;
  protected readonly formatPct = formatPct;

  /**
   * Opciones de Highcharts por grupo, preparadas una sola vez por carga.
   *
   * Cada periodo entrega un arreglo nuevo de `grupos()`, y con él se reconstruye
   * el mapa de opciones de los tres anillos en un solo pase.
   */
  protected readonly opciones = computed<Record<GrupoPerfil['clave'], Highcharts.Options>>(() => {
    const mapa = {} as Record<GrupoPerfil['clave'], Highcharts.Options>;
    for (const grupo of this.grupos()) {
      if (grupo.items.length) mapa[grupo.clave] = opcionesAnillo(grupo);
    }
    return mapa;
  });

  /**
   * Color del segmento en la posición indicada.
   *
   * Es el mismo que pinta Highcharts en la serie, para que el punto de la leyenda
   * y el arco del anillo vayan a juego.
   *
   * @param clave - Dimensión a colorear.
   * @param posicion - Índice de la categoría dentro del grupo.
   * @returns Color en notación `hsl()`.
   */
  protected colorDe(clave: GrupoPerfil['clave'], posicion: number): string {
    return tonoDe(clave, posicion);
  }
}

/**
 * Color del segmento `i` de una dimensión, derivado del tono de su icono.
 *
 * Highcharts no admite variables CSS en su configuración, así que la paleta se
 * construye en `hsl()`: el tono fijo de la dimensión y una luminosidad que
 * crece con el índice. En país y ocupación las categorías llegan ordenadas de
 * mayor a menor, de modo que los arcos grandes quedan saturados y la cola se
 * aclara; en edad, el orden cronológico solo pide colores distinguibles.
 *
 * @param clave - Dimensión.
 * @param i - Índice del segmento.
 * @returns Color en notación `hsl()`.
 */
function tonoDe(clave: GrupoPerfil['clave'], i: number): string {
  const hue = TONOS[clave];
  const saturacion = Math.max(34, 58 - i * 3);
  const luminosidad = Math.min(72, 40 + i * 4);
  return `hsl(${hue} ${saturacion}% ${luminosidad}%)`;
}

/**
 * Paleta completa de una dimensión, alineada con la que pinta la leyenda.
 *
 * @param clave - Dimensión.
 * @param n - Cuántos colores se necesitan.
 * @returns Colores en `hsl()`, uno por categoría.
 */
function paleta(clave: GrupoPerfil['clave'], n: number): string[] {
  return Array.from({ length: n }, (_, i) => tonoDe(clave, i));
}

/**
 * Opciones de Highcharts para un anillo de la composición.
 *
 * Donut sin etiquetas de arco —la proporción es la que se lee del área— y con el
 * valor exacto en el tooltip, para que el centro y la lista solo acompañen.
 *
 * @param grupo - Dimensión demográfica.
 * @returns Opciones de serie `pie`.
 */
function opcionesAnillo(grupo: GrupoPerfil): Highcharts.Options {
  return {
    chart: {
      type: 'pie',
      height: ANILLO,
      margin: [0, 0, 0, 0],
      spacing: [0, 0, 0, 0],
      style: { fontFamily: 'inherit' },
    },
    title: { text: undefined },
    credits: { enabled: false },
    legend: { enabled: false },
    tooltip: {
      backgroundColor: '#fff',
      borderColor: '#e2e8f0',
      borderRadius: 8,
      shadow: { color: 'rgba(0,0,0,0.08)', offsetX: 0, offsetY: 2, width: 8 },
      style: { fontSize: '0.8125rem', color: '#1a202c' },
      formatter: function (): string {
        const punto = this;
        return `<b>${punto.name}</b><br/>${formatNumber(punto.y ?? 0)} usuarios &middot; ${formatPct(punto.percentage ?? 0)}`;
      },
    },
    plotOptions: {
      pie: {
        innerSize: '64%',
        borderWidth: 2,
        borderColor: '#ffffff',
        dataLabels: { enabled: false },
        states: { hover: { brightness: 0.06 } },
        animation: { duration: 320 },
      },
    },
    series: [
      {
        type: 'pie',
        name: grupo.label,
        data: grupo.items.map((item, i) => ({
          name: item.label,
          y: item.conteo,
          color: paleta(grupo.clave, grupo.items.length)[i],
        })),
      },
    ],
  };
}