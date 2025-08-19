// user-create-dialog.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Role } from '../../../auth/interfaces/auth.interface';
import { Employee } from '../../../employees/interfaces/employee.interface';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { EmployeeService } from '../../../employees/services/employee.service';

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
    MatIconModule
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

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
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
        this.searchTerm = searchTerm;
        this.currentPage = 1;
        return this.employeeService.getEmployees(this.currentPage, this.pageSize, searchTerm);
      })
    ).subscribe(response => {
      this.employees = response.items;
      this.totalEmployees = response.totalItems;
    });
  }

  updateCorporateEmail(employeeId: number): void {
    const selectedEmployee = this.employees.find(emp => emp.id === employeeId);
    const corporateEmail = selectedEmployee?.corporateEmail || '';
    this.userForm.get('corporateEmail')?.setValue(corporateEmail);
  }

  loadEmployees(): void {
    this.employeeService.getEmployees(this.currentPage, this.pageSize, this.searchTerm)
      .subscribe(response => {
        this.employees = response.items;
        this.totalEmployees = response.totalItems;
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

  displayEmployee(employee: Employee): string {
    return employee ? `${employee.person.firstName} ${employee.person.lastName} - ${employee.person.identificationNumber}` : '';
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.dialogRef.close(this.userForm.value);
    }
  }
}
