/**
 * Reduce un texto a una forma comparable: sin mayúsculas, sin tildes y sin
 * espacios sobrantes.
 *
 * @param texto - Texto de entrada (nombre o consulta).
 * @returns Texto normalizado para comparar.
 */
export function normalizar(texto: string | null | undefined): string {
  return (texto ?? '')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();
}