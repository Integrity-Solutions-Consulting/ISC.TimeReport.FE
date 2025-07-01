import { Routes } from '@angular/router';
import { LoginPage } from './pages/login/login.component';
import { SigninPage } from './pages/signin/signin.component';
import { ErrorPage } from './pages/error/error.component';

export const authRoutes: Routes = [
    {
        path: '',
        component: LoginPage,
    },
    {
        path: 'login',
        component: LoginPage,
    },
    {
        path: 'signin',
        component: SigninPage,
    },
    {
        path: '404',
        component: ErrorPage,
    },
    /*{
        path: '**',
        redirectTo: '/404'
    }*/
];
