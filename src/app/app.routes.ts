import { Routes } from '@angular/router';
import { RoleGuard } from './shared/guards/role.guard';
import { ErrorPage } from './modules/auth/pages/error/error.component';

export const routes: Routes = [
    {
      path: '',
      redirectTo: '/menu',
      pathMatch: 'full'
    },
    {
      path: 'auth',
      loadChildren: ()=> import('./modules/auth/auth.routes').then((m) => m.authRoutes),
    },
    {
      path: 'menu',
      loadChildren: () => import('./modules/menu/menu.routes').then(m => m.menuRoutes),
      /*canActivate: [RoleGuard],
      data: { roles: ['Administrador', 'Gerente', 'Líder de Proyecto', 'Colaborador'] }*/
    },
    {
        path: '404',
        component: ErrorPage,
    },
    {
        /*path: '**',
        redirectTo: '/404'*/
    },
];
