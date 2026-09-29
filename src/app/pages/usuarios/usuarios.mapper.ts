import { Usuarios } from '../../core/interfaces/users/user';

/**
 * Mapper de la vista de usuarios registrados.
 *
 * El endpoint `GET users/{division}/{fecha_inicio}/{fecha_fin}` entrega el
 * periodo completo y sin paginar, así que aquí vive toda la lectura de esos
 * datos: normalización de los textos que llegan sucios del backend, la
 * distribución demográfica, los filtros del directorio, el orden y el recorte
 * de página. Ninguna función toca el modelo de la API ni el template, de modo
 * que cada regla se pueda probar de forma aislada.
 */

/** Etiqueta del grupo de usuarios que no declaran ocupación. */
export const SIN_OCUPACION = 'Sin ocupación';

/** Etiqueta del grupo de usuarios sin país informado. */
export const SIN_PAIS = 'Sin país';

/** Etiqueta del grupo de usuarios sin estado informado. */
export const SIN_ESTADO = 'Sin estado';

/** Etiqueta del tramo de edad que no se puede calcular. */
export const SIN_EDAD = 'Sin edad registrada';

/** Etiqueta que agrupa la cola larga de países. */
export const OTROS = 'Otros';

/** Cuántos países se listan antes de agrupar la cola en "Otros". */
export const TOP_PAISES = 7;

/** Campos por los que el listado admite ordenamiento. */
export type CampoOrden = 'nombre' | 'pais' | 'estado' | 'ocupacion' | 'fecha';

/** Sentido del ordenamiento. */
export type Direccion = 'asc' | 'desc';

/** Criterio de ordenamiento completo: campo y sentido. */
export interface OrdenUsuario {
  campo: CampoOrden;
  direccion: Direccion;
}

/** Orden inicial: los registros más recientes primero. */
export const ORDEN_INICIAL: OrdenUsuario = { campo: 'fecha', direccion: 'desc' };

/** Etiqueta de cada columna ordenable, en el orden en que se pintan. */
export const COLUMNAS: readonly { campo: CampoOrden; label: string }[] = [
  { campo: 'nombre', label: 'Usuario' },
  { campo: 'pais', label: 'País' },
  { campo: 'estado', label: 'Estado' },
  { campo: 'ocupacion', label: 'Ocupación' },
  { campo: 'fecha', label: 'Registro' },
];

/** Filtros del directorio. La cadena vacía significa "todos". */
export interface FiltrosDirectorio {
  pais: string;
  estado: string;
  ocupacion: string;
}

/** Directorio sin ningún filtro aplicado. */
export const FILTROS_VACIOS: FiltrosDirectorio = { pais: '', estado: '', ocupacion: '' };

/** Indica si hay algún filtro del directorio activo. */
export function hayFiltros(filtros: FiltrosDirectorio): boolean {
  return !!filtros.pais || !!filtros.estado || !!filtros.ocupacion;
}

/** Usuario normalizado, tal como lo consume una fila del listado. */
export interface UsuarioItem {
  /** Índice estable dentro de la carga; sirve de clave de render. */
  clave: number;
  nombre: string;
  iniciales: string;
  pais: string;
  estado: string;
  ocupacion: string;
  /** Ocupación ya resuelta a un texto presentable, incluida la vacía. */
  ocupacionLabel: string;
  /** Fecha de registro en `dd/mm/aaaa`. */
  fechaLabel: string;
  /** Fecha de registro en `YYYY-MM-DD`, comparable y ordenable. */
  fechaIso: string;
  /** Edad cumplida a la fecha de referencia, o `null` si no se puede calcular. */
  edad: number | null;
  /** Texto normalizado que alimenta la búsqueda. */
  claveBusqueda: string;
}

/** Una categoría de la distribución demográfica con su cuota y su escala. */
export interface CategoriaPerfil {
  label: string;
  conteo: number;
  /** Porcentaje sobre el total de la base (0–100). */
  pct: number;
  /** `pct` relativo al máximo de su grupo (0–100); es lo que dibuja la barra. */
  escala: number;
}

/** Una dimensión de la composición de la base de usuarios. */
export interface GrupoPerfil {
  clave: 'pais' | 'edad' | 'ocupacion';
  label: string;
  total: number;
  items: CategoriaPerfil[];
}

/** Opción de un desplegable de filtro, con su peso en la base. */
export interface OpcionFiltro {
  valor: string;
  label: string;
  conteo: number;
}

/** Periodo consultado, tal como lo emite el selector de fechas. */
export interface RangoFechas {
  fecha_inicio: string;
  fecha_fin: string;
}

