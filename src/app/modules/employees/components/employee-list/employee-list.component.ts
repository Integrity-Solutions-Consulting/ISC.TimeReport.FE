import { CommonModule } from '@angular/common';
import { Component, inject, Injectable, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Employee, EmployeeWithIDandPerson } from '../../interfaces/employee.interface';
import { EmployeeService } from '../../services/employee.service';
import { SelectionModel } from '@angular/cdk/collections';
import { Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { EmployeeDialogComponent } from '../employee-dialog/employee-dialog.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';

@Injectable()
export class EmployeePaginatorIntl implements MatPaginatorIntl {
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
  selector: 'employee-list',
  standalone: true,
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
    {provide: MatPaginatorIntl, useClass: EmployeePaginatorIntl}
  ],
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.scss'
})
export class EmployeeListComponent {

  private employeeService = inject(EmployeeService);
  readonly snackBar = inject(MatSnackBar);

  constructor(private dialog: MatDialog) {}

  employees: Employee[] = [];

  displayedColumns: string[] = ['idtype', 'idnumber', 'firstname', 'lastname', 'email', 'position', 'status', 'options'];

  selection = new SelectionModel<any>(true, []);

  dataSource: MatTableDataSource<Employee> = new MatTableDataSource<Employee>();

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  searchControl = new FormControl('');

  readonly identificationTypesMap: {[key: number]: string} = {
    1: 'Cédula',
    2: 'RUC',
    3: 'Pasaporte',
  };

  readonly positionsMap: {[key: number]: string} = {
    1: '	Gerente General',
    2: '	Asistente General',
    3: '	Jefa Administrativa',
    4: '	Asistente Administrativa',
    5: '	Asistente Contable',
    6: '	Pasante Contable',
    7: '	Coordinadora de Talento Humano',
    8: '	Asistente de Talento Humano',
    9: '	Gerente de Proyecto y Producto',
    10: '	Líder Software',
    11: '	Tester QA',
    12: '	Desarrollador Fullstack',
    13: '	Desarrollador Fullstack/Senior',
    14: '	Desarrollador Fullstack/Semi Senior',
    15: '	Desarrollador Cobol',
    16: '	Arquitectura',
    17: '	Analista QA',
    18: '	Ingeniero de Soluciones',
    19: '	Ingeniero de Procesos',
    20: '	Asistente Administrativo',
    21: '	Ingeniero de Seguridad de la Información',
    22: '	Ingeniero DBA',
    23: '	Arquitecto de Cyber Seguridad',
    24: '	Analista en Middleware',
    25: '	Desarrollador PHP',
    26: '	Pasante QA',
    27: '	Pasante de DevOps',
    28: '	Pasante de Desarrollo',
    29: '	Pasante DBA',
    30: '	Pasante Contable',
    31: '	Líder de Seguridad e Informática',
    32: '	Ingeniero en Soporte Técnico Semi Senior',
    33: '	Analista de Auditoria y Seguridad e Informática/Junior',
    34: '	Pasante de Soporte Técnico/Auditoria',
    35: '	Ingeniero de Procesos Senior',
    36: '	Ingeniero de Procesos Junior',
    37: '	Gerente Comercial',
    38: '	Asistente de Marketing',
    39: '	Ejecutivo Comercial',
    40: '	Asistente Comercial',
  };

  totalItems: number = 0;
  pageSize: number = 10;
  currentPage: number = 0;
  currentSearch: string = '';

