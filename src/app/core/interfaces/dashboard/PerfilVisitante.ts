export interface ResponsePerfilVisitante {
    statusCode: number;
    data:       PerfilVisitante;
}

export interface PerfilVisitante {
    total:          number;
    total_original: number;
    visitasXgenero: VisitasXgenero;
    ocupaciones:    info[];
    paises:         info[];
    paises_aux:     info[];
}

export interface info {
    nombre:         string;
    cont:           number;
    promedio?:      number;
}

export interface VisitasXgenero {
    porcientoMan:   porcentajeEdad;
    porcientoWoman: porcentajeEdad;
}

export interface porcentajeEdad {
    menos20:    number;
    entre20y30: number;
    entre30y40: number;
    entre40y50: number;
    entre50y60: number;
    mas60:      number;
}

export interface AgeBucket {
  label: string;
  value: number;
}

/**
 * Distribución de edad agregada por género, de mayor a menor.
 *
 * El endpoint entrega los porcentajes de edad separados por género; la regla de
 * negocio los suma para mostrar el desglose total por rango. Vive junto a
 * `AgeBucket` porque ambas vistas —el perfil del dashboard y el de productos—
 * consumen exactamente la misma transformación.
 *
 * @param perfil - Perfil demográfico de la división y el periodo consultados.
 * @returns Rangos de edad ordenados de forma descendente, o lista vacía si el
 *   perfil no trae el desglose por género.
 */
export function rangosEdad(perfil: PerfilVisitante | null | undefined): AgeBucket[] {
    const genero = perfil?.visitasXgenero;
    if (!genero) return [];

    const man = genero.porcientoMan;
    const woman = genero.porcientoWoman;

    return [
        { label: 'Menos de 20 años', value: man.menos20 + woman.menos20 },
        { label: '20–30 años',       value: man.entre20y30 + woman.entre20y30 },
        { label: '30–40 años',       value: man.entre30y40 + woman.entre30y40 },
        { label: '40–50 años',       value: man.entre40y50 + woman.entre40y50 },
        { label: '50–60 años',       value: man.entre50y60 + woman.entre50y60 },
        { label: 'Más de 60 años',   value: man.mas60 + woman.mas60 },
    ].sort((a, b) => b.value - a.value);
}