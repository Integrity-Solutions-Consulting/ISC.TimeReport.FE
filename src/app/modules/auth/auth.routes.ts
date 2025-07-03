import { Routes } from '@angular/router';
import { LoginPage } from './pages/login/login.component';
import { SigninPage } from './pages/signin/signin.component';

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
];
