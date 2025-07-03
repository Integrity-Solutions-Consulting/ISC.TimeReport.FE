import { Component } from '@angular/core';
import { AssigmentsListComponent } from "../../components/assigments-list/assigments-list.component";
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-list-assignment',
  standalone: true,
  imports: [
    AssigmentsListComponent,
    MatCardModule
],
  templateUrl: './list-assignment.page.html',
  styleUrl: './list-assignment.page.scss'
})
export class ListAssignmentPage {

}
