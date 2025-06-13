import { Routes } from '@angular/router';
import { EmployeeManagePage } from './pages/employee-manage/employee-manage.page';
import { ListEmployeePage } from './pages/list-employee/list-employee.page';

export const employeesRoutes: Routes = [
  {
    path: '',
    component: ListEmployeePage
  },
  {
    path: 'manage',
    component: EmployeeManagePage
  },

]
