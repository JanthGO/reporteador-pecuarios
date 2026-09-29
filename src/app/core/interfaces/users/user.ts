export interface ResponseUsuarios {
    statusCode: number;
    data:       Usuarios[];
}

export interface Usuarios {
    pais:        string;
    estado:      string;
    ocupacion:   string;
    nombre:      string;
    fecha_reg:   string;
    fnacimiento: string;
}