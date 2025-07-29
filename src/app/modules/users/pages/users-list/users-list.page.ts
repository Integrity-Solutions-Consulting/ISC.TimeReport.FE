import { Component } from '@angular/core';
import { UsersComponent } from "../../components/users.component";
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    UsersComponent,
    MatCardModule
  ],
  templateUrl: './users-list.page.html',
  styleUrl: './users-list.page.scss'
})
export class UsersListPage {

}
