import { Routes } from '@angular/router';
import { ListEmployeePage } from './pages/list-employee/list-employee.page';
import { EmployeeInfoPage } from './pages/employee-info/employee-info.page';

export const employeesRoutes: Routes = [
  {
    path: '',
    component: ListEmployeePage
  },
  {
    path: ':id',
    component: EmployeeInfoPage
  }
]
