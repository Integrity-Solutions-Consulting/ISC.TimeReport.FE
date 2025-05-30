import { Component } from '@angular/core';
import { CustomerFormComponent } from '../../components/customer-form/customer-form.component';

@Component({
  selector: 'manage-customer',
  standalone: true,
  imports: [
    CustomerFormComponent,

],
  templateUrl: './manage-customer.page.html',
  styleUrl: './manage-customer.page.scss'
})
export class ManageCustomerPage {
}
