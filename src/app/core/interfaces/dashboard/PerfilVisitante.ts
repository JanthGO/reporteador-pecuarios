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