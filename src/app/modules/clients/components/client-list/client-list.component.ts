import { MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { Component, inject, Injectable, OnInit, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Client, ClientWithIDandPerson, ClientWithPerson } from '../../interfaces/client.interface';
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
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

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
    MatPaginatorModule,
    MatTooltipModule,
    ReactiveFormsModule
  ],
  providers: [
    {provide: MatPaginatorIntl, useClass: CustomerPaginatorIntl}
  ]
})
export class ClientListComponent implements OnInit{

  private clientService = inject(ClientService);
  readonly dialog = inject(MatDialog);
  readonly snackBar = inject(MatSnackBar);

  displayedColumns: string[] = ['idtype', 'idnumber', 'commercialname', 'companyname', 'phone', 'email', 'status', 'options'];

  selection = new SelectionModel<any>(true, []);

  customers: Client[] = [];

  dataSource: MatTableDataSource<Client> = new MatTableDataSource<Client>([]);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  searchControl = new FormControl('');

  editingCustomer: any = null;

  isLoading = true;
  errorMessage = '';

  totalItems: number = 0;
  pageSize: number = 10;
  currentPage: number = 0;
  currentSearch: string = '';

  ngOnInit(): void {
    this.loadClients(this.currentPage + 1, this.pageSize, this.currentSearch);

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      this.currentSearch = value || ''; // Update the search string
      this.currentPage = 0;             // Reset internal 0-based page index to 0
      this.paginator.firstPage();       // Reset MatPaginator to first page (pageIndex becomes 0)

      this.loadClients(this.currentPage + 1, this.pageSize, this.currentSearch);
    });
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

  loadClients(pageNumber: number = 1, pageSize: number = 10, search: string = ''): void {
    this.clientService.getClients(pageNumber, pageSize, search).subscribe({
      next: (response) => {
        if (response?.items) {
            this.dataSource = new MatTableDataSource<Client>(response.items);
            this.totalItems = response.totalItems;
            this.pageSize = response.pageSize;
            this.currentPage = response.pageNumber - 1;

            if (this.paginator) {
              this.paginator.length = this.totalItems;
              this.paginator.pageSize = this.pageSize;
              this.paginator.pageIndex = this.currentPage;
            }
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

  onPageChange(event: PageEvent): void {
      this.pageSize = event.pageSize;
      this.currentPage = event.pageIndex + 1;
      // Pasa el valor de búsqueda actual al cargar los empleados
      this.loadClients(this.currentPage, this.pageSize, this.currentSearch);
    }

  ngAfterViewInit(){
    if (this.paginator || this.sort){
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
    }
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(ClientModalComponent, {
      width: '600px',
      disableClose: true,
      data: { customer: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (result.type === 'withPerson') {
          this.clientService.createClientWithPerson(result.data).subscribe({
            next: () => {
              this.snackBar.open("Cliente creado con éxito", "Cerrar", {duration: 5000});
              this.loadClients();
            },
            error: (err) => {
              this.snackBar.open("Error al crear cliente: " + err.message, "Cerrar", {duration: 5000});
            }
          });
        } else if (result.type === 'withPersonID') {
          this.clientService.createClientWithPersonID(result.data).subscribe({
            next: () => {
              this.snackBar.open("Cliente creado con éxito", "Cerrar", {duration: 5000});
              this.loadClients();
            },
            error: (err) => {
              this.snackBar.open("Error al crear cliente: " + err.message, "Cerrar", {duration: 5000});
            }
          });
        }
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

  openEditDialog(client: Client): void {
    const dialogRef = this.dialog.open(ClientModalComponent, {
      width: '800px',
      disableClose: true,
      data: {
        customer: client,
        isEdit: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.snackBar.open('Cliente actualizado con éxito', 'Cerrar', { duration: 5000 });
        this.loadClients(); // Recargar la lista
      }
    });
  }

  toggleClientStatus(client: ClientWithIDandPerson): void {
    const confirmationMessage = client.status
      ? '¿Estás seguro de que deseas desactivar este cliente?'
      : '¿Estás seguro de que deseas activar este cliente?';

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: { message: confirmationMessage }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) { // If user clicked 'Sí'
        if (client.status) {
          // Logic to deactivate
          this.clientService.inactivateClient(client.id, {
            status: false // Make sure the status is correctly set for inactivation
          }).subscribe({
            next: () => {
              this.snackBar.open('Cliente desactivado con éxito', 'Cerrar', { duration: 3000 });
              this.loadClients(); // Reload the list
            },
            error: (err) => {
              this.snackBar.open('Error al desactivar cliente', 'Cerrar', { duration: 3000 });
              console.error('Error al desactivar cliente:', err); // Log the actual error
            }
          });
        } else {
          // Logic to activate
          this.clientService.activateClient(client.id, {
            status: true // Make sure the status is correctly set for activation
          }).subscribe({
            next: () => {
              this.snackBar.open('Cliente activado con éxito', 'Cerrar', { duration: 3000 });
              this.loadClients(); // Reload the list
            },
            error: (err) => {
              this.snackBar.open('Error al activar cliente', 'Cerrar', { duration: 3000 });
              console.error('Error al activar cliente:', err); // Log the actual error
            }
          });
        }
      } else {
        // User cancelled the action
        this.snackBar.open('Acción cancelada', 'Cerrar', { duration: 2000 });
      }
    });
  }
}
