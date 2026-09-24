export interface ResponseUltimasVisitas {
    statusCode: number;
    data:       UltimasVisitas[];
}

export interface UltimasVisitas {
    fecha:      string;
    seccion:    string;
    detalle:    string;
    plataforma: string;
}

export type ActivityPlatform = 'Móvil' | 'Web';

export interface ActivityItem {
  fechaHora: string;
  seccion: string;
  seccionClass: string;
  contenido: string;
  plataforma: ActivityPlatform;
}