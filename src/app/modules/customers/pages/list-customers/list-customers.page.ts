import { Component } from '@angular/core';
import { Customer } from '../../interfaces/customer.interface';
import { CustomerListComponent } from '../../components/customer-list/customer-list.component';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'list-customers',
  standalone: true,
  imports:[
    CustomerListComponent,
    MatCardModule
  ],
  templateUrl: './list-customers.page.html',
  styleUrl: './list-customers.page.scss'
})
export class ListCustomersPage {

}
