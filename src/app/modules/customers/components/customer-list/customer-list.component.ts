import { Component, inject, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { Customer } from '../../interfaces/customer.interface';
import { CustomerService } from '../../services/customer.service';

@Component({
  selector: 'customer-list',
  standalone: true,
  templateUrl: './customer-list.component.html',
  styleUrl: './customer-list.component.scss',
  imports: [
    MatCardModule,
    MatTableModule
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

  getIdentificationTypeName(idtype: number): string {
      switch(idtype) {
        case 1: return 'Cédula';
        case 2: return 'RUC';
        case 3: return 'Pasaporte';
        default: return 'Desconocido';
      }
  }

  displayedColumns: string[] = ['id', 'idtype', 'idnumber', 'commercialname', 'companyname', 'phone', 'email'];

  customers: Customer[] = [
    {
      id:1,
      idtype: 2,
      idnumber: '999999999001',
      commercialname:'Banco Guayaquil',
      companyname: 'Banco Guayaquil',
      phone:'999999999',
      email:'info@bancoguayaquil.com'
    },
    {
      id:2,
      idtype: 2,
      idnumber: '999999999001',
      commercialname:'Banco Pichincha',
      companyname: 'Banco Pichincha',
      phone:'999999999',
      email:'info@bancopichincha.com'
    },
    {
      id:3,
      idtype: 1,
      idnumber: '999999999001',
      commercialname:'Banco Bolivariano',
      companyname: 'Banco Bolivariano',
      phone:'999999999',
      email:'info@bancobolivariano.com'
    },
    {
      id:4,
      idtype: 3,
      idnumber: '999999999001',
      commercialname:'Banco Pacífico',
      companyname: 'Banco Pacífico',
      phone:'999999999',
      email:'info@bancopacifico.com'
    }
  ];

}
