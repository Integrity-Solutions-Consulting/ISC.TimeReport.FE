import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadChildren: ()=> import('./modules/auth/auth.routes').then((m) => m.authRoutes),
    },
    {
        path: 'auth',
        loadChildren: ()=> import('./modules/auth/auth.routes').then((m) => m.authRoutes),
    },
    {
        path: 'customer',
        loadChildren: ()=> import('./modules/customers/customers.routes').then((m) => m.customersRoutes),
    },
];
