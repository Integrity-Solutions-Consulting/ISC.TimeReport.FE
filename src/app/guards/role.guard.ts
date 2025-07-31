// role.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../modules/auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    const requiredRoles = route.data['roles'] as Array<string>;
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const hasRole = this.authService.getCurrentUserRoles().some(role =>
      requiredRoles.includes(role.roleName)
    );

    if (!hasRole) {
      // Aquí es donde correctamente usamos skipLocationChange
      this.router.navigate(['/404'], { skipLocationChange: true });
      return false;
    }

    return true;
  }
}
