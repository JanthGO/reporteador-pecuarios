import {
  AgeBucket,
  PerfilVisitante,
  info,
  rangosEdad,
} from '../../core/interfaces/dashboard/PerfilVisitante';
import { Contenidos, Secciones, Visitas, elemento } from '../../core/interfaces/dashboard/visitas';

/**
 * Mapper de la vista de productos.
 *
 * Toda la selección de datos de la página vive aquí como funciones puras: el
 * endpoint entrega el periodo completo y esta capa decide qué se muestra, en
 * qué orden y con qué escala. Al no tocar el modelo de datos, el mapper no
 * duplica interfaces y cada regla se prueba de forma aislada.
 */

/** Criterios de ordenamiento del listado. Todos se derivan de campos reales. */
export type OrdenProductos = 'visitas-desc' | 'visitas-asc' | 'nombre-asc';

export interface OpcionOrden {
  key: OrdenProductos;
  label: string;
}

/**
 * Opciones del control de ordenamiento.
 *
 * El endpoint no expone fecha de publicación por producto, así que no existe un
 * criterio "más recientes": solo se ofrecen los que los datos sostienen.
 */
export const ORDENES: readonly OpcionOrden[] = [
  { key: 'visitas-desc', label: 'Más visitados' },
  { key: 'visitas-asc', label: 'Menos visitados' },
  { key: 'nombre-asc', label: 'Nombre A–Z' },
];

/** Producto tal como lo consume una fila del listado. */
export interface ProductoItem {
  id: number;
  nombre: string;
  imagen: string;
  visitas: number;
  activo: boolean;
  /** Posición dentro del listado visible (base 1). */
  posicion: number;
  /** Visitas del producto sobre el máximo visible, en porcentaje (0–100). */
  proporcion: number;
}

/** Una categoría del perfil con su cuota real y su escala dentro del grupo. */
export interface ItemPerfil {
  label: string;
  /** Porcentaje real informado por el endpoint (0–100). */
  pct: number;
  /** `pct` relativo al máximo del grupo (0–100), que es lo que dibuja la barra. */
  escala: number;
}

export interface GrupoPerfil {
  clave: 'ocupacion' | 'edad' | 'pais';
  label: string;
  items: ItemPerfil[];
}

const NUMERO = new Intl.NumberFormat('es-MX');
const DIA = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' });

/**
 * Formatea un número con separadores de miles en español (p. ej. `1,742`).
 *
 * @param valor - Número a formatear.
 * @returns Cadena con separadores de miles.
 */
export function formatNumber(valor: number | null | undefined): string {
  return NUMERO.format(valor ?? 0);
}

/**
 * Formatea un porcentaje con dos decimales y sufijo `%`.
 *
 * @param valor - Porcentaje (0–100).
 * @returns Cadena formateada (p. ej. `48.72%`).
 */
export function formatPct(valor: number | null | undefined): string {
  return `${(valor ?? 0).toFixed(2)}%`;
}

/**
 * Reduce un texto a una forma comparable por nombre: sin mayúsculas, sin
 * tildes y sin espacios sobrantes.
 *
 * @param texto - Texto de entrada (nombre o consulta).
 * @returns Texto normalizado.
 */