/** Intensidad de una celda del mapa: 0 es un día sin altas, 4 el más lleno. */
export type NivelAlta = 0 | 1 | 2 | 3 | 4;

/** Una celda del mapa: un día del eje y cuántas altas acumuló. */
export interface DiaAltas {
  /** Fecha en `YYYY-MM-DD`, comparable y ordenable. */
  iso: string;
  conteo: number;
  nivel: NivelAlta;
  /** `false` en el relleno que completa la semana de un borde del periodo. */
  enPeriodo: boolean;
  /** El día con más altas del periodo. */
  esPico: boolean;
}

/** Rótulo de un mes en el eje horizontal del mapa. */
export interface RotuloMes {
  /** Columna del mapa, base 0, donde arranca el rótulo. */
  columna: number;
  texto: string;
}

/** Lectura del ritmo de altas de un periodo, lista para pintarse. */
export interface MapaAltas {
  /** Celdas en orden cronológico, con el relleno de los bordes ya resuelto. */
  dias: DiaAltas[];
  /** Rótulos del eje de meses, alineados con las columnas de `dias`. */
  meses: RotuloMes[];
  /** Días que abarca el periodo, incluidos los que no recibieron altas. */
  diasPeriodo: number;
  /**
   * Días que se pintan, que son los del periodo mientras no se recorte.
   *
   * Es el denominador de todo lo que describe el mapa: los días con altas, la
   * media del recorte y el tono de las casillas. Mezclarlo con `diasPeriodo`
   * daría cifras de dos ventanas distintas en la misma tarjeta.
   */
  diasMapa: number;
  /** Altas que caen dentro del periodo completo. */
  total: number;
  /** Altas del día más lleno **de lo que se pinta**. */
  max: number;
  /** Altas medias de cada día del periodo. */
  media: number;
  /** Días pintados con al menos un alta. */
  diasConAltas: number;
  /** El día con más altas, o `null` si el periodo no tuvo ninguna. */
  pico: DiaAltas | null;
  /** Altas de los últimos siete días del periodo. */
  ultimosSiete: number;
  /** Altas de los siete días anteriores a esa ventana. */
  sieteAnteriores: number;
  /** Variación porcentual entre ambas ventanas; `null` si la anterior fue cero. */
  variacion: number | null;
  /** `true` cuando el periodo es más largo que `TOPE_DIAS` y solo se pintó su final. */
  recortado: boolean;
}

const NUMERO = new Intl.NumberFormat('es-MX');

/** Abreviaturas de mes, fijas en el código para que el eje no cambie con el locale. */
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** Cuántos días cubre cada ventana de la comparación de ritmo reciente. */
export const VENTANA_RITMO = 7;

/**
 * Tope de celdas que se pintan en el mapa.
 *
 * Dos años es un techo cómodo de leer de un vistazo; un rango más largo se
 * recorta por su final —los días más recientes son los que explican el
 * ritmo actual— y `recortado` avisa de ello para que la interfaz no prometa
 * más de lo que enseña.
 */
export const TOPE_DIAS = 730;

/** Cuotas sobre el día más lleno que separan un nivel de intensidad del siguiente. */
export const UMBRALES_ALTAS: readonly number[] = [0.2, 0.45, 0.7];

/** Mapa sin datos, para los periodos que aún no se han consultado. */
const MAPA_VACIO: MapaAltas = {
  dias: [],
  meses: [],
  diasPeriodo: 0,
  diasMapa: 0,
  total: 0,
  max: 0,
  media: 0,
  diasConAltas: 0,
  pico: null,
  ultimosSiete: 0,
  sieteAnteriores: 0,
  variacion: null,
  recortado: false,
};

/** Rangos de edad en orden cronológico, con los mismos rótulos del perfil del visitante. */
const TRAMOS_EDAD: readonly string[] = [
  'Menos de 20 años',
  '20–30 años',
  '30–40 años',
  '40–50 años',
  '50–60 años',
  'Más de 60 años',
];

/**
 * Formatea un número con separadores de miles en español (p. ej. `5,537`).
 *
 * @param valor - Número a formatear.
 * @returns Cadena con separadores de miles.
 */
export function formatNumber(valor: number | null | undefined): string {
  return NUMERO.format(valor ?? 0);
}

/**
 * Formatea un porcentaje con un decimal y sufijo `%`.
 *
 * Un decimal basta para leer la cuota de una categoría sin convertir el número
 * en ruido: el conteo entero ya viaja junto a la etiqueta.
 *
 * @param valor - Porcentaje (0–100).
 * @returns Cadena formateada (p. ej. `81.9%`).
 */
