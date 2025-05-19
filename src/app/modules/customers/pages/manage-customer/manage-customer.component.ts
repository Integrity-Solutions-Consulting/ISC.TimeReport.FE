import { Component } from '@angular/core';
import { CustomerFormComponent } from '../../components/customer-form/customer-form.component';

@Component({
  selector: 'manage-customer',
  standalone: true,
  imports:[
    CustomerFormComponent
  ],
  templateUrl: './manage-customer.component.html',
  styleUrl: './manage-customer.component.scss'
})
export class ManageCustomerPage {
}
