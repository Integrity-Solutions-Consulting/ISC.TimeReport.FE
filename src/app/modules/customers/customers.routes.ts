import { Routes } from '@angular/router';
import { ListCustomersPage } from './pages/list-customers/list-customers.page';
import { ManageCustomerPage } from './pages/manage-customer/manage-customer.page';

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
