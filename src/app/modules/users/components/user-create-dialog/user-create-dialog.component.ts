// user-create-dialog.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { debounceTime, distinctUntilChanged, Subject, switchMap, finalize } from 'rxjs';
import { EmployeeService } from '../../../employees/services/employee.service';
import { UserService } from '../../services/user.service';

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
    MatSnackBarModule
  ],
  templateUrl: './user-create-dialog.component.html',
  styleUrls: ['./user-create-dialog.component.scss']
})
export class UserCreateDialogComponent implements OnInit {
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
      },
      error: (error) => {
        console.error('Error al buscar empleados:', error);
        this.showSnackbar('Error al buscar empleados', 'error');
      }
    });
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
            const errorMessage = error.error?.message || 'Error al crear usuario';
            this.showSnackbar(errorMessage, 'error');
          }
        });
    }
  }

  private showSnackbar(message: string, type: 'success' | 'error' = 'success'): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: type === 'success' ? ['success-snackbar'] : ['error-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }
}
