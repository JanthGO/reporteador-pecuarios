import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, timer, throwError } from 'rxjs';
import { retryWhen, mergeMap, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ResponseSecciones, ResponseVisitasTotales, RetryConfig } from '../interfaces/dashboard/visitas';
import { ResponsePerfilVisitante } from '../interfaces/dashboard/PerfilVisitante';
import { ResponseUltimasVisitas } from '../interfaces/dashboard/ActividadReciente';


/** Configuración por defecto: 2 reintentos con 1200 ms de retardo progresivo. */
const DEFAULT_RETRY: RetryConfig = { maxRetries: 2, delayMs: 1200 };
@Injectable({ providedIn: 'root' })
export class VisitasService {
  private http = inject(HttpClient);

  /**
   * Obtiene el total de visitas, promedio mensual, promedio diario y la serie
   * temporal de datos para una sección específica.
   *
   * @param division   - ID de la división (1 = Porcicultura, 2 = Ganadería, 3 = Avicultura).
   * @param empresa    - ID de la empresa.
   * @param tipo       - Clave de la sección a consultar (e.g. `'total'`, `'productos'`, `'articulos'`).
   * @param fecha_inicio - Fecha de inicio en formato ISO `YYYY-MM-DD`. Cadena vacía para omitir.
   * @param fecha_fin    - Fecha de fin en formato ISO `YYYY-MM-DD`. Cadena vacía para omitir.
   * @param retry      - Configuración de reintentos. Usa valores por defecto si no se especifica.
   * @returns Un `Observable` que emite la respuesta con los datos totales de visitas.
   */
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

  /**
   * Obtiene el perfil demográfico del visitante: totales, género por rango de
   * edad, top de ocupaciones y top de países para la división y empresa dadas.
   *
   * @param division   - ID de la división (1 = Porcicultura, 2 = Ganadería, 3 = Avicultura).
   * @param empresa    - ID de la empresa del usuario autenticado.
   * @param fecha_inicio - Fecha de inicio en formato ISO `YYYY-MM-DD`. Cadena vacía para omitir.
   * @param fecha_fin    - Fecha de fin en formato ISO `YYYY-MM-DD`. Cadena vacía para omitir.
   * @returns Un `Observable` con la respuesta del perfil del visitante.
   */
  perfilVisitante(
    division: number,
    empresa: number,
    fecha_inicio: string = '',
    fecha_fin: string = '',
  ): Observable<ResponsePerfilVisitante> {
    const url = (fecha_inicio && fecha_fin)
      ? `${environment.api}visitor-profile/${division}/${empresa}/${fecha_inicio}/${fecha_fin}`
      : `${environment.api}visitor-profile/${division}/${empresa}`;

    return this.http.get<ResponsePerfilVisitante>(url).pipe(
      retryWhen(this.buildRetryLogic(DEFAULT_RETRY)),
    );
  }

  /**
   * Obtiene las últimas interacciones de los usuarios con la marca
   * (productos, artículos, noticias, etc.) para una división y empresa)
   *
   * @param division   - ID de la división (1 = Porcicultura, 2 = Ganadería, 3 = Avicultura).
   * @param empresa    - ID de la empresa del usuario autenticado.
   * @param fecha_fin  - Fecha de fin en formato ISO `YYYY-MM-DD`. Cadena vacía para omitir.
   * @returns Un `Observable` con la respuesta de las últimas visitas.
   */
  ultimasVisitas(
    division: number,
    empresa: number,
    fecha_fin: string = '',
  ): Observable<ResponseUltimasVisitas> {
    return this.http.get<ResponseUltimasVisitas>(
      `${environment.api}last-visits/${division}/${empresa}/${fecha_fin}`,
    ).pipe(
      retryWhen(this.buildRetryLogic(DEFAULT_RETRY)),
    );
  }

  /** 
  * Obtiene las visitas y los contenidos de una sección específica.
  * 
  * @param division   - ID de la división (1 = Porcicultura, 2 = Ganadería, 3 = Avicultura).
  * @param empresa    - ID de la empresa del usuario autenticado.
  * @param tipo       - Clave de la sección a consultar (e.g. `'productos'`, `'articulos'`).
  * @param fecha_inicio - Fecha de inicio en formato ISO `YYYY-MM-DD`. Cadena vacía para omitir.
  * @param fecha_fin    - Fecha de fin en formato ISO `YYYY-MM-DD`. Cadena vacía para omitir.
  * @returns Un `Observable` con la respuesta de las visitas y los contenidos.
  */
  seccion( division: number, empresa: number, tipo: string, fecha_inicio: string = '', fecha_fin: string = '' ){
    return this.http.get<ResponseSecciones>(`${environment.api}visits/${division}/${empresa}/${tipo}/${fecha_inicio}/${fecha_fin}`).pipe(
      retryWhen(this.buildRetryLogic(DEFAULT_RETRY)),
    );
  }

  /**
   * Construye la lógica de reintentos con retardo progresivo.
   *
   * Cada reintento espera `delayMs * intento` milisegundos antes de reintentar.
   * Si el error no es reintentable o se agotaron los intentos, se propaga el error original.
   *
   * @param config - Configuración con el máximo de reintentos y el retardo base.
   * @returns Función compatible con el operador `retryWhen` de RxJS.
   */
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

  /**
   * Determina si un error HTTP debe reintentarse.
   *
   * Se reintentan:
   * - `status === 0`   → Error de red / conexión perdida.
   * - `status === 429` → Rate-limit excedido.
   * - `status >= 500`  → Errores de servidor.
   *
   * No se reintentan errores 4xx (excepto 429), ya que representan
   * problemas del lado del cliente (parámetros inválidos, 404, etc.).
   *
   * @param error - Objeto `HttpErrorResponse` recibido.
   * @returns `true` si el error es reintentable, `false` en caso contrario.
   */
  private isRetryable(error: HttpErrorResponse): boolean {
    return (
      error.status === 0 ||
      error.status === 429 ||
      error.status >= 500
    );
  }


}
