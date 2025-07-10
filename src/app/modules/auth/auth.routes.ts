import { Routes } from '@angular/router';
import { LoginPage } from './pages/login/login.component';
import { SigninPage } from './pages/signin/signin.component';
import { ChangePasswordComponent } from './components/change-password/change-password.component';
import { RecoveryPasswordComponent } from './components/recovery-password/recovery-password.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';

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
      path: 'change-password',
      component: ChangePasswordComponent
    },
    { path: 'forgot-password', component: RecoveryPasswordComponent },
    { path: 'reset-password', component: ResetPasswordComponent },
];
