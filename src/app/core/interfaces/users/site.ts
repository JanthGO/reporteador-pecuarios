export interface ResponseEstadisticas {
    statusCode: number;
    data:       Estadisticas;
}

export interface Estadisticas {
    visitas: VisitasSite;
}

export interface VisitasSite {
    total:             number;
    prom_mensual:      number;
    prom_diario:       number;
    visitas_paises:    Array<string[]>;
    visitas_mensuales: Array<string[]>;
}

export interface topPaises{
    nombre:     string,
    visitas:    number
}