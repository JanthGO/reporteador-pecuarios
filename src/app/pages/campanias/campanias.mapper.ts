import { Campania, CampaniaItem, CampaniaMail, RangoFechas } from '../../core/interfaces/campanias/Campania';

/**
 * Mapper de la vista de campañas.
 *
 * Aplica el periodo y la búsqueda por nombre sobre el conjunto de campañas y
 * devuelve el modelo de vista que renderiza el grid de tarjetas. Vive aislado
 * del componente para poder probarse de forma independiente, igual que
 * `recent-activity.mapper` en el dashboard.
 */

const FECHA = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

/** Corta `YYYY-MM-DD HH:mm:ss` a `YYYY-MM-DD`, la parte comparable del rango. */
function aIso(fecha: string): string {
  return (fecha ?? '').slice(0, 10);
}

/**
 * Normaliza un texto para búsquedas tolerantes: minúsculas, sin tildes y
 * sin espacios sobrantes.
 *
 * @param texto - Texto de entrada (nombre de campaña o consulta).
 * @returns Texto normalizado para comparar.
 */
function normalizar(texto: string): string {
  return (texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();
}

/**
 * Formatea la fecha de publicación de una campaña.
 *
 * Si la cadena no es una fecha válida se devuelve tal cual, para no perder
 * información del dato de origen.
 *
 * @param fecha - Fecha cruda de la campaña (`YYYY-MM-DD[ HH:mm:ss]`).
 * @returns Fecha en formato corto es-MX (p. ej. `18 sep 2026`).
 */
export function formatFechaCampania(fecha: string): string {
  const iso = aIso(fecha);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return fecha ?? '';

  const [y, m, d] = iso.split('-').map(Number);
  return FECHA.format(new Date(y, m - 1, d));
}

/**
 * Convierte un registro de campaña en el modelo de vista de su tarjeta.
 *
 * @param campania - Registro de origen.
 * @returns Modelo de vista con la fecha ya formateada.
 */
export function toCampaniaItem(campania: Campania): CampaniaItem {
  return {
    id: campania.id,
    nombre: campania.nombre?.trim() ?? '',
    fechaLabel: formatFechaCampania(campania.fecha),
    fechaIso: aIso(campania.fecha),
    imagen: campania.imagen ?? '',
    enlace: campania.enlace ?? '',
  };
}

/** Prefijo del CDN donde viven las imágenes de las campañas. */
const IMAGEN_BASE = 'https://www.pecuarios.club/mailchimp/';

/**
 * Convierte un registro del endpoint de Mailchimp en el modelo interno
 * `Campania` que consume el resto del módulo.
 *
 * @param mail - Respuesta cruda de `GET /mailchimp/...`.
 * @returns Registro `Campania` con la fecha y el enlace normalizados.
 */
export function toCampania(mail: CampaniaMail): Campania {
  return {
    id: mail.id,
    nombre: mail.nombre?.trim() ?? '',
    fecha: mail.fecha_publicacion ?? '',
    imagen: mail.imagen ? IMAGEN_BASE + mail.imagen : '',
    enlace: mail.url ?? '',
  };
}

/**
 * Selecciona las campañas que corresponden a un periodo y a una búsqueda.
 *
 * - El periodo acota por fecha de publicación, extremos incluidos. Un extremo
 *   vacío se interpreta como "sin límite" en ese lado.
 * - La búsqueda compara contra el nombre, ignorando mayúsculas, tildes y
 *   espacios sobrantes; una consulta vacía no filtra.
 * - El resultado siempre viene ordenado de más reciente a más antigua, que es
 *   el orden en el que el analista revisa las publicaciones.
 *
 * Es tolerante ante conjuntos que no son arreglos (`null`, `undefined`)
 * devolviendo una lista vacía, para no quebrar la vista ante datos
 * inesperados.
 *
 * @param campanas - Conjunto de campañas de origen.
 * @param rango    - Periodo aplicado; ambos extremos son `YYYY-MM-DD`.
 * @param busqueda - Texto de búsqueda por nombre.
 * @returns Campañas filtradas, ordenadas y listas para el template.
 */
export function selectCampanias(
  campanas: Campania[] | null | undefined,
  rango: RangoFechas,
  busqueda = '',
): CampaniaItem[] {
  if (!Array.isArray(campanas)) return [];

  const desde = aIso(rango?.fecha_inicio ?? '');
  const hasta = aIso(rango?.fecha_fin ?? '');
  const termino = normalizar(busqueda);

  return campanas
    .filter((campania) => {
      const iso = aIso(campania?.fecha);
      if (desde && iso < desde) return false;
      if (hasta && iso > hasta) return false;
      if (termino && !normalizar(campania?.nombre).includes(termino)) return false;
      return true;
    })
    .sort((a, b) => aIso(b?.fecha).localeCompare(aIso(a?.fecha)))
    .map(toCampaniaItem);
}
