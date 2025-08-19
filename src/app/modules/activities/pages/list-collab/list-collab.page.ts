import { Component } from '@angular/core';
import { CollaboratorsListComponent } from "../../components/collaborators-list/collaborators-list.component";
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-list-collab',
  standalone: true,
  imports: [
    CollaboratorsListComponent,
    MatCardModule,
  ],
  templateUrl: './list-collab.page.html',
  styleUrl: './list-collab.page.scss'
})
export class ListCollabPage {

}
