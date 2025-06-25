import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Employee } from '../../interfaces/employee.interface';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormField, MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';

@Component({
  selector: 'employee-dialog',
  standalone: true,
  templateUrl: './employee-dialog.component.html',
  styleUrls: ['./employee-dialog.component.scss'],
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeDialogComponent implements OnInit {
  employeeForm: FormGroup;
  isEditMode: boolean = false;

  // Datos para los selects
  types = [
    { value: 1, viewValue: 'Cédula' },
    { value: 2, viewValue: 'Pasaporte' },
    { value: 3, viewValue: 'RUC' }
  ];

  genders = [
    { value: 1, viewValue: 'Masculino' },
    { value: 2, viewValue: 'Femenino' },
    { value: 3, viewValue: 'Otro' }
  ];

  personType = [
    { value: 'natural', viewValue: 'Natural' },
    { value: 'juridica', viewValue: 'Jurídica' }
  ];

  nationalities = [
    { value: 1, viewValue: 'Ecuatoriana' },
    { value: 2, viewValue: 'Colombiana' },
    { value: 3, viewValue: 'Peruana' }
  ];

  positions = [
    { value: 1, viewValue: 'Desarrollador' },
    { value: 2, viewValue: 'Diseñador' },
    { value: 3, viewValue: 'Gerente' }
  ];

  contractTypes = [
    { value: 'indefinido', viewValue: 'Indefinido' },
    { value: 'temporal', viewValue: 'Temporal' },
    { value: 'prueba', viewValue: 'Prueba' }
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EmployeeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { employee: Employee, isEdit: boolean }
  ) {
    this.employeeForm = this.fb.group({
      identificationTypeId: ['', Validators.required],
      identificationNumber: ['', Validators.required],
      genderId: ['', Validators.required],
      personType: ['', Validators.required],
      nationalityId: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      birthDate: ['', Validators.required],
      phone: ['', Validators.required],
      positionID: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      address: ['', Validators.required],
      employeeCode: ['', Validators.required],
      contractType: ['', Validators.required],
      hireDate: ['', Validators.required],
      terminationDate: [''],
      department: ['', Validators.required],
      corporateEmail: ['', [Validators.required, Validators.email]],
      salary: ['', [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.isEditMode = this.data?.isEdit;

    if (this.isEditMode && this.data.employee) {
      this.employeeForm.patchValue(this.data.employee);
    }
  }

  onSubmit(): void {
    if (this.employeeForm.valid) {
      const employeeData = this.employeeForm.value;
      this.dialogRef.close(employeeData);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
