import { Routes } from '@angular/router';
import { RoleGuard } from './shared/guards/role.guard';
import { ErrorPage } from './modules/auth/pages/error/error.component';
import { AuthGuard } from './guards/auth.guard';
import { AuthRedirectGuard } from './guards/auth-redirect.guard';
import { AdminGuard } from './guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./modules/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: 'menu',
    loadChildren: () => import('./modules/menu/menu.routes').then(m => m.menuRoutes),
    //canActivate: [AuthGuard, RoleGuard], // Guards normales
    //data: { roles: ['Administrador', 'Colaborador'] } // Roles permitidos en todo el módulo
  },
  {
    path: '404',
    component: ErrorPage,// Nuevo guard para permitir salir del error
  },
  {
    path: '**',
    redirectTo: '404', // Evita que el navegador guarde la ruta inválida
  }
];
