import { Routes } from '@angular/router';
import { ListClientsPage } from './pages/list-clients/list-clients.page';
import { ClientInfoPage } from './pages/client-info/client-info.page';

export const clientsRoutes: Routes = [
    {
        path: '',
        component: ListClientsPage,
    },
    {
        path: ':id',
        component: ClientInfoPage,
    },
];
