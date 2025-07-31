import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../modules/auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RecoveryGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      const target = this.authService.isAdmin()
        ? '/menu/dashboard'
        : '/menu/activities';
      this.router.navigate([target], { skipLocationChange: true });
      return false;
    }

    this.router.navigate(['/auth/login'], { skipLocationChange: true });
    return false;
  }
}