export function formatPct(valor: number | null | undefined): string {
  return `${(valor ?? 0).toFixed(1)}%`;
}

/**
 * Formatea una variación de ritmo con su signo y un decimal.
 *
 * El signo va delante porque la cifra se lee de un vistazo y es lo que
 * distingue una mejora de una caída; un porcentaje sin signo no dice nada.
 *
 * @param valor - Variación en porcentaje.
 * @returns Cadena con signo (`+12.4%`, `−3.1%`).
 */
export function formatVariacion(valor: number | null | undefined): string {
  const magnitud = formatPct(Math.abs(valor ?? 0));
  if ((valor ?? 0) > 0) return `+${magnitud}`;
  if ((valor ?? 0) < 0) return `−${magnitud}`;
  return magnitud;
}

/**
 * Formatea un periodo para la línea de resultados.
 *
 * @param rango - Periodo aplicado, con ambos extremos en `YYYY-MM-DD`.
 * @returns Rango legible (`dd/mm/aaaa – dd/mm/aaaa`) o cadena vacía.
 */
export function formatRango(rango: RangoFechas | null): string {
  if (!rango?.fecha_inicio || !rango?.fecha_fin) return '';
  return `${rango.fecha_inicio.split('-').reverse().join('/')} – ${rango.fecha_fin
    .split('-')
    .reverse()
    .join('/')}`;
}

/**
 * Colapsa los espacios que el backend deja en los nombres y descarta los sobrantes.
 *
 * @param texto - Texto de origen.
 * @returns Texto con espacios simples y sin bordes.
 */
