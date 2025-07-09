import { Component } from '@angular/core';
import { RolesListComponent } from "../../components/roles-list/roles-list.component";
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-list-roles',
  standalone: true,
  imports: [
    MatCardModule,
    RolesListComponent
  ],
  templateUrl: './list-roles.page.html',
  styleUrl: './list-roles.page.scss'
})
export class ListRolesPage {

}
