import { Component } from '@angular/core';
import { ListProjectComponent } from "../../components/list-project/list-project.component";
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-list-project',
  standalone: true,
  imports: [
    ListProjectComponent,
    MatCardModule
  ],
  templateUrl: './list-project.page.html',
  styleUrl: './list-project.page.scss'
})
export class ListProjectPage {

}
