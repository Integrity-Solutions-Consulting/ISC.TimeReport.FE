import { Routes } from '@angular/router';
import { ListCustomersPage } from './pages/list-customers/list-customers.component';
import { ManageCustomerPage } from './pages/manage-customer/manage-customer.component';

export const customersRoutes: Routes = [
    {
        path: '',
        component: ListCustomersPage,
    },
    {
        path: 'manage',
        component: ManageCustomerPage,
    },
];