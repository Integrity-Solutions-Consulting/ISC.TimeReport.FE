import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router
} from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {

    const allowedRoles = route.data['roles'] as string[]; // Ej: ['admin']
    const rawRoles = localStorage.getItem('roles'); // <-- Asegúrate que la clave sea 'roles'

    if (!rawRoles) {
      localStorage.clear();
      return this.router.parseUrl('/login');
    }

    let userRoles: { id: number; rolName: string }[];

    try {
      userRoles = JSON.parse(rawRoles);
    } catch {
      localStorage.clear();
      return this.router.parseUrl('/login');
    }

    // Comprobar si alguno de los roles del usuario coincide con los permitidos
    const hasAccess = userRoles.some(role => allowedRoles.includes(role.rolName));

    return hasAccess ? true : this.router.parseUrl('/login');
  }
}
