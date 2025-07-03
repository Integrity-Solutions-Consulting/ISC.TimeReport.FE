import { Component } from '@angular/core';
import { EmployeeListComponent } from '../../components/employee-list/employee-list.component';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-list-employee',
  standalone: true,
  imports: [
    EmployeeListComponent,
    MatCardModule
  ],
  templateUrl: './list-employee.page.html',
  styleUrl: './list-employee.page.scss'
})
export class ListEmployeePage {

}