  ngOnInit(): void {
    this.loadEmployees(this.currentPage + 1, this.pageSize, this.currentSearch);;

    // Suscribirse a los cambios del campo de búsqueda con debounce
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      this.currentSearch = value || ''; // Update the search string
      this.currentPage = 0;             // Reset internal 0-based page index to 0
      this.paginator.firstPage();       // Reset MatPaginator to first page (pageIndex becomes 0)
      // Calls loadEmployees, passing (0 + 1) = 1 as the page number for the backend
      this.loadEmployees(this.currentPage + 1, this.pageSize, this.currentSearch);
    });
  }

  loadEmployees(pageNumber: number = 1, pageSize: number = 10, search: string = ''): void {
    this.employeeService.getEmployees(pageNumber, pageSize, search).subscribe({
      next: (response) => {
        if (response?.items) {
          this.dataSource = new MatTableDataSource<Employee>(response.items);
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
          this.dataSource = new MatTableDataSource<Employee>([]); // Tabla vacía como fallback
        }
      },
      error: (err) => {
        console.error('Error al cargar empleados:', err);
        this.dataSource = new MatTableDataSource<Employee>([]); // Tabla vacía en caso de error
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex + 1;
    // Pasa el valor de búsqueda actual al cargar los empleados
    this.loadEmployees(this.currentPage, this.pageSize, this.currentSearch);
  }

  getIdentificationTypeName(idtype: number): string {
    return this.identificationTypesMap[idtype] || 'Desconocido';
  }

  getPositionName(position: number): string {
    return this.positionsMap[position] || 'Desconocido';
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(EmployeeDialogComponent, {
      width: '800px',
      disableClose: true,
      data: { employee: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (result.type === 'withPerson') {
          this.employeeService.createEmployeeWithPerson(result.data).subscribe({
            next: () => {
              this.snackBar.open("Empleado creado con éxito", "Cerrar", {duration: 5000});
              this.loadEmployees();
            },
            error: (err) => {
              this.snackBar.open("Error al crear empleado: " + err.message, "Cerrar", {duration: 5000});
            }
          });
        } else if (result.type === 'withPersonID') {
          this.employeeService.createEmployeeWithPersonID(result.data).subscribe({
            next: () => {
              this.snackBar.open("Cliente creado con éxito", "Cerrar", {duration: 5000});
              this.loadEmployees();
            },
            error: (err) => {
              this.snackBar.open("Error al crear cliente: " + err.message, "Cerrar", {duration: 5000});
            }
          });
        }
      }
    });
  }

  openEditDialog(employee: Employee): void {
    const dialogRef = this.dialog.open(EmployeeDialogComponent, {
      width: '800px',
      disableClose: true,
      data: {
        employee: employee,
        isEdit: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.snackBar.open('Empleado actualizado con éxito', 'Cerrar', { duration: 5000 });
        this.loadEmployees(); // Recargar la lista
      }
    });
  }

  toggleEmployeeStatus(employee: EmployeeWithIDandPerson): void {
    const confirmationMessage = employee.status
      ? '¿Estás seguro de que deseas desactivar este empleado?'
      : '¿Estás seguro de que deseas activar este empleado?';

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '600px',
      data: { message: confirmationMessage }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) { // If user clicked 'Sí'
        if (employee.status) {
          // Logic to deactivate
          this.employeeService.inactivateEmployee(employee.id, {}).subscribe({ // Empty object as second argument assumes API only needs ID
            next: () => {
              this.snackBar.open('Empleado desactivado con éxito', 'Cerrar', { duration: 3000 });
              this.loadEmployees(); // Reload the list
            },
            error: (err) => {
              this.snackBar.open('Error al desactivar empleado', 'Cerrar', { duration: 3000 });
              console.error('Error inactivating employee:', err); // Log the actual error
            }
          });
        } else {
          // Logic to activate
          this.employeeService.activateEmployee(employee.id, {}).subscribe({ // Empty object as second argument assumes API only needs ID
            next: () => {
              this.snackBar.open('Empleado activado con éxito', 'Cerrar', { duration: 3000 });
              this.loadEmployees(); // Reload the list
            },
            error: (err) => {
              this.snackBar.open('Error al activar empleado', 'Cerrar', { duration: 3000 });
              console.error('Error activating employee:', err); // Log the actual error
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
