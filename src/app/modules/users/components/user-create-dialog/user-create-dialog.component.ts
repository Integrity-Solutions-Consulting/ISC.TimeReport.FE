// user-create-dialog.component.ts
import { Component, Inject, OnDestroy, OnInit } from '@angular/core'; // Añadido OnDestroy
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms'; // Añadido FormControl
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { Role } from '../../../auth/interfaces/auth.interface';
import { Employee } from '../../../employees/interfaces/employee.interface';
import { debounceTime, distinctUntilChanged, Subject, switchMap, finalize, ReplaySubject, takeUntil } from 'rxjs'; // Añadido ReplaySubject, takeUntil
import { EmployeeService } from '../../../employees/services/employee.service';
import { UserService } from '../../services/user.service';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search'; // Añadido

@Component({
  selector: 'app-user-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    NgxMatSelectSearchModule // Añadido
  ],
  templateUrl: './user-create-dialog.component.html',
  styleUrls: ['./user-create-dialog.component.scss']
})
export class UserCreateDialogComponent implements OnInit, OnDestroy { // Implementado OnDestroy
  userForm: FormGroup;
  roles: Role[] = [];
  employees: Employee[] = [];
  totalEmployees = 0;
  currentPage = 1;
  pageSize = 500;
  searchTerm = '';
  searchSubject = new Subject<string>();
  selectedEmployeeEmail: string = '';
  loading = false;
  loadingEmployees = false;

  // Para ngx-mat-select-search
  public employeeFilterCtrl: FormControl<string | null> = new FormControl<string>('');
  public filteredEmployees: ReplaySubject<Employee[]> = new ReplaySubject<Employee[]>(1);
  protected _onDestroy = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private userService: UserService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<UserCreateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { roles: Role[] }
  ) {
    this.roles = data.roles;

    this.userForm = this.fb.group({
      employeeID: ['', Validators.required],
      corporateEmail: [{ value: '', disabled: true }],
      username: ['', Validators.required],
      isActive: [true],
      rolesID: [[], Validators.required]
    });

    this.userForm.get('employeeID')?.valueChanges.subscribe(employeeId => {
      this.updateCorporateEmail(employeeId);
    });
  }

  ngOnInit(): void {
    this.loadEmployees();
    this.setupEmployeeFilter();

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(searchTerm => {
        this.loadingEmployees = true;
        this.searchTerm = searchTerm;
        this.currentPage = 1;
        return this.employeeService.getEmployees(this.currentPage, this.pageSize, searchTerm)
          .pipe(finalize(() => this.loadingEmployees = false));
      })
    ).subscribe({
      next: (response) => {
        this.employees = response.items;
        this.totalEmployees = response.totalItems;
        this.filterEmployees(); // Actualizar filtro después de cargar empleados
      },
      error: (error) => {
        console.error('Error al buscar empleados:', error);
        this.showSnackbar('Error al buscar empleados', 'error');
      }
    });
  }

  ngOnDestroy(): void {
    this._onDestroy.next();
    this._onDestroy.complete();
    this.searchSubject.complete();
  }

  /**
   * Configura el filtro para empleados usando ngx-mat-select-search
   */
  private setupEmployeeFilter(): void {
    // Cargar set inicial
    this.filteredEmployees.next(this.employees.slice());

    // Escuchar cambios en el filtro
    this.employeeFilterCtrl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterEmployees();
      });
  }

  /**
   * Filtra los empleados basado en la consulta
   */
  private filterEmployees(): void {
    if (!this.employees) {
      return;
    }

    // Obtener la palabra clave de búsqueda
    let searchTerm = this.employeeFilterCtrl.value || '';
    if (typeof searchTerm === 'string') {
      searchTerm = searchTerm.toLowerCase();
    } else {
      searchTerm = '';
    }

    // Filtrar empleados
    const filteredEmployees = this.employees.filter(employee => {
      const firstName = (employee.person?.firstName || '').toLowerCase();
      const lastName = (employee.person?.lastName || '').toLowerCase();
      const identificationNumber = (employee.person?.identificationNumber || '').toLowerCase();
      return firstName.includes(searchTerm) ||
             lastName.includes(searchTerm) ||
             identificationNumber.includes(searchTerm);
    });

    this.filteredEmployees.next(filteredEmployees);
  }

  updateCorporateEmail(employeeId: number): void {
    const selectedEmployee = this.employees.find(emp => emp.id === employeeId);
    const corporateEmail = selectedEmployee?.corporateEmail || '';
    this.userForm.get('corporateEmail')?.setValue(corporateEmail);
  }

  loadEmployees(): void {
    this.loadingEmployees = true;
    this.employeeService.getEmployees(this.currentPage, this.pageSize, this.searchTerm)
      .pipe(finalize(() => this.loadingEmployees = false))
      .subscribe({
        next: (response) => {
          this.employees = response.items;
          this.totalEmployees = response.totalItems;
          this.filteredEmployees.next(this.employees.slice()); // Inicializar filtro
        },
        error: (error) => {
          console.error('Error al cargar empleados:', error);
          this.showSnackbar('Error al cargar empleados', 'error');
        }
      });
  }

  onSearchChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.searchSubject.next(inputElement.value);
  }

  onScroll(): void {
    if (this.employees.length < this.totalEmployees) {
      this.currentPage++;
      this.employeeService.getEmployees(this.currentPage, this.pageSize, this.searchTerm)
        .subscribe(response => {
          this.employees = [...this.employees, ...response.items];
          this.filteredEmployees.next(this.employees.slice()); // Actualizar filtro
        });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.loading = true;
      const userData = this.userForm.getRawValue();

      this.userService.createUser(userData)
        .pipe(finalize(() => this.loading = false))
        .subscribe({
          next: (response) => {
            this.showSnackbar('Usuario creado exitosamente', 'success');
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Error al crear usuario:', error);

            // Extraer el mensaje de error de la respuesta del backend
            let errorMessage = 'Error al crear usuario';

            if (error.error?.Message) {
              // Si el backend devuelve un mensaje directo
              errorMessage = error.error.Message;
            } else if (error.error?.error?.[0]?.Message) {
              // Si el mensaje está dentro del array Error
              errorMessage = error.error.error[0].Message;
            } else if (error.error?.message) {
              // Formato alternativo
              errorMessage = error.error.message;
            } else if (error.message) {
              // Mensaje de error genérico de HTTP
              errorMessage = error.message;
            }

            this.showSnackbar(errorMessage, 'error');
          }
        });
    }
  }

  private showSnackbar(message: string, type: 'success' | 'error' = 'success'): void {
    const duration = type === 'error' ? 8000 : 5000;
    this.snackBar.open(message, 'Cerrar', {
      duration: duration,
      panelClass: type === 'success' ? ['success-snackbar'] : ['error-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
}
