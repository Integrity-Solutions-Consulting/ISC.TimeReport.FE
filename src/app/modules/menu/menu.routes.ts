import { clientsRoutes } from '../clients/clients.routes';
import { Routes } from '@angular/router';
import { AppMenuPage } from './pages/app-menu/app-menu.page';
import { RoleGuard } from '../../shared/guards/role.guard';
import { AdminGuard } from '../../guards/admin.guard';

export const menuRoutes: Routes = [
  {
    path: '',
    component: AppMenuPage,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard' // Redirige a dashboard por defecto
      },
      {
        path: 'dashboard',
        loadChildren: () => import('../dashboard/dashboard.routes').then((m) => m.dashboardRoutes),
        //data: { roles: ['Administrador'] }
      },
      {
        path: 'clients',
        loadChildren: () => import('../clients/clients.routes').then((m) => m.clientsRoutes),
        //canActivate: [RoleGuard],
        //data: { roles: ['Administrador', 'Gerente'] }
      },
      {
        path: 'leaders',
        loadChildren: () => import('../leaders/leaders.routes').then((m) => m.LeaderRoutes),
        //canActivate: [RoleGuard],
       // data: { roles: ['Administrador', 'Gerente'] }
      },
      {
        path: 'persons',
        loadChildren: () => import('../persons/persons.routes').then((m) => m.personsRoutes),
        //canActivate: [RoleGuard],
        //data: { roles: ['Administrador'] }
      },
      {
        path: 'employees',
        loadChildren: () => import('../employees/employees.routes').then((m) => m.employeesRoutes),
        //canActivate: [RoleGuard],
        //data: { roles: ['Administrador'] }
      },
      {
        path: 'projects',
        loadChildren: () => import('../projects/projects.routes').then((m) => m.projectsRoutes),
        //canActivate: [RoleGuard],
        //data: { roles: ['Administrador', 'Gerente', 'Lider'] }
      },
      {
        path: 'activities',
        loadChildren: () => import('../activities/activities.routes').then((m) => m.activitiesRoutes),
        //canActivate: [RoleGuard],
        //data: { roles: ['Administrador', 'Gerente', 'Lider', 'Colaborador'] }
      },
      {
        path: 'assignments',
        loadChildren: () => import('../assigments/assigment.routes').then((m) => m.assignmentsRoutes),
        //canActivate: [RoleGuard],
        //data: { roles: ['Administrador', 'Gerente', 'Lider'] }
      },
      {
        path: 'settings',
        loadChildren: () => import('../roles/roles.routes').then((m) => m.rolesRoutes),
        //canActivate: [AdminGuard] // Solo para admin
      },
      {
        path: 'users',
        loadChildren: () => import('../users/users.routes').then((m) => m.usersRoutes),
        //canActivate: [AdminGuard] // Solo para admin
      }
    ]
  }
];
