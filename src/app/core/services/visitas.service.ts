import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, timer, throwError } from 'rxjs';
import { retryWhen, mergeMap, finalize } from 'rxjs/operators';
import { ResponseVisitasTotales } from '../interfaces/visitas/visitas';
import { environment } from '../../../environments/environment';

export interface RetryConfig {
  maxRetries: number;
  delayMs: number;
}

const DEFAULT_RETRY: RetryConfig = { maxRetries: 2, delayMs: 1200 };

@Injectable({ providedIn: 'root' })
export class VisitasService {
  private http = inject(HttpClient);

  visitasXseccion(
    division: number,
    empresa: number,
    tipo: string,
    fecha_inicio: string = '',
    fecha_fin: string = '',
    retry: RetryConfig = DEFAULT_RETRY,
  ): Observable<ResponseVisitasTotales> {
    
    const url = (fecha_inicio && fecha_fin)
      ? `${environment.api}total-visits/${division}/${empresa}/${tipo}/${fecha_inicio}/${fecha_fin}`
      : `${environment.api}total-visits/${division}/${empresa}/${tipo}`;

    return this.http.get<ResponseVisitasTotales>(url).pipe(
      retryWhen(this.buildRetryLogic(retry)),
    );
  }

  private buildRetryLogic(config: RetryConfig) {
    let attempts = 0;

    return (errors: Observable<HttpErrorResponse>) =>
      errors.pipe(
        mergeMap((error) => {
          attempts++;
          if (attempts <= config.maxRetries && this.isRetryable(error)) {
            return timer(config.delayMs * attempts);
          }
          return throwError(() => error);
        }),
        finalize(() => {
          attempts = 0;
        }),
      );
  }

  private isRetryable(error: HttpErrorResponse): boolean {
    return (
      error.status === 0 ||
      error.status === 429 ||
      error.status >= 500
    );
  }
}
