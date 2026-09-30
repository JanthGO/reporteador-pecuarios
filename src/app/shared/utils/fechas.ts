const FECHA_LARGA = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/**
 * Convierte una fecha cruda a ISO `YYYY-MM-DD`.
 *
 * Entiende tanto `YYYY-MM-DD[ HH:mm:ss]` como `dd/mm/aaaa`; un valor
 * irreconocible produce cadena vacía, que el resto de funciones tratan como
 * "sin fecha" en lugar de romper.
 *
 * @param fecha - Fecha cruda del endpoint.
 * @returns Fecha ISO, o cadena vacía.
 */
export function aIso(fecha: string | null | undefined): string {
  const bruto = (fecha ?? '').trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(bruto)) return bruto.slice(0, 10);

  const partes = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(bruto);
  if (!partes) return '';
  const [, dia, mes, anio] = partes;
  return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
}

/**
 * Formatea una fecha a etiqueta larga es-MX (p. ej. `18 de septiembre de 2026`).
 *
 * Si la cadena no es una fecha reconocible se devuelve tal cual, para no
 * perder información del dato de origen.
 *
 * @param fecha - Fecha cruda (`YYYY-MM-DD[ HH:mm:ss]` o `dd/mm/aaaa`).
 * @returns Etiqueta larga, o el valor original si no es una fecha válida.
 */
export function formatFechaLarga(fecha: string | null | undefined): string {
  const iso = aIso(fecha);
  if (!iso) return fecha ?? '';
  const [y, m, d] = iso.split('-').map(Number);
  return FECHA_LARGA.format(new Date(y, m - 1, d));
}