/** Periodo de consulta, tal como lo emite `<app-date-range>`. */
export interface RangoFechas {
  fecha_inicio: string;
  fecha_fin: string;
}

export interface ResponseMailchimp {
    statusCode: number;
    data:       CampaniaMail[];
}

export interface CampaniaMail {
    id:                number;
    fecha_publicacion: string;
    imagen:            string;
    nombre:            string;
    url:               string;
}
