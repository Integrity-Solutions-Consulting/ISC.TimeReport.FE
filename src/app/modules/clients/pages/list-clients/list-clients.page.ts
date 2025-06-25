import { Component } from '@angular/core';
import { Client } from '../../interfaces/client.interface';
import { ClientListComponent } from '../../components/client-list/client-list.component';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'list-customers',
  standalone: true,
  imports:[
    ClientListComponent,
    MatCardModule
  ],
  templateUrl: './list-clients.page.html',
  styleUrl: './list-clients.page.scss'
})
export class ListClientsPage {

}
