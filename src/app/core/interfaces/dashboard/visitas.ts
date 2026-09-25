import { PerfilVisitante } from "./PerfilVisitante";

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

export interface ResponseSecciones {
    statusCode: number;
    data:       Secciones;
}

export interface Secciones {
    contenidos:   Contenidos;
    visitas:      VisitasTotales;
    perfilVisita: PerfilVisitante;
}

export interface Contenidos {
    total:   number;
    data:    elemento[];
    popular: elemento[];
}

export interface elemento {
    id:      number;
    nombre:  string;
    imagen:  string;
    estatus: number;
    visitas: number;
    url:     string;
    orden?:     number;
}
