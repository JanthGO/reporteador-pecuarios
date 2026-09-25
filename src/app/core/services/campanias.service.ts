import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { ResponseMailchimp } from '../interfaces/campanias/Campania';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Service()
export class CampaniasService {
    private http = inject(HttpClient);

    mailchimp(
        division: number, 
        empresa: number, 
        fecha_inicio: string = '', 
        fecha_fin: string = ''): Observable<ResponseMailchimp>{
    return this.http.get<ResponseMailchimp>(`${environment.api}mailchimp/${division}/${empresa}/${fecha_inicio}/${fecha_fin}`);
  }
}
