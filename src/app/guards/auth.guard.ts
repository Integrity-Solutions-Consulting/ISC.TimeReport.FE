import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from '@angular/router';
import { AuthService } from '../modules/auth/services/auth.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | Observable<boolean> {
    if (!this.authService.isAuthenticated()) {
      this.handleUnauthenticated(state.url);
      return false;
    }

    if (route.routeConfig?.path === '') { // Ruta vacía especial
      if (this.authService.isAuthenticated()) {
        this.router.navigate(['/menu']);
      } else {
        this.router.navigate(['/auth/login']);
      }
      return false;
    }

    // Verificar si el módulo está permitido
    if (!this.authService.checkRoutePermission(state.url)) {
      this.router.navigate(['/not-authorized']);
      return false;
    }

    return true;
  }

  private handleUnauthenticated(returnUrl: string): void {
    this.authService.logout();
    this.router.navigate(['/login'], {
      queryParams: { returnUrl }
    });
  }
}
