import { Component, inject, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Customer } from '../../interfaces/customer.interface';
import { CustomerService } from '../../services/customer.service';

@Component({
  selector: 'customer-list',
  standalone: true,
  templateUrl: './customer-list.component.html',
  styleUrl: './customer-list.component.scss',
  imports: [
    MatCardModule
  ]
})
export class CustomerListComponent implements OnInit{
  private _customerService = inject(CustomerService);

  ngOnInit(): void {
    this._customerService.getCustomers().subscribe({
      next: (res) => {
        this.customers = res.data;
      },
      error:(err)=>{
      }
    });
  }
  
  customers: Customer[] = [
    {
      id:1,
      name:'Banco Guayaquil',
      phone:'999999999',
      email:'info@bancoguayaquil.com'
    },
    {
      id:2,
      name:'Banco Bolivariano',
      phone:'999999999',
      email:'info@bolivariano.com'
    }];
}
