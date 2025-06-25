import { MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { Component, inject, Injectable, OnInit, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Client } from '../../interfaces/client.interface';
import { ClientService } from '../../services/client.service';
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
import { ClientModalComponent } from '../client-modal/client-modal.component';
import { SuccessResponse } from '../../../../shared/interfaces/response.interface';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { Subject } from 'rxjs';

@Injectable()
export class CustomerPaginatorIntl implements MatPaginatorIntl {
  changes = new Subject<void>();

  firstPageLabel = `Primera Página`;
  itemsPerPageLabel = `Registros por Página:`;
  lastPageLabel = `Última Página`;

  nextPageLabel = 'Página Siguiente ';
  previousPageLabel = 'Página Anterior';

  getRangeLabel(page: number, pageSize: number, length: number): string {
    if (length === 0) {
      return `Página 1 de 1`;
    }
    const amountPages = Math.ceil(length / pageSize);
    return `Página ${page + 1} de ${amountPages}`;
  }
}


@Component({
  selector: 'customer-list',
  standalone: true,
  templateUrl: './client-list.component.html',
  styleUrl: './client-list.component.scss',
  imports: [
    MatCardModule,
    MatTableModule,
    MatProgressSpinnerModule,
    CommonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSortModule,
    MatPaginatorModule
  ],
  providers: [
    {provide: MatPaginatorIntl, useClass: CustomerPaginatorIntl}
  ]
})
export class ClientListComponent implements OnInit{

  private clientService = inject(ClientService);
  readonly dialog = inject(MatDialog);
  readonly snackBar = inject(MatSnackBar);

  displayedColumns: string[] = ['idtype', 'idnumber', 'commercialname', 'companyname', 'phone', 'email', 'options'];

  selection = new SelectionModel<any>(true, []);

  customers: Client[] = [];

  dataSource: MatTableDataSource<Client> = new MatTableDataSource<Client>([]);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  editingCustomer: any = null;

  isLoading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.loadClients();
  }

  readonly identificationTypesMap: {[key: string]: string} = {
    '1': 'Cédula',
    '2': 'RUC',
    '3': 'Pasaporte',
  };

  /*loadCustomers(): void {
    this.customerService.getCustomers().subscribe({
      next: (response: Client[]) => {
        this.customers = response;
        this.dataSource.data = this.customers;
      },
      error: (err) => {
        console.error('Error al cargar clientes:', err);
      }
    });
  }*/

  loadClients(): void {
    this.clientService.getClients().subscribe({
      next: (response) => {
        if (response?.items) {
          this.dataSource = new MatTableDataSource<Client>(response.items);
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
          console.log(response);
        } else {
          console.error('La respuesta del API no tiene la estructura esperada:', response);
          this.dataSource = new MatTableDataSource<Client>([]); // Tabla vacía como fallback
        }
      },
      error: (err) => {
        console.error('Error al cargar proyectos:', err);
        this.dataSource = new MatTableDataSource<Client>([]); // Tabla vacía en caso de error
      }
    });
  }

  ngAfterViewInit(){
    if (this.paginator || this.sort){
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
    }
  }


  openEditModal(customer: any): void {
    if (!customer.id) {
      console.error('El cliente no tiene ID:', customer);
      this.snackBar.open('Error: El cliente no tiene ID válido', 'Cerrar', { duration: 5000 });
      return;
    }
    const dialogRef = this.dialog.open(ClientModalComponent, {
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
        identificationTypes: [
          { value: '1', name: 'Cédula' },
          { value: '2', name: 'RUC' },
          { value: '3', name: 'Pasaporte' }
        ]
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.clientService.updateClient(result.id, result).subscribe(
          () => {
            this.loadClients();
          },
          (error) => {
            console.error('Error updating customer:', error);
          }
        );
      }
    });
  }

  getIdentificationTypeName(idtype: number): string {
    return this.identificationTypesMap[idtype] || 'Desconocido';
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.customers.length;
    return numSelected === numRows;
  }

  toggleAll() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.selection.select(...this.customers);
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(ClientModalComponent, {
      width: '500px',
      disableClose: true,
      data: { project: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.clientService.createClient(result);
        this.snackBar.open("Cliente creado con éxito", "Cerrar", {duration: 5000})
      } else {
        this.snackBar.open("Ocurrió un error", "Cerrar", {duration: 5000})
      }
    });
  }

  openEditDialog(customer: Client): void {
    const dialogRef = this.dialog.open(ClientModalComponent, {
      width: '500px',
      disableClose: true,
      data: { customer } // Pasamos el elemento a editar
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.clientService.updateClient(customer.id, result);
      }
    });
  }

}
