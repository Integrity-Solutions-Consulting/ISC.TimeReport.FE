import { Component, inject, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { Customer } from '../../interfaces/customer.interface';
import { CustomerService } from '../../services/customer.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomerEditModalComponent } from '../customer-edit-modal/customer-edit-modal.component';
import { SuccessResponse } from '../../../../shared/interfaces/response.interface';


@Component({
  selector: 'customer-list',
  standalone: true,
  templateUrl: './customer-list.component.html',
  styleUrl: './customer-list.component.scss',
  imports: [
    MatCardModule,
    MatTableModule,
    MatProgressSpinnerModule,
    CommonModule,
    MatIconModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
  ]
})
export class CustomerListComponent implements OnInit{

  private customerService = inject(CustomerService);
  readonly dialog = inject(MatDialog);
  readonly snackBar = inject(MatSnackBar);

  displayedColumns: string[] = ['idtype', 'idnumber', 'commercialname', 'companyname', 'phone', 'email', 'options'];

  customers: Customer[] = [];

  isLoading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.loadCustomers();
  }

  readonly identificationTypesMap: {[key: string]: string} = {
    '1': 'Cédula',
    '2': 'RUC',
    '3': 'Pasaporte',
  };

  loadCustomers(): void {
    this.customerService.getCustomers().subscribe({
      next: (response: Customer[]) => {
        console.log(response)
        this.customers = response;
        console.log(this.customers)
      },
      error: (err) => {
        console.error('Error al cargar clientes:', err);
      }
    });
    console.log(this.customers);
  }

  openEditModal(customer: any): void {
    if (!customer.id) {
      console.error('El cliente no tiene ID:', customer);
      this.snackBar.open('Error: El cliente no tiene ID válido', 'Cerrar', { duration: 5000 });
      return;
    }
    const dialogRef = this.dialog.open(CustomerEditModalComponent, {
      width: '600px',
      data: {
        customer: { id: customer.id,
        identificationType: customer.identificationType,
        identificationNumber: customer.identificationNumber,
        commercialName: customer.commercialName,
        companyName: customer.companyName,
        cellPhoneNumber: customer.cellPhoneNumber,
        email: customer.email
        },
        identificationTypes: this.identificationTypesMap
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Datos a enviar:', result);
        this.customerService.updateCustomer(result.id, result).subscribe(
          () => {
            this.loadCustomers();
          },
          (error) => {
            console.error('Error updating customer:', error);
          }
        );
      }
    });
  }

  getIdentificationTypeName(idtype: string): string {
    return this.identificationTypesMap[idtype] || 'Desconocido';
  }

}
