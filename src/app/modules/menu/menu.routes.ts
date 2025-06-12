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
            loadChildren: () => import('../leaders/leaders.routes').then((m) => m.LeaderRoutes)
          },
          {
            path: 'persons',
            loadChildren: () => import('../persons/persons.routes').then((m) => m.personsRoutes)
          },
          {
            path: 'employees',
            loadChildren: () => import('../employees/employees.routes').then((m) => m.employeesRoutes)
          }
        ]
    },
];
