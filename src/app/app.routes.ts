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
        path: 'menu',
        loadChildren: ()=> import('./modules/menu/menu.routes').then((m) => m.menuRoutes),
    },
];
