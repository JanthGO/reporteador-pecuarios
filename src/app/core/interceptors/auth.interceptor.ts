import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor HTTP que adjunta el token de sesión en todas las peticiones salientes.
 *
 * Si el usuario autenticado posee un token, se inyecta la cabecera
 * `Authorization: Bearer <token>`. De lo contrario, la petición se envía sin
 * cabecera de autorización, lo que permite que el backend rechace el acceso a
 * los endpoints protegidos con un 401.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.currentUser()?.token;

  if (!token) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }),
  );
};