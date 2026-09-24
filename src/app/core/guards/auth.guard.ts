import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard de ruta que restringe el acceso al dashboard a usuarios autenticados.
 *
 * - Si existe sesión activa (`AuthService.currentUser`), permite la navegación.
 * - Si no hay sesión, redirige a `/login` mediante un `UrlTree`.
 *
 * De esta forma, los endpoints de datos (incluido `visitor-profile`) solo pueden
 * consultarse desde sesiones autorizadas.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.currentUser()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};