import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { ResponseUsuarios } from '../interfaces/users/user';
import { environment } from '../../../environments/environment';
import { ResponseEstadisticas } from '../interfaces/users/site';

@Service()
export class StatisticService {
    private http = inject(HttpClient);
      users( division: number, fecha_inicio: string = '', fecha_fin: string = '' ){
    return this.http.get<ResponseUsuarios>(`${environment.api}users/${division}/${fecha_inicio}/${fecha_fin}`);
  }

   site( division: number, fecha_inicio: string = '', fecha_fin: string = '' ){
    return this.http.get<ResponseEstadisticas>(`${environment.api}stats-site/${division}/${fecha_inicio}/${fecha_fin}`);
  }
}
