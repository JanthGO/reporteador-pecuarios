export interface ResponseVisitasTotales {
    statusCode: number;
    data:       VisitasTotales;
}

export interface VisitasTotales {
    data:         Visitas[];
    prom_mensual: number;
    total:        number;
    prom_dia:     number;
}

export interface Visitas {
    fecha:   string;
    visitas: number;
}