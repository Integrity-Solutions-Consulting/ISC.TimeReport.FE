import { customersRoutes } from './../customers/customers.routes';
import { Routes } from '@angular/router';
import { AppMenuPage } from './pages/app-menu/app-menu.page';

export const menuRoutes: Routes = [
    {
        path: '',
        component: AppMenuPage,
        children:[
          {
            path: 'customers',
            loadChildren: () => import('../customers/customers.routes').then((m) => m.customersRoutes),
          },
          {
            path: 'leaders',
            loadChildren: () => import('../leaders/leaders.routes').then((m) => m.PoepleRoutes)
          }
        ]
    },
];
