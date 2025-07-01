import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {

    const token = localStorage.getItem('token');
    const menus = JSON.parse(localStorage.getItem('menus') || '[]');

    // Si no hay token, redirigir al login
    if (!token) {
      this.router.navigate(['/login']);
      return false;
    }

    // Verificamos si la ruta solicitada está permitida
    const requestedUrl = state.url;
    const tieneAcceso = menus.includes(requestedUrl);

    if (!tieneAcceso) {
      this.router.navigate(['/404']); // o tu página de error
      return false;
    }

    return true;
  }
}
