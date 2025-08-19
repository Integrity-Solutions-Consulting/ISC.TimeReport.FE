import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from '@angular/router';
import { AuthService } from '../../modules/auth/services/auth.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | Observable<boolean> {
    const requiredRoles = route.data['roles'] as string[]; // Obtiene los roles del data de la ruta

    if (!requiredRoles || requiredRoles.length === 0) {
      // Si no se especifican roles, permite el acceso (o niega, según tu política por defecto)
      console.warn(`No roles specified for route: ${state.url}. Access granted by default.`);
      return true;
    }

    if (!this.authService.isAuthenticated()) {
      // Si no está autenticado, redirige al login
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    if (this.authService.hasRole(requiredRoles)) {
      // Si el usuario tiene alguno de los roles requeridos, permite el acceso
      return true;
    } else {
      // Si el usuario no tiene los roles requeridos, redirige a "no autorizado"
      console.warn(`Access denied for route: ${state.url}. Required roles: ${requiredRoles.join(', ')}. User roles: ${this.authService.getCurrentUserRoles().join(', ')}`);
      this.router.navigate(['/not-authorized']);
      return false;
    }
  }
}