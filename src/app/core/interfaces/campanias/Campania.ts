/**
 * Modelo de datos de la vista de campañas.
 *
 * Sigue la misma separación que el resto del módulo: el tipo `Campania`
 * representa el registro tal como lo entrega la fuente de datos y
 * `CampaniaItem` es el modelo de vista que consume
 * `<app-campaign-card>`, con la fecha ya formateada.
 */

/** Periodo de consulta, tal como lo emite `<app-date-range>`. */
export interface RangoFechas {
  fecha_inicio: string;
  fecha_fin: string;
}

/** Registro de campaña publicado por una empresa. */
export interface Campania {
  /** Identificador estable; se usa como clave de track en el listado. */
  id: number;
  /** Nombre de la campaña. Es el texto por el que se busca. */
  nombre: string;
  /** Fecha de publicación. Acepta `YYYY-MM-DD` o `YYYY-MM-DD HH:mm:ss`. */
  fecha: string;
  /** URL de la imagen destacada de la campaña. */
  imagen: string;
  /** URL pública de la campaña; se abre en una pestaña nueva. */
  enlace: string;
}

/** Modelo de vista de una tarjeta de campaña. */
export interface CampaniaItem {
  id: number;
  nombre: string;
  /** Fecha de publicación lista para mostrar (p. ej. `18 sep 2026`). */
  fechaLabel: string;
  /** Fecha de publicación en `YYYY-MM-DD`, para el atributo `datetime`. */
  fechaIso: string;
  imagen: string;
  enlace: string;
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
