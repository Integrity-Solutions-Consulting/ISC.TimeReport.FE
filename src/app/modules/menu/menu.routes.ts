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
            path: 'clients',
            loadChildren: () => import('../customers/customers.routes').then((m) => m.customersRoutes),
            //canActivate: [RoleGuard],
            //data: { roles: ['Administrador'] }
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
          },
          {
            path: 'projects',
            loadChildren: () => import('../projects/projects.routes').then((m) => m.projectsRoutes)
          }
        ]
    },
];
