import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, Injectable, ViewChild } from '@angular/core';
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
import { ActivatedRoute, Router } from '@angular/router';
import { MatNativeDateModule, provideNativeDateAdapter, DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter, MomentDateModule } from '@angular/material-moment-adapter';
import { MatMenuModule } from '@angular/material/menu';
import Fuse, { IFuseOptions } from 'fuse.js';

export const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'dd/MM/yyyy',
    monthYearLabel: 'MMMM yyyy',
    dateA11yLabel: 'dd/MM/yyyy',
    monthYearA11yLabel: 'MMMM yyyy'
  },
};

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
    MatMenuModule,
    MatSortModule,
    MatPaginatorModule,
    MatTooltipModule,
    ReactiveFormsModule
  ],
  providers: [
    {provide: MatPaginatorIntl, useClass: EmployeePaginatorIntl},
  ],
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.scss'
})
export class EmployeeListComponent implements AfterViewInit {

  private employeeService = inject(EmployeeService);
  readonly snackBar = inject(MatSnackBar);

  constructor(
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  employees: Employee[] = [];

  ngAfterViewInit() {
    // Esto asegura que el sort se asigne cuando la vista esté lista
    this.dataSource.sort = this.sort;
  }

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

  positionsMap: {[key: number]: string} = {};

  totalItems: number = 0;
  pageSize: number = 10;
  currentPage: number = 0;
  currentSearch: string = '';

  private fuse!: Fuse<Employee>;
  private allEmployees: Employee[] = [];
  public useClientSideSearch: boolean = false;

  private fuseOptions: IFuseOptions<Employee> = {
    keys: [
      // Nested paths for person properties
      'person.firstName',
      'person.lastName',
      'person.identificationNumber',
      'person.email',
      // Direct property
      'positionID'
    ],
    threshold: 0.3, // Lower threshold for more matches
    includeScore: false, // Not strictly needed for display
    minMatchCharLength: 2,
    shouldSort: true, // Let Fuse sort the results by relevance
    findAllMatches: true
  };

  ngOnInit(): void {
    this.loadPositions();
    // Initial load. If client search is active, it will load all.
    // Since it's false by default, it will load the first page.
    if (this.useClientSideSearch) {
      this.loadAllEmployeesForClientSearch(false);
    } else {
      this.loadEmployees(this.currentPage + 1, this.pageSize, this.currentSearch);
    }

    // Listen to search input changes
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      this.currentSearch = value || '';
      this.currentPage = 0; // Reset to first page on new search
      if (this.paginator) {
        this.paginator.firstPage();
      }

      if (this.useClientSideSearch) {
        // Usar búsqueda en cliente con Fuse.js
        this.applyClientSideSearch(this.currentSearch);
      } else {
        // Usar búsqueda en servidor (comportamiento actual)
        this.loadEmployees(this.currentPage + 1, this.pageSize, this.currentSearch);
      }
    });
  }

  loadEmployees(pageNumber: number = 1, pageSize: number = 10, search: string = ''): void {
    // Check if client-side search is active and all employees are loaded,
    // if so, use client-side search instead.
    if (this.useClientSideSearch && this.allEmployees.length > 0) {
      this.applyClientSideSearch(this.currentSearch);
      return;
    }

    this.employeeService.getEmployees(pageNumber, pageSize, search).subscribe({
      next: (response) => {
        if (response?.items) {
          const employees = response.items;

          this.dataSource.data = employees;
          this.totalItems = response.totalItems;
          this.pageSize = response.pageSize;
          this.currentPage = response.pageNumber - 1;

          this.setupSortingAndPagination();

        } else {
          console.error('La respuesta del API no tiene la estructura esperada:', response);
          this.dataSource.data = [];
        }
      },
      error: (err) => {
        console.error('Error al cargar empleados:', err);
        this.dataSource.data = [];
      }
    });
  }

  private setupSortingAndPagination(): void {
    setTimeout(() => {
      // Apply sorting logic for complex fields
      this.dataSource.sort = this.sort;
      this.dataSource.sortingDataAccessor = (data: any, sortHeaderId: string) => {
        if (sortHeaderId === 'position') {
          return this.getPositionName(data.positionID);
        }
        if (sortHeaderId === 'idtype') {
          return this.getIdentificationTypeName(data.person.identificationTypeId);
        }
        if (sortHeaderId === 'firstname') return data.person.firstName;
        if (sortHeaderId === 'lastname') return data.person.lastName;
        if (sortHeaderId === 'email') return data.person.email;
        if (sortHeaderId === 'idnumber') return data.person.identificationNumber;
        // Default access for simple properties
        return data[sortHeaderId];
      };

      // Update paginator values only when using server-side search or after a client-side search updates totalItems
      if (!this.useClientSideSearch || this.currentSearch === '') {
        if (this.paginator) {
          this.paginator.length = this.totalItems;
          this.paginator.pageSize = this.pageSize;
          this.paginator.pageIndex = this.currentPage;
        }
      }
    }, 0);
  }

  loadPositions(): void {
    this.employeeService.getPositions().subscribe({
      next: (positions) => {
        // Convertir el array de cargos a un mapa {id: nombre}
        this.positionsMap = positions.reduce((acc, position) => {
          acc[position.id] = position.name;
          return acc;
        }, {} as {[key: number]: string});
      },
      error: (err) => {
        console.error('Error al cargar cargos:', err);
        this.positionsMap = {}; // Mapa vacío si hay error
      }
    });
  }

  private applyClientSideSearch(searchTerm: string): void {
    if (!searchTerm.trim()) {
      // If no search term, show all loaded employees with pagination
      this.updateDataSourceWithPagination(this.allEmployees);
      return;
    }

    if (!this.fuse) {
      console.warn('Fuse instance not initialized. Loading employees first.');
      // If for some reason fuse wasn't initialized, try to load all now.
      this.loadAllEmployeesForClientSearch(true);
      return;
    }

    // Perform search with Fuse.js
    const searchResults = this.fuse.search(searchTerm);
    const filteredEmployees = searchResults.map(result => result.item);

    this.updateDataSourceWithPagination(filteredEmployees);
  }

  private updateDataSourceWithPagination(employees: Employee[]): void {
    this.totalItems = employees.length;

    // Check and adjust pageIndex if it's out of bounds after filtering
    const maxPageIndex = Math.max(0, Math.ceil(this.totalItems / this.pageSize) - 1);
    this.currentPage = Math.min(this.currentPage, maxPageIndex);

    const startIndex = this.currentPage * this.pageSize;
    const paginatedEmployees = employees.slice(startIndex, startIndex + this.pageSize);

    this.dataSource.data = paginatedEmployees;

    // Update the paginator's total length and page index
    if (this.paginator) {
      this.paginator.length = this.totalItems;
      this.paginator.pageIndex = this.currentPage;
    }

    // Re-apply sorting on the new data slice
    this.setupSortingAndPagination();
  }

  loadAllEmployeesForClientSearch(applyCurrentSearch: boolean = false): void {
    // Use a very large number for pageSize to fetch all data.
    // In a real application, you'd likely use a dedicated endpoint or carefully limit this.
    this.employeeService.getEmployees(1, 10000, '').subscribe({
      next: (response) => {
        if (response?.items) {
          this.allEmployees = response.items;
          // Initialize Fuse with the complete dataset
          this.fuse = new Fuse(this.allEmployees, this.fuseOptions);
          this.useClientSideSearch = true; // Activate client search mode

          if (applyCurrentSearch && this.currentSearch) {
            this.applyClientSideSearch(this.currentSearch);
          } else {
            // Initial display of the first page of all loaded data
            this.updateDataSourceWithPagination(this.allEmployees);
          }
        }
      },
      error: (err) => {
        console.error('Error al cargar todos los empleados:', err);
        this.snackBar.open('Error al cargar datos para búsqueda mejorada', 'Cerrar', { duration: 5000 });
        this.useClientSideSearch = false; // Fallback to server search
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

  // Función auxiliar para extraer el mensaje de error del response
  private extractErrorMessage(error: any): string {
    // Si el error tiene la estructura específica con Message en el primer nivel
    if (error.error && error.error.Message) {
      return error.error.Message;
    }
    // Si el error tiene la estructura con error en array
    else if (error.error && Array.isArray(error.error.Error) && error.error.Error.length > 0) {
      return error.error.Error[0].Message || 'Error desconocido';
    }
    // Si es un error estándar
    else if (error.message) {
      return error.message;
    }
    // Si el error es directamente un string
    else if (typeof error === 'string') {
      return error;
    }
    // Por defecto
    return 'Ha ocurrido un error inesperado';
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
              const errorMessage = this.extractErrorMessage(err);
              this.snackBar.open(errorMessage, "Cerrar", {duration: 5000});
            }
          });
        } else if (result.type === 'withPersonID') {
          this.employeeService.createEmployeeWithPersonID(result.data).subscribe({
            next: () => {
              this.snackBar.open("Cliente creado con éxito", "Cerrar", {duration: 5000});
              this.loadEmployees();
            },
            error: (err) => {
              const errorMessage = this.extractErrorMessage(err);
              this.snackBar.open(errorMessage, "Cerrar", {duration: 5000});
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

  toggleSearchMode(): void {
    this.useClientSideSearch = !this.useClientSideSearch;
   
    this.currentPage = 0;
    if (this.paginator) {
      this.paginator.firstPage();
    }

    if (this.useClientSideSearch && this.allEmployees.length === 0) {
      // If switching to client-side and data is not loaded, load it.
      this.loadAllEmployeesForClientSearch(true); // Re-apply search after load
    } else {
      // Use server-side: re-load first page with current search term
      this.loadEmployees(1, this.pageSize, this.currentSearch);
    }
   
    this.snackBar.open(
      `Búsqueda ${this.useClientSideSearch ? 'mejorada (cliente)' : 'estándar (servidor)'} activada`,
      'Cerrar',
      { duration: 3000 }
    );
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
              const errorMessage = this.extractErrorMessage(err);
              this.snackBar.open(errorMessage, 'Cerrar', { duration: 5000 });
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
              const errorMessage = this.extractErrorMessage(err);
              this.snackBar.open(errorMessage, 'Cerrar', { duration: 5000 });
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

  viewEmployeeDetails(projectId: number): void {
    this.router.navigate([projectId], { relativeTo: this.route });
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.selection.select(...this.dataSource.data);
  }
}
