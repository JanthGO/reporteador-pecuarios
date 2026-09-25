import {
  ActivityItem,
  ActivityPlatform,
  UltimasVisitas,
} from '../../core/interfaces/dashboard/ActividadReciente';

/**
 * Mapper de actividad reciente.
 *
 * Transforma los DTO crudos que entrega el endpoint `last-visits`
 * (`UltimasVisitas`) en el modelo de vista que consume
 * `<app-recent-activity>` (`ActivityItem`). Vive aislado del componente
 * y del servicio para poder probarse de forma independiente.
 */

/** Secciones conocidas de la marca: clave del badge -> nombre visible. */
const SECCIONES: Record<string, string> = {
  productos: 'Productos',
  articulos: 'Artículos',
  micrositio: 'Micrositio',
  noticias: 'Noticias',
  eventos: 'Eventos',
  vacante: 'Vacantes',
  videos: 'Video',
};

/** Normaliza un texto para comparaciones tolerantes (minúsculas, sin tildes). */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();
}

/**
 * Resuelve el nombre visible y la clase de badge a partir del valor de
 * `seccion` del backend. Acepta tanto la clave interna (`'productos'`)
 * como el nombre visible (`'Productos'`), con variantes en minúsculas
 * o con acentos.
 *
 * @param value - Valor de `seccion` tal como lo devuelve el endpoint.
 * @returns Nombre visible y clase de badge; si no coincide, usos genéricos.
 */
function resolveSeccion(value: string | undefined): { nombre: string; clase: string } {
  const key = normalize(value ?? '');
  const entries = Object.entries(SECCIONES) as [string, string][];

  const byKey = entries.find(([k]) => normalize(k) === key)?.[0];
  const byName = entries.find(([, nombre]) => normalize(nombre) === key)?.[0];
  const match = byKey ?? byName;
  return match
    ? { nombre: SECCIONES[match], clase: `activity-badge--${match}` }
    : { nombre: value?.trim() || 'General', clase: 'activity-badge--general' };
}

/** Convierte un texto de fecha/hora a `Date` si es parseable, o `null`. */
function parseFecha(value: string): Date | null {
  const dateTime = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/.exec(value);
  if (dateTime) {
    const [, y, m, d, hh, mm, ss] = dateTime;
    const date = new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), ss ? Number(ss) : 0);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (dateOnly) {
    const [, y, m, d] = dateOnly;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

const FECHA_FORMAT = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/**
 * Formatea una fecha del backend como `dd MMM aaaa · HH:mm` (es-MX).
 * Si la cadena no es una fecha válida, se devuelve tal cual para no
 * perder información.
 *
 * @param value - Fecha cruda del endpoint (`UltimasVisitas.fecha`).
 * @returns Fecha formateada para mostrar en la tabla.
 */
export function formatFechaActividad(value: string): string {
  const date = parseFecha(value);
  if (!date) return value;
  return FECHA_FORMAT.format(date).replace(', ', ' · ');
}

/**
 * Normaliza la plataforma del backend al tipo de vista.
 * Cualquier valor que no contenga 'web' se interpreta como móvil.
 *
 * @param value - Plataforma cruda (p. ej. `'Web'`, `'web'`, `'Móvil'`).
 * @returns Plataforma normalizada del tipo `ActivityPlatform`.
 */
export function normalizePlataforma(value: string): ActivityPlatform {
  return value.toLowerCase().includes('web') ? 'Web' : 'Móvil';
}

/**
 * Convierte un arreglo de `UltimasVisitas` (DTO del endpoint) en el
 * modelo de vista `ActivityItem` que renderiza la tabla.
 *
 * Es tolerante a respuestas con forma inesperada (no array), devolviendo
 * un arreglo vacío, para no quebrar la vista ante cambios del backend.
 *
 * @param items - Filas crudas de `last-visits`.
 * @returns Items listos para el componente, en el mismo orden.
 */
export function mapUltimasVisitasToActivity(items: UltimasVisitas[]): ActivityItem[] {
  if (!Array.isArray(items)) return [];

  return items.map((item) => {
    const { nombre, clase } = resolveSeccion(item.seccion);
    return {
      fechaHora: formatFechaActividad(item.fecha),
      seccion: nombre,
      seccionClass: clase,
      contenido: item.detalle?.trim() || '',
      plataforma: normalizePlataforma(item.plataforma),
    };
  });
}