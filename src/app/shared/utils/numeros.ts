const NUMERO = new Intl.NumberFormat('es-MX');

/**
 * Formatea un número con separadores de miles en español (p. ej. `1,742`).
 *
 * @param valor - Número a formatear.
 * @returns Cadena con separadores de miles.
 */
export function formatNumber(valor: number | null | undefined): string {
  return NUMERO.format(valor ?? 0);
}