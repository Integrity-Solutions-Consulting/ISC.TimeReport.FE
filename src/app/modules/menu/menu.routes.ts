import { clientsRoutes } from '../clients/clients.routes';
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
            loadChildren: () => import('../clients/clients.routes').then((m) => m.clientsRoutes),
            /*canActivate: [RoleGuard],
            data: { roles: ['Administrador'] }*/
          },
          {
            path: 'leaders',
            loadChildren: () => import('../leaders/leaders.routes').then((m) => m.LeaderRoutes),
            /*canActivate: [RoleGuard],
            data: { roles: ['Administrador', 'Gerente'] }*/
          },
          {
            path: 'persons',
            loadChildren: () => import('../persons/persons.routes').then((m) => m.personsRoutes)
          },
          {
            path: 'employees',
            loadChildren: () => import('../employees/employees.routes').then((m) => m.employeesRoutes),
            /*canActivate: [RoleGuard],
            data: { roles: ['Administrador'] }*/
          },
          {
            path: 'projects',
            loadChildren: () => import('../projects/projects.routes').then((m) => m.projectsRoutes),
            /*canActivate: [RoleGuard],
            data: { roles: ['Administrador', 'Gerente', 'Líder de Proyecto'] }*/
          },
          {
            path: 'activities',
            loadChildren: () => import('../activities/activities.routes').then((m) => m.activitiesRoutes),
            /*canActivate: [RoleGuard],
            data: { roles: ['Administrador', 'Gerente', 'Líder de Proyecto', 'Colaborador'] }*/
          }
        ]
    },
];
