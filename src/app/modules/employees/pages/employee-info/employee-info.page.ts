import { Component } from '@angular/core';
import { EmployeeDetailsComponent } from "../../components/employee-details/employee-details.component";

@Component({
  selector: 'app-employee-info',
  standalone: true,
  imports: [EmployeeDetailsComponent],
  templateUrl: './employee-info.page.html',
  styleUrl: './employee-info.page.scss'
})
export class EmployeeInfoPage {

}
