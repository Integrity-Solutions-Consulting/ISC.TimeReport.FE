import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../modules/auth/services/auth.service';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthRedirectGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | boolean {
    // 1. Permitir acceso a rutas públicas
    if (state.url.startsWith('/auth')) {
      return true;
    }

    // 2. Verificar autenticación
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    // 3. Manejar ruta raíz ('/') para administradores
    if (state.url === '/' || state.url === '/menu') {
      if (this.authService.isAdmin()) {
        return true; // Permitir acceso a dashboard para admin
      } else {
        this.router.navigate(['/menu/activities']);
        return false;
      }
    }

    // 4. Para otras rutas bajo /menu
    if (state.url.startsWith('/menu')) {
      if (this.authService.isAdmin()) {
        return true; // Admin tiene acceso completo
      }

      // Verificar rutas permitidas para no-admins
      const allowedRoutes = [
        '/menu/activities',
        // agregar otras rutas permitidas para colaboradores
      ];

      if (allowedRoutes.some(route => state.url.startsWith(route))) {
        return true;
      }

      this.router.navigate(['/menu/activities']);
      return false;
    }

    // 5. Para cualquier otra ruta no manejada
    this.router.navigate(['/404']);
    return false;
  }
}