function limpiar(texto: string | null | undefined): string {
  return (texto ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * Reduce un texto a una forma comparable por nombre: sin mayúsculas, sin tildes
 * y sin espacios sobrantes.
 *
 * @param texto - Texto de entrada.
 * @returns Texto normalizado.
 */
function normalizar(texto: string | null | undefined): string {
  return limpiar(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

/**
 * Convierte la fecha de registro del backend a ISO `YYYY-MM-DD`.
 *
 * El endpoint la publica como `dd/MM/aaaa`; se acepta también el ISO por si
 * cambia el formato. Un valor irreconocible produce cadena vacía, que el resto
 * de funciones tratan como "sin fecha" en lugar de romper.
 *
 * @param fecha - Fecha cruda del endpoint.
 * @returns Fecha ISO, o cadena vacía.
 */
export function aIso(fecha: string | null | undefined): string {
  const bruto = limpiar(fecha);
  if (/^\d{4}-\d{2}-\d{2}$/.test(bruto)) return bruto;

  const partes = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(bruto);
  if (!partes) return '';

  const [, dia, mes, anio] = partes;
  return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
}

/**
 * Invierte una fecha ISO al formato en que la muestra el sistema anterior.
 *
 * @param iso - Fecha en `YYYY-MM-DD`.
 * @returns Fecha en `dd/mm/aaaa`, o cadena vacía.
 */
function aFechaLabel(iso: string): string {
  if (!iso) return '';
  const [anio, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${anio}`;
}

/**
 * Calcula la edad cumplida a una fecha de referencia.
 *
 * La edad se mide contra el día de hoy, no contra la fecha de registro: describe
 * a la persona que integra la base, que es lo que el analista necesita saber.
 *
 * @param fnacimiento - Fecha de nacimiento en `YYYY-MM-DD`.
 * @param referencia - Día contra el que se cuenta.
 * @returns Edad en años cumplidos, o `null` si la fecha no es utilizable.
 */
export function calcularEdad(fnacimiento: string | null | undefined, referencia: Date): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(limpiar(fnacimiento))) return null;

  const [anio, mes, dia] = limpiar(fnacimiento).split('-').map(Number);
  const nacimiento = new Date(anio, mes - 1, dia);
  if (Number.isNaN(nacimiento.getTime())) return null;

  let edad = referencia.getFullYear() - anio;
  const yaCumpio =
    referencia.getMonth() > mes - 1 || (referencia.getMonth() === mes - 1 && referencia.getDate() >= dia);
  if (!yaCumpio) edad--;

  return edad >= 0 && edad < 130 ? edad : null;
}

/**
 * Devuelve el tramo de edad al que pertenece una edad concreta.
 *
 * @param edad - Edad en años.
 * @returns Etiqueta del tramo.
 */
export function tramoEdad(edad: number): string {
  if (edad < 20) return TRAMOS_EDAD[0];
  if (edad < 30) return TRAMOS_EDAD[1];
  if (edad < 40) return TRAMOS_EDAD[2];
  if (edad < 50) return TRAMOS_EDAD[3];
  if (edad < 60) return TRAMOS_EDAD[4];
  return TRAMOS_EDAD[5];
}

/**
 * Construye las iniciales que identifican a la persona en el listado.
 *
 * @param nombre - Nombre completo ya limpio.
 * @returns Até dos iniciales en mayúscula, o un punto si no hay nombre.
 */
function iniciales(nombre: string): string {
  const palabras = nombre.split(' ').filter(Boolean);
  if (!palabras.length) return '·';
  return palabras
    .slice(0, 2)
    .map((palabra) => palabra.charAt(0).toLocaleUpperCase('es'))
    .join('');
}

/**
 * Normaliza la respuesta cruda del endpoint al modelo de vista del listado.
 *
 * El backend llega con espacios dobles dentro de los nombres y con `ocupacion`
 * en `null` para una cuarta parte de la base: aquí se resuelve ese texto sucio
 * una sola vez, y de paso se calculan la edad y la clave de búsqueda para que el
 * filtrado no vuelva a normalizar en cada pulsación.
 *
 * @param crudos - Registros tal como los devuelve `GET users/...`.
 * @param referencia - Día contra el que se mide la edad.
 * @returns Usuarios listos para el template.
 */
export function toUsuarios(crudos: Usuarios[] | null | undefined, referencia: Date): UsuarioItem[] {
  if (!Array.isArray(crudos)) return [];

  return crudos.map((crudo, indice) => {
    const nombre = limpiar(crudo?.nombre);
    const pais = limpiar(crudo?.pais) || SIN_PAIS;
    const estado = limpiar(crudo?.estado) || SIN_ESTADO;
    const ocupacion = limpiar(crudo?.ocupacion);
    const ocupacionLabel = ocupacion || SIN_OCUPACION;
    const fechaIso = aIso(crudo?.fecha_reg);
    const edad = calcularEdad(crudo?.fnacimiento, referencia);

    return {
      clave: indice,
      nombre,
      iniciales: iniciales(nombre),
      pais,
      estado,
      ocupacion,
      ocupacionLabel,
      fechaLabel: aFechaLabel(fechaIso),
      fechaIso,
      edad,
      claveBusqueda: normalizar([nombre, pais, estado, ocupacionLabel].join(' ')),
    };
  });
}

/**
 * Calcula el porcentaje y la escala de cada categoría dentro de su grupo.
 *
 * El porcentaje es la cuota real sobre la base —lo que el analista necesita
 * leer— y la escala es esa misma cuota contra el máximo del grupo, que es lo que
 * hace comparables las barras entre sí.
 *
 * @param conteos - Categorías con su número de usuarios.
 * @param total - Total de usuarios de la base.
 * @returns Categorías con `pct` y `escala` calculadas.
 */
function aCategorias(conteos: { label: string; conteo: number }[], total: number): CategoriaPerfil[] {
  const max = conteos.reduce((top, item) => Math.max(top, item.conteo), 0);

  return conteos.map((item) => ({
    label: item.label,
    conteo: item.conteo,
    pct: total > 0 ? (item.conteo / total) * 100 : 0,
    escala: max > 0 ? (item.conteo / max) * 100 : 0,
  }));
}

/**
 * Cuenta cuántos usuarios hay por valor de un campo de texto.
 *
 * @param usuarios - Base ya normalizada.
 * @param campo - Campo a agrupar.
 * @returns Mapa valor → número de usuarios.
 */
function contarPor(usuarios: readonly UsuarioItem[], campo: 'pais' | 'estado' | 'ocupacionLabel'): Map<string, number> {
  const mapa = new Map<string, number>();
  for (const usuario of usuarios) {
    mapa.set(usuario[campo], (mapa.get(usuario[campo]) ?? 0) + 1);
  }
  return mapa;
}

/**
 * Distribución de la base por país, con la cola larga agrupada en "Otros".
 *
 * La base es muy desigual: México concentra la mayoría y el resto de países
 * tienen pesos de uno o dos dígitos. Enseñar los siete primeros y sumar el
 * resto en una sola fila mantiene la comparación útil sin alargar el panel con
 * treinta y tres filas de un usuario cada una.
 *
 * @param usuarios - Base ya normalizada.
 * @param limite - Cuántos países se listan antes de agrupar.
 * @returns Categorías ordenadas de mayor a menor.
 */
export function distribucionPais(usuarios: readonly UsuarioItem[], limite: number = TOP_PAISES): CategoriaPerfil[] {
  if (!usuarios.length) return [];

  const conteos = [...contarPor(usuarios, 'pais').entries()]
    .map(([label, conteo]) => ({ label, conteo }))
    .sort((a, b) => b.conteo - a.conteo || a.label.localeCompare(b.label, 'es'));

  const cabeza = conteos.slice(0, limite);
  const cola = conteos.slice(limite);
  if (cola.length) {
    cabeza.push({ label: OTROS, conteo: cola.reduce((suma, item) => suma + item.conteo, 0) });
  }

  return aCategorias(cabeza, usuarios.length);
}

/**
 * Distribución de la base por tramo de edad, en orden cronológico.
 *
 * A diferencia del país o la ocupación, aquí el orden lo fija el rango y no la
 * cantidad: ordenar las edades por frecuencia convierte la lectura en una lista
 * sin sentido, porque el intervalo que más gente tiene no dice nada del
 * cambie de edad de la base.
 *
 * @param usuarios - Base ya normalizada.
 * @returns Categorías en orden de edad creciente.
 */
export function distribucionEdad(usuarios: readonly UsuarioItem[]): CategoriaPerfil[] {
  if (!usuarios.length) return [];

  const conteos = new Map<string, number>(TRAMOS_EDAD.map((tramo) => [tramo, 0]));
  let sinEdad = 0;

  for (const usuario of usuarios) {
    if (usuario.edad === null) {
      sinEdad++;
      continue;
    }
    const tramo = tramoEdad(usuario.edad);
    conteos.set(tramo, (conteos.get(tramo) ?? 0) + 1);
  }

  const categorias = aCategorias(
    [...conteos].map(([label, conteo]) => ({ label, conteo })),
    usuarios.length,
  );

  if (sinEdad > 0) {
    categorias.push({
      label: SIN_EDAD,
      conteo: sinEdad,
      pct: (sinEdad / usuarios.length) * 100,
      escala: 0,
    });
  }

  return categorias;
}

/**
 * Distribución de la base por ocupación.
 *
 * No lleva "Otros" a propósito: el endpoint devuelve un puñado de categorías
 * reales, y la única que falta de forma masiva es la de quien no declara
 * ocupación, que se muestra con su propio nombre en vez de diluirse en un
 * agregado.
 *
 * @param usuarios - Base ya normalizada.
 * @returns Categorías ordenadas de mayor a menor.
 */
export function distribucionOcupacion(usuarios: readonly UsuarioItem[]): CategoriaPerfil[] {
  if (!usuarios.length) return [];

  const conteos = [...contarPor(usuarios, 'ocupacionLabel').entries()]
    .map(([label, conteo]) => ({ label, conteo }))
    .sort((a, b) => b.conteo - a.conteo || a.label.localeCompare(b.label, 'es'));

  return aCategorias(conteos, usuarios.length);
}

/**
 * Arma las tres dimensiones de la composición de la base en un solo pase.
 *
 * @param usuarios - Base ya normalizada.
 * @returns Los tres grupos, listos para el template.
 */
export function gruposPerfil(usuarios: readonly UsuarioItem[]): GrupoPerfil[] {
  return [
    { clave: 'pais', label: 'País', total: usuarios.length, items: distribucionPais(usuarios) },
    { clave: 'edad', label: 'Edad', total: usuarios.length, items: distribucionEdad(usuarios) },
    {
      clave: 'ocupacion',
      label: 'Ocupación',
      total: usuarios.length,
      items: distribucionOcupacion(usuarios),
    },
  ];
}

/**
 * Categoría con más usuarios de un grupo; es la que sostiene la cifra destacada
 * de la banda de resumen.
 *
 * @param categorias - Categorías del grupo.
 * @returns La categoría mayor, o `null` si el grupo está vacío.
 */
export function categoriaPrincipal(categorias: CategoriaPerfil[]): CategoriaPerfil | null {
  if (!categorias.length) return null;
  return categorias.reduce((top, item) => (item.conteo > top.conteo ? item : top));
}

/**
 * Suma días a una fecha ISO.
 *
 * Todo el cálculo del mapa trabaja en UTC: restar y sumar días en la zona local
 * movería las casillas del contorno del periodo en las horas de cambio de hora
 * de verano, que es justo donde un día se cuela en el vecino.
 *
 * @param iso - Fecha en `YYYY-MM-DD`.
 * @param dias - Días a sumar; admite negativos.
 * @returns Fecha desplazada en `YYYY-MM-DD`.
 */
function sumarDias(iso: string, dias: number): string {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia + dias)).toISOString().slice(0, 10);
}

/**
 * Día de la semana de una fecha ISO, con la semana empezando en lunes.
 *
 * @param iso - Fecha en `YYYY-MM-DD`.
 * @returns Posición de 0 (lunes) a 6 (domingo).
 */
function diaDeSemana(iso: string): number {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return (new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay() + 6) % 7;
}

/**
 * Cuenta los días de un periodo, extremos incluidos.
 *
 * @param desde - Fecha inicial en `YYYY-MM-DD`.
 * @param hasta - Fecha final en `YYYY-MM-DD`.
 * @returns Número de días, o `0` si las fechas no son utilizables.
 */
function diasEntre(desde: string, hasta: string): number {
  const inicio = Date.parse(`${desde}T00:00:00Z`);
  const fin = Date.parse(`${hasta}T00:00:00Z`);
  if (Number.isNaN(inicio) || Number.isNaN(fin) || fin < inicio) return 0;
  return Math.round((fin - inicio) / 86_400_000) + 1;
}

/**
 * Intensidad de una celda, medida contra el día más lleno del periodo.
 *
 * La escala es relativa a propósito: con un tope absoluto, un periodo de tres
 * días y otro de tres años se leerían con el mismo tono y no se podrían
 * comparar. Contra el máximo del propio periodo, el tono dice siempre "cuánto
 * fue eso comparado con lo mejor que hubo aquí".
 *
 * @param conteo - Altas del día.
 * @param max - Altas del día más lleno del periodo.
 * @returns Nivel de 0 a 4.
 */
function nivelDe(conteo: number, max: number): NivelAlta {
  if (conteo <= 0 || max <= 0) return 0;
  const cuota = conteo / max;
  if (cuota <= UMBRALES_ALTAS[0]) return 1;
  if (cuota <= UMBRALES_ALTAS[1]) return 2;
  if (cuota <= UMBRALES_ALTAS[2]) return 3;
  return 4;
}

/**
 * Suma las altas de un intervalo cerrado de fechas.
 *
 * @param conteos - Mapa fecha → altas.
 * @param desde - Primer día incluido.
 * @param hasta - Último día incluido.
 * @returns Total de altas del intervalo.
 */
function sumaEntre(conteos: Map<string, number>, desde: string, hasta: string): number {
  let suma = 0;
  for (const [iso, conteo] of conteos) {
    if (iso >= desde && iso <= hasta) suma += conteo;
  }
  return suma;
}

/**
 * Rótulos del eje de meses, alineados con las columnas del mapa.
 *
 * Cada mes se rotula en la columna del primer día con altas del periodo, de
 * forma que la etiqueta cae donde empieza el mes y no en una semana arbitraria
 * del eje. Entre dos rótulos siempre median varias columnas —los meses duran
 * 28 días o más—, así que las etiquetas largas nunca se solapan.
 *
 * @param dias - Celdas del mapa, en orden cronológico.
 * @returns Rótulos con su columna, listo para pintar.
 */
export function rotulosDeMeses(dias: readonly DiaAltas[]): RotuloMes[] {
  const rotulos: RotuloMes[] = [];
  let mesPrevio = '';

  dias.forEach((dia, indice) => {
    if (!dia.enPeriodo) return;

    const mes = dia.iso.slice(0, 7);
    if (mes === mesPrevio) return;

    rotulos.push({
      columna: Math.floor(indice / 7),
      texto: `${MESES_CORTOS[Number(dia.iso.slice(5, 7)) - 1]} ${dia.iso.slice(2, 4)}`,
    });
    mesPrevio = mes;
  });

  return rotulos;
}

/**
 * Escribe un día con la fecha larga que usa el sistema (`12 mar 2026`).
 *
 * @param iso - Fecha en `YYYY-MM-DD`.
 * @returns Fecha legible, o cadena vacía si no es utilizable.
 */
export function formatDia(iso: string): string {
  const [anio, mes, dia] = iso.split('-');
  if (!anio || !mes || !dia) return '';
  return `${dia} ${MESES_CORTOS[Number(mes) - 1]} ${anio}`;
}

/**
 * Reparte las altas del periodo sobre un eje de días y calcula su ritmo.
 *
 * El mapa de calor sustituye a la curva mensual porque responde a más
 * preguntas sin pedir interacción: de un vistazo dice si las altas se agrupan
 * en campañas sueltas o si la base crece de forma constante, y deja ver los
 * fines de semana flojos que una serie por meses promedia hasta borrarlos.
 * Cada día lleva además su propio número, así que el tono es una lectura rápida
 * y el detalle exacto siempre está disponible.
 *
 * El reparto se hace sobre los días del periodo, no sobre los que trae la base:
 * el endpoint acota por fecha, pero un registro con fecha ilegible no debe
 * inventar una casilla ni salir del total.
 *
 * @param usuarios - Base ya normalizada.
 * @param rango - Periodo consultado, con ambos extremos en `YYYY-MM-DD`.
 * @returns Celdas, rótulos de mes y las cifras de ritmo del periodo.
 */
export function mapaDeAltas(
  usuarios: readonly UsuarioItem[],
  rango: RangoFechas | null | undefined,
): MapaAltas {
  const inicio = rango?.fecha_inicio ?? '';
  const fin = rango?.fecha_fin ?? '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(inicio) || !/^\d{4}-\d{2}-\d{2}$/.test(fin) || inicio > fin) {
    return MAPA_VACIO;
  }

  const conteos = new Map<string, number>();
  for (const usuario of usuarios) {
    const iso = usuario.fechaIso;
    if (!iso || iso < inicio || iso > fin) continue;
    conteos.set(iso, (conteos.get(iso) ?? 0) + 1);
  }

  const diasPeriodo = diasEntre(inicio, fin);
  const total = conteos.size ? [...conteos.values()].reduce((suma, conteo) => suma + conteo, 0) : 0;

  // Un rango muy amplio se recorta por su final: son los días recientes los que
  // explican el ritmo actual, y el mapa sigue siendo legible de un vistazo.
  //
  // La ventana se decide antes de calcular cualquier cifra del mapa porque de
  // ella salen el día más lleno, los días con altas y el tono de las casillas.
  // Medirlos sobre el periodo completo daría un mapa lavado por altas de días
  // que no se dibujan, y un "412 de 1,200 días" donde los dos números no
  // cuentan el mismo periodo.
  const recortado = diasPeriodo > TOPE_DIAS;
  const primero = recortado ? sumarDias(fin, -(TOPE_DIAS - 1)) : inicio;
  const lunes = sumarDias(primero, -diaDeSemana(primero));

  const dias: DiaAltas[] = [];
  let diasMapa = 0;
  let diasConAltas = 0;
  let max = 0;

  for (let iso = lunes; iso <= fin; iso = sumarDias(iso, 1)) {
    const enPeriodo = iso >= primero && iso <= fin;
    const conteo = enPeriodo ? (conteos.get(iso) ?? 0) : 0;
    if (enPeriodo) {
      diasMapa++;
      if (conteo > 0) diasConAltas++;
      if (conteo > max) max = conteo;
    }
    dias.push({ iso, conteo, nivel: 0, enPeriodo, esPico: false });
  }

  // El tono se reparte en una segunda pasada: es relativo al día más lleno, que
  // solo se conoce al cerrar el recorrido, y en una sola pasada un día que batía
  // el récord provisional se quedaría con el tono que le tocaría por su valor
  // anterior.
  let pico: DiaAltas | null = null;
  for (const dia of dias) {
    if (!dia.enPeriodo) continue;
    dia.nivel = nivelDe(dia.conteo, max);
    dia.esPico = max > 0 && dia.conteo === max;
    if (dia.esPico) pico = dia;
  }

  const ultimosSiete = sumaEntre(conteos, sumarDias(fin, -(VENTANA_RITMO - 1)), fin);
  const sieteAnteriores = sumaEntre(
    conteos,
    sumarDias(fin, -(VENTANA_RITMO * 2 - 1)),
    sumarDias(fin, -VENTANA_RITMO),
  );

  return {
    dias,
    meses: rotulosDeMeses(dias),
    diasPeriodo,
    diasMapa,
    total,
    max,
    media: diasPeriodo > 0 ? total / diasPeriodo : 0,
    diasConAltas,
    pico,
    ultimosSiete,
    sieteAnteriores,
    variacion: sieteAnteriores > 0 ? ((ultimosSiete - sieteAnteriores) / sieteAnteriores) * 100 : null,
    recortado,
  };
}

/**
 * Construye las opciones de un desplegable de filtro a partir de la base.
 *
 * La etiqueta incluye el conteo porque un país con 4,535 usuarios y otro con 9
 * no son la misma decisión de filtrado. Los valores ausentes del backend
 * aparecen con su etiqueta propia en lugar de desaparecer del filtro.
 *
 * @param usuarios - Base (o subconjunto ya acotado) a inspeccionar.
 * @param campo - Campo por el que se agrupa.
 * @returns Opciones ordenadas: alfabéticamente en geografía, por peso en ocupación.
 */
export function opcionesFiltro(
  usuarios: readonly UsuarioItem[],
  campo: 'pais' | 'estado' | 'ocupacionLabel',
): OpcionFiltro[] {
  const opciones = [...contarPor(usuarios, campo).entries()].map(([valor, conteo]) => ({
    valor,
    label: valor,
    conteo,
  }));

  if (campo === 'ocupacionLabel') {
    return opciones.sort((a, b) => b.conteo - a.conteo || a.label.localeCompare(b.label, 'es'));
  }

  return opciones.sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }));
}

const COMPARADORES: Record<CampoOrden, (a: UsuarioItem, b: UsuarioItem) => number> = {
  nombre: (a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }),
  pais: (a, b) =>
    a.pais.localeCompare(b.pais, 'es', { sensitivity: 'base' }) ||
    a.estado.localeCompare(b.estado, 'es', { sensitivity: 'base' }),
  estado: (a, b) =>
    a.estado.localeCompare(b.estado, 'es', { sensitivity: 'base' }) ||
    a.pais.localeCompare(b.pais, 'es', { sensitivity: 'base' }),
  ocupacion: (a, b) =>
    a.ocupacionLabel.localeCompare(b.ocupacionLabel, 'es', { sensitivity: 'base' }) ||
    a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }),
  fecha: (a, b) => a.fechaIso.localeCompare(b.fechaIso) || a.nombre.localeCompare(b.nombre, 'es'),
};

/**
 * Ordena dos usuarios según el criterio activo.
 *
 * Cada criterio tiene un desempate estable —el nombre, o el campo geográfico
 * vecino— para que dos páginas del mismo listado no cambien de orden entre sí.
 *
 * @param a - Primer usuario.
 * @param b - Segundo usuario.
 * @param orden - Campo y sentido del ordenamiento.
 * @returns Número negativo, cero o positivo según el comparador.
 */
export function comparar(a: UsuarioItem, b: UsuarioItem, orden: OrdenUsuario): number {
  const resultado = (COMPARADORES[orden.campo] ?? COMPARADORES.fecha)(a, b);
  return orden.direccion === 'desc' ? -resultado : resultado;
}

/**
 * Aplica los filtros y la búsqueda del directorio sobre la base del periodo.
 *
 * Los tres filtros son exactos y se combinan entre sí; la búsqueda es de texto
 * parcial y se aplica sobre la clave ya normalizada de cada usuario, que cubre
 * nombre, país, estado y ocupación. La búsqueda siempre va al final para que el
 * orden elegido se cumpla sobre el conjunto realmente visible.
 *
 * @param usuarios - Base ya normalizada.
 * @param filtros - Filtros de país, estado y ocupación.
 * @param busqueda - Texto escrito en el buscador.
 * @returns Usuarios filtrados y ordenados, aún sin paginar.
 */
export function selectUsuarios(
  usuarios: readonly UsuarioItem[],
  filtros: FiltrosDirectorio = FILTROS_VACIOS,
  busqueda = '',
  orden: OrdenUsuario = ORDEN_INICIAL,
): UsuarioItem[] {
  const termino = normalizar(busqueda);

  return usuarios
    .filter((usuario) => {
      if (filtros.pais && usuario.pais !== filtros.pais) return false;
      if (filtros.estado && usuario.estado !== filtros.estado) return false;
      if (filtros.ocupacion && usuario.ocupacionLabel !== filtros.ocupacion) return false;
      if (termino && !usuario.claveBusqueda.includes(termino)) return false;
      return true;
    })
    .sort((a, b) => comparar(a, b, orden));
}

/**
 * Calcula cuántas páginas necesita un conjunto.
 *
 * @param total - Número de elementos.
 * @param pageSize - Elementos por página.
 * @returns Número de páginas, al menos una aunque no haya elementos.
 */
export function totalPaginas(total: number, pageSize: number): number {
  if (pageSize <= 0) return 1;
  return Math.max(1, Math.ceil(total / pageSize));
}

/**
 * Recorta el conjunto a la página pedida.
 *
 * Es el mecanismo que mantiene ligero el listado: el endpoint entrega miles de
 * registros, pero al DOM solo llega la página visible.
 *
 * @param items - Conjunto ya filtrado y ordenado.
 * @param pagina - Página pedida, base 1.
 * @param pageSize - Elementos por página.
 * @returns Los elementos de esa página.
 */
export function paginar<T>(items: readonly T[], pagina: number, pageSize: number): T[] {
  if (pageSize <= 0) return [...items];
  const inicio = (Math.max(1, pagina) - 1) * pageSize;
  return items.slice(inicio, inicio + pageSize);
}
