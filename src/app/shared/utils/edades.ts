import { PerfilVisitante, porcentajeEdad } from '../../core/interfaces/dashboard/PerfilVisitante';

/** Rangos de edad en orden cronológico, en español. */
export const TRAMOS_EDAD: readonly string[] = [
  'Menos de 20 años',
  '20–30 años',
  '30–40 años',
  '40–50 años',
  '50–60 años',
  'Más de 60 años',
];

export interface AgeBucket {
  label: string;
  value: number;
}

/** Proyección de los campos de `porcentajeEdad` al tramo cronológico que les corresponde. */
const CLAVE_A_TRAMO: readonly (keyof porcentajeEdad)[] = [
  'menos20',
  'entre20y30',
  'entre30y40',
  'entre40y50',
  'entre50y60',
  'mas60',
];

/**
 * Distribución de edad agregada por género, de mayor a menor.
 *
 * El endpoint entrega los porcentajes de edad separados por género; la regla de
 * negocio los suma para mostrar el desglose total por rango. Vive en un util
 * compartido porque todas las vistas con perfil de visitante consumen la misma
 * transformación.
 *
 * @param perfil - Perfil demográfico de la división y el periodo consultados.
 * @returns Rangos de edad ordenados de forma descendente, o lista vacía si el
 *   perfil no trae el desglose por género.
 */
export function rangosEdad(perfil: PerfilVisitante | null | undefined): AgeBucket[] {
  const genero = perfil?.visitasXgenero;
  if (!genero) return [];

  return CLAVE_A_TRAMO.map((clave, indice) => ({
    label: TRAMOS_EDAD[indice],
    value: genero.porcientoMan[clave] + genero.porcientoWoman[clave],
  })).sort((a, b) => b.value - a.value);
}