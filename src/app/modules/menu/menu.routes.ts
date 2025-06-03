import { customersRoutes } from './../customers/customers.routes';
import { Routes } from '@angular/router';
import { AppMenuPage } from './pages/app-menu/app-menu.page';
import { RoleGuard } from '../../shared/guards/role.guard';

export const menuRoutes: Routes = [
    {
        path: '',
        component: AppMenuPage,
        children:[
          {
            path: 'customers',
            loadChildren: () => import('../customers/customers.routes').then((m) => m.customersRoutes),
            canActivate: [RoleGuard],
            data: { roles: ['admin'] }
          },
          {
            path: 'leaders',
            loadChildren: () => import('../leaders/leaders.routes').then((m) => m.PoepleRoutes)
          }
        ]
    },
];