export function normalizar(texto: string | null | undefined): string {
  return (texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();
}

/**
 * Acorta una fecha de la serie a día y mes en español (p. ej. `12 mar`).
 *
 * @param fecha - Fecha cruda del endpoint (`YYYY-MM-DD`).
 * @returns Etiqueta corta, o la fecha tal cual si no es un ISO reconocible.
 */
export function formatDia(fecha: string | null | undefined): string {
  const iso = (fecha ?? '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return fecha ?? '';

  const [anio, mes, dia] = iso.split('-').map(Number);
  return DIA.format(new Date(anio, mes - 1, dia));
}

/**
 * Formatea un periodo para la línea de resultados.
 *
 * @param rango - Periodo aplicado, con ambos extremos en `YYYY-MM-DD`.
 * @returns Rango legible (`dd/mm/aaaa – dd/mm/aaaa`) o cadena vacía.
 */
export function formatRango(rango: { fecha_inicio: string; fecha_fin: string } | null): string {
  if (!rango?.fecha_inicio || !rango?.fecha_fin) return '';
  return `${rango.fecha_inicio.split('-').reverse().join('/')} – ${rango.fecha_fin
    .split('-')
    .reverse()
    .join('/')}`;
}

const COMPARADORES: Record<OrdenProductos, (a: elemento, b: elemento) => number> = {
  'visitas-desc': (a, b) =>
    (b.visitas ?? 0) - (a.visitas ?? 0) || (a.nombre ?? '').localeCompare(b.nombre ?? '', 'es'),
  'visitas-asc': (a, b) =>
    (a.visitas ?? 0) - (b.visitas ?? 0) || (a.nombre ?? '').localeCompare(b.nombre ?? '', 'es'),
  'nombre-asc': (a, b) =>
    (a.nombre ?? '').localeCompare(b.nombre ?? '', 'es', { sensitivity: 'base' }),
};

/**
 * Selecciona el listado de productos del periodo.
 *
 * Aplica los tres controles de la vista en un solo paso: el filtro de estado
 * activo (`estatus === 1` es la regla de negocio del proyecto), la búsqueda por
 * nombre —tolerante a mayúsculas y tildes— y el criterio de ordenamiento. La
 * posición y la proporción de cada fila se calculan sobre el conjunto ya
 * filtrado, de modo que el número de ranking y la barra de siempre midan lo
 * mismo que el analista está viendo.
 *
 * @param contenidos - Contenidos de productos devueltos por el endpoint.
 * @param busqueda - Texto de búsqueda por nombre.
 * @param orden - Criterio de ordenamiento.
 * @param soloActivos - Cuando es `true`, descarta los productos no activos.
 * @returns Productos listos para el template, con su posición y su escala.
 */
export function selectProductos(
  contenidos: Contenidos | null | undefined,
  busqueda = '',
  orden: OrdenProductos = 'visitas-desc',
  soloActivos = true,
): ProductoItem[] {
  const fuente = Array.isArray(contenidos?.data) ? contenidos.data : [];
  const termino = normalizar(busqueda);

  const filtrados = fuente.filter((item) => {
    if (soloActivos && item?.estatus !== 1) return false;
    if (termino && !normalizar(item?.nombre).includes(termino)) return false;
    return true;
  });

  const ordenados = [...filtrados].sort(COMPARADORES[orden] ?? COMPARADORES['visitas-desc']);
  const maxVisitas = ordenados.reduce((max, item) => Math.max(max, item?.visitas ?? 0), 0);

  return ordenados.map((item, index) => ({
    id: item?.id ?? index,
    nombre: item?.nombre?.trim() ?? '',
    imagen: item?.imagen ?? '',
    visitas: item?.visitas ?? 0,
    activo: item?.estatus === 1,
    posicion: index + 1,
    proporcion: maxVisitas > 0 ? ((item?.visitas ?? 0) / maxVisitas) * 100 : 0,
  }));
}

/**
 * Elige el producto con más visitas del periodo.
 *
 * El endpoint publica un top en `contenidos.popular`, pero ese top puede venir
 * vacío; en ese caso se recurre al listado completo. El titular no sigue los
 * controles del listado: describe el periodo, no la vista.
 *
 * @param contenidos - Contenidos de productos devueltos por el endpoint.
 * @returns El producto más visitado, o `null` si no hay productos.
 */
export function selectTopProducto(contenidos: Contenidos | null | undefined): elemento | null {
  const candidatos = [
    ...(Array.isArray(contenidos?.popular) ? contenidos.popular : []),
    ...(Array.isArray(contenidos?.data) ? contenidos.data : []),
  ].filter((item): item is elemento => !!item);

  if (!candidatos.length) return null;

  return candidatos.reduce((mejor, actual) =>
    (actual.visitas ?? 0) > (mejor.visitas ?? 0) ? actual : mejor,
  );
}

/**
 * Cuenta los productos que recibieron al menos una visita en el periodo.
 *
 * @param contenidos - Contenidos de productos devueltos por el endpoint.
 * @returns Número de productos con visitas mayores que cero.
 */
export function cuentaConVisitas(contenidos: Contenidos | null | undefined): number {
  if (!Array.isArray(contenidos?.data)) return 0;
  return contenidos.data.filter((item) => (item?.visitas ?? 0) > 0).length;
}

/**
 * Localiza el día con más visitas de la serie.
 *
 * @param serie - Serie temporal devuelta por el endpoint.
 * @returns El punto máximo, o `null` si la serie está vacía.
 */
export function selectPico(serie: Visitas[] | null | undefined): Visitas | null {
  if (!Array.isArray(serie) || !serie.length) return null;

  return serie.reduce((pico, punto) =>
    (punto?.visitas ?? 0) > (pico?.visitas ?? 0) ? punto : pico,
  );
}

/** Convierte una lista de porcentajes en items con su escala dentro del grupo. */
function aItems(items: { label: string; pct: number }[]): ItemPerfil[] {
  const max = items.reduce((top, item) => Math.max(top, item.pct), 0);
  return items.map((item) => ({
    ...item,
    escala: max > 0 ? (item.pct / max) * 100 : 0,
  }));
}

/** Lleva la lista plana de ocupaciones o países al modelo de barras. */
function aItemsInfo(grupos: info[] | null | undefined, limite: number): ItemPerfil[] {
  const lista = Array.isArray(grupos) ? grupos.slice(0, limite) : [];
  return aItems(lista.map((item) => ({ label: item?.nombre ?? '', pct: item?.promedio ?? 0 })));
}

/** Lleva los rangos de edad agregados al modelo de barras. */
function aItemsEdad(grupos: AgeBucket[]): ItemPerfil[] {
  return aItems(grupos.map((item) => ({ label: item.label, pct: item.value })));
}

/**
 * Arma los tres grupos del perfil del visitante.
 *
 * Ocupación y país conservan el orden que entrega el backend (top-7 y top-7 con
 * "Otros"); la edad se agrega por género y se ordena de mayor a menor. Cada barra
 * se escala contra el máximo de su propio grupo para que la comparación entre
 * categorías sea inmediata, mientras el porcentaje real viaja siempre escrito al
 * lado de la etiqueta.
 *
 * @param perfil - Perfil demográfico de la division y el periodo consultados.
 * @returns Grupos listos para el template, con sus items ya escalados.
 */
export function selectPerfilGrupos(perfil: PerfilVisitante | null | undefined): GrupoPerfil[] {
  return [
    { clave: 'ocupacion', label: 'Ocupación', items: aItemsInfo(perfil?.ocupaciones, 7) },
    { clave: 'edad', label: 'Edad', items: aItemsEdad(rangosEdad(perfil)) },
    { clave: 'pais', label: 'País', items: aItemsInfo(perfil?.paises, 8) },
  ];
}

/**
 * Indica si el endpoint trajo algo que mostrar para el periodo.
 *
 * Sin esta comprobación, un rango sin actividad se confunde con un módulo vacío:
 * los skeletons se sustituyen por un estado vacío explícito.
 *
 * @param seccion - Datos de la sección de productos.
 * @returns `true` si hay visitas, productos o perfil demográfico.
 */
export function hayDatosPeriodo(seccion: Secciones | null | undefined): boolean {
  if (!seccion) return false;

  const totalVisitas = seccion.visitas?.total ?? 0;
  const totalProductos = seccion.contenidos?.total ?? 0;
  const serie = Array.isArray(seccion.visitas?.data) ? seccion.visitas.data.length : 0;
  const perfil = seccion.perfilVisita;
  const categorias = (perfil?.ocupaciones?.length ?? 0) + (perfil?.paises?.length ?? 0);

  return totalVisitas > 0 || totalProductos > 0 || serie > 0 || categorias > 0;
}
