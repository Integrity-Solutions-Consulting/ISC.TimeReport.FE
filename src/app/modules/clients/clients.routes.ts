import { Routes } from '@angular/router';
import { ListClientsPage } from './pages/list-clients/list-clients.page';

export const clientsRoutes: Routes = [
    {
        path: '',
        component: ListClientsPage,
    },
];
