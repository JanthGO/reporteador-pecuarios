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

export interface RetryConfig {
  maxRetries: number;
  delayMs: number;
}

export interface SectionDef {
  key: string;
  nombre: string;
  iconClass: string;
  iconName: string;
}