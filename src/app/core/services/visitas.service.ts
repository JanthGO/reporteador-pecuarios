import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ResponseVisitasTotales } from '../interfaces/visitas/visitas';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class VisitasService {
    private http = inject(HttpClient);

    visitasXseccion( division: number, empresa: number, tipo: string, fecha_inicio: string = '', fecha_fin: string = '' ){
    if( fecha_inicio != '' && fecha_fin != '' ){
      return this.http.get<ResponseVisitasTotales>(`${environment.api}total-visits/${division}/${empresa}/${tipo}/${fecha_inicio}/${fecha_fin}`);
    } else {
      return this.http.get<ResponseVisitasTotales>(`${environment.api}total-visits/${division}/${empresa}/${tipo}`);
    }
  }
    
}
