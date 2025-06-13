import { Component } from '@angular/core';
import { EmployeeListComponent } from '../../components/employee-list/employee-list.component';

@Component({
  selector: 'app-list-employee',
  standalone: true,
  imports: [
    EmployeeListComponent
  ],
  templateUrl: './list-employee.page.html',
  styleUrl: './list-employee.page.scss'
})
export class ListEmployeePage {

}
