import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Employee, Person, PersonApiResponse } from '../../interfaces/employee.interface';
import { CommonModule, formatDate } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormField, MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { EmployeeService } from '../../services/employee.service';
import { PersonService } from '../../services/person.service';

@Component({
  selector: 'employee-dialog',
  standalone: true,
  templateUrl: './employee-dialog.component.html',
  styleUrls: ['./employee-dialog.component.scss'],
  providers: [
    provideNativeDateAdapter(),
    PersonService,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeDialogComponent implements OnInit {
  employeeForm!: FormGroup;
  isEditMode: boolean = false;
  useExistingPerson: boolean = false;
  personControl = new FormControl();
  personsList: Person[] = [];
  originalStatus: boolean = true;

  // Datos para los selects
  types = [
    { value: 1, viewValue: 'Cédula' },
    { value: 2, viewValue: 'Pasaporte' },
    { value: 3, viewValue: 'RUC' }
  ];

  genders = [
    { value: 1, viewValue: 'Masculino' },
    { value: 2, viewValue: 'Femenino' }
  ];

  personType = [
    { value: 'natural', viewValue: 'Natural' },
    { value: 'juridica', viewValue: 'Jurídica' }
  ];

  nationalities = [
    { value: 1, viewValue: 'Argentina' },
    { value: 2, viewValue: 'Bolivia' },
    { value: 3, viewValue: 'Colombia' },
    { value: 4, viewValue: 'Chile' },
    { value: 5, viewValue: 'Ecuador' },
    { value: 6, viewValue: 'Paraguay' },
    { value: 7, viewValue: 'Perú' },
    { value: 8, viewValue: 'Uruguay' },
    { value: 9, viewValue: 'Venezuela' },
  ]

  positions = [
    { value: 1, viewValue: 'Gerente General'},
    { value: 2, viewValue: 'Asistente General'},
    { value: 3, viewValue: 'Jefa Administrativa'},
    { value: 4, viewValue: 'Asistente Administrativa'},
    { value: 5, viewValue: 'Asistente Contable'},
    { value: 6, viewValue: 'Pasante Contable'},
    { value: 7, viewValue: 'Coordinadora de Talento Humano'},
    { value: 8, viewValue: 'Asistente de Talento Humano'},
    { value: 9, viewValue: 'Gerente de Proyecto y Producto'},
    { value: 10, viewValue: 'Líder Software'},
    { value: 11, viewValue: 'Tester QA'},
    { value: 12, viewValue: 'Desarrollador Fullstack'},
    { value: 13, viewValue: 'Desarrollador Fullstack/Senior'},
    { value: 14, viewValue: 'Desarrollador Fullstack/Semi Senior'},
    { value: 15, viewValue: 'Desarrollador Cobol'},
    { value: 16, viewValue: 'Arquitectura'},
    { value: 17, viewValue: 'Analista QA'},
    { value: 18, viewValue: 'Ingeniero de Soluciones'},
    { value: 19, viewValue: 'Ingeniero de Procesos'},
    { value: 20, viewValue: 'Asistente Administrativo'},
    { value: 21, viewValue: 'Ingeniero de Seguridad de la Información'},
    { value: 22, viewValue: 'Ingeniero DBA'},
    { value: 23, viewValue: 'Arquitecto de Cyber Seguridad'},
    { value: 24, viewValue: 'Analista en Middleware'},
    { value: 25, viewValue: 'Desarrollador PHP'},
    { value: 26, viewValue: 'Pasante QA'},
    { value: 27, viewValue: 'Pasante de DevOps'},
    { value: 28, viewValue: 'Pasante de Desarrollo'},
    { value: 29, viewValue: 'Pasante DBA'},
    { value: 30, viewValue: 'Pasante Contable'},
    { value: 31, viewValue: 'Líder de Seguridad e Informática'},
    { value: 32, viewValue: 'Ingeniero en Soporte Técnico Semi Senior'},
    { value: 33, viewValue: 'Analista de Auditoria y Seguridad e Informática/Junior'},
    { value: 34, viewValue: 'Pasante de Soporte Técnico/Auditoria'},
    { value: 35, viewValue: 'Ingeniero de Procesos Senior'},
    { value: 36, viewValue: 'Ingeniero de Procesos Junior'},
    { value: 37, viewValue: 'Gerente Comercial'},
    { value: 38, viewValue: 'Asistente de Marketing'},
    { value: 39, viewValue: 'Ejecutivo Comercial'},
    { value: 40, viewValue: 'Asistente Comercial'},
  ];

  contractTypes = [
    { value: true, viewValue: 'Indefinido' },
    { value: false, viewValue: 'Por Proyecto' }
  ];

  private employeeId: any;

  constructor(
    private employeeService: EmployeeService,
    private personService: PersonService,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EmployeeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { employee: Employee, isEdit: boolean }
  ) {
    const employeeData = data?.employee || {};
    this.employeeId = employeeData.id || null;
    this.isEditMode = !!employeeData.id;

    this.initializeForm(employeeData);
    this.loadPersons();
  }

  ngOnInit(): void {
    this.loadPersons();
    if (this.isEditMode && this.employeeId) {
      this.loadEmployeeData(this.employeeId);
    }
  }

  private loadEmployeeData(employeeId: number): void {
    this.employeeService.getEmployeeByID(employeeId).subscribe({
      next: (response) => {
        if (response) {
          this.patchFormValues(response);
          this.originalStatus = response.status;
        }
      },
      error: (err) => {
        console.error('Error loading client data:', err);
      }
    });
  }

  private initializeForm(employeeData: any): void {

      const hireDateValue = employeeData.hireDate
        ? formatDate(employeeData.hireDate, 'yyyy-MM-dd', 'en-US')
        : '';

      const terminationDateValue = employeeData.terminationDate
      ? formatDate(employeeData.terminationDate, 'yyyy-MM-dd', 'en-US')
      : '';

      const birthDateValue = employeeData.person?.birthDate
      ? formatDate(employeeData.person.birthDate, 'yyyy-MM-dd', 'en-US')
      : '';

      this.employeeForm = this.fb.group({
        // Controles principales
        personOption: ['new'],
        existingPerson: [null],
        positionID: [employeeData.positionID || '', Validators.required],
        employeeCode: [employeeData.employeeCode || ''],
        hireDate: [hireDateValue],
        terminationDate: [terminationDateValue],
        contractType: [employeeData.contractType || ''],
        department: [employeeData.department || ''],
        corporateEmail: [employeeData.corporateEmail || '', [Validators.required, Validators.email]],
        salary: [employeeData.salary || '', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
        // Grupo anidado para 'person'
        person: this.fb.group({
          personType: [employeeData.person?.personType || 'Natural', Validators.required],
          identificationTypeId: [employeeData.person?.identificationTypeId || 0, Validators.required],
          identificationNumber: [employeeData.person?.identificationNumber || '', Validators.required],
          firstName: [employeeData.person?.firstName || '', Validators.required],
          lastName: [employeeData.person?.lastName || '', Validators.required],
          birthDate: [birthDateValue],
          email: [employeeData.person?.email || '', [Validators.required, Validators.email]],
          phone: [employeeData.person?.phone || '', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
          address: [employeeData.person?.address || ''],
          genderId: [employeeData.person?.genderId || 0],
          nationalityId: [employeeData.person?.nationalityId || 0]
        })
      });
      this.employeeForm.get('personOption')?.valueChanges.subscribe(value => {
        this.useExistingPerson = value === 'existing';
        this.togglePersonFields();
      });
    }

  private patchFormValues(employeeData: any): void {
    // Formatea la fecha si existe
    const hireDateValue = employeeData.hireDate
      ? formatDate(employeeData.hireDate, 'yyyy-MM-dd', 'en-US')
      : '';

    const terminationDateValue = employeeData.terminationDate
      ? formatDate(employeeData.terminationDate, 'yyyy-MM-dd', 'en-US')
      : '';

    const birthDateValue = employeeData.person?.birthDate
      ? formatDate(employeeData.person.birthDate, 'yyyy-MM-dd', 'en-US')
      : '';

    this.employeeForm.patchValue({
      positionID: employeeData.positionID,
      employeeCode: employeeData.employeeCode,
      hireDate: hireDateValue,
      terminationDate: terminationDateValue,
      contractType: employeeData.contractType,
      department: employeeData.department,
      corporateEmail: employeeData.corporateEmail,
      salary: employeeData.salary,
      person: {
        personType: employeeData.person?.personType,
        identificationTypeId: employeeData.person?.identificationTypeId,
        identificationNumber: employeeData.person?.identificationNumber,
        firstName: employeeData.person?.firstName,
        lastName: employeeData.person?.lastName,
        birthDate: birthDateValue,
        email: employeeData.person?.email,
        phone: employeeData.person?.phone,
        address: employeeData.person?.address,
        genderId: employeeData.person?.genderId,
        nationalityId: employeeData.person?.nationalityId
      }
    });

    // Si estamos editando, deshabilitamos la opción de cambiar persona
    this.employeeForm.get('personOption')?.disable();
  }

  private loadPersons(): void {
    this.personService.getPersons().subscribe({
      next: (response: PersonApiResponse) => {
        this.personsList = response.items || [];
      },
      error: (err) => {
        console.error('Error:', err);
        this.personsList = [];
      }
    });
  }

  private togglePersonFields(): void {
    const personGroup = this.employeeForm?.get('person') as FormGroup;

    if (this.useExistingPerson) {
      personGroup.disable(); // Deshabilita pero mantiene los valores
    } else {
      personGroup.enable();
    }
  }

  onSubmit(): void {
    if (this.employeeForm?.invalid) return;

    const formValue = this.employeeForm?.getRawValue(); // Usa getRawValue() para incluir campos deshabilitados

    if (formValue.person?.birthDate) {
      formValue.person.birthDate = formatDate(formValue.person.birthDate, 'yyyy-MM-dd', 'en-US');
    }

    if (this.isEditMode) {

      const employeeData = {
        positionID: formValue.positionID,
        employeeCode: formValue.employeeCode,
        hireDate: formValue.hireDate,
        terminationDate: formValue.terminationDate,
        contractType: formValue.contractType,
        department: formValue.department,
        corporateEmail: formValue.corporateEmail,
        salary: formValue.salary,
        person: formValue.person,
        status: this.originalStatus,
      };

      this.employeeService.updateEmployeeWithPerson(this.employeeId, employeeData).subscribe({
        next: () => {
          this.dialogRef.close({ success: true });
        },
        error: (err) => {
          console.error('Error updating client:', err);
        }
      });
    } else if (this.useExistingPerson) {
      // Lógica para persona existente
      const employeeData = {
        positionID: formValue.positionID,
        employeeCode: formValue.employeeCode,
        hireDate: formValue.hireDate,
        terminationDate: formValue.terminationDate,
        contractType: formValue.contractType,
        department: formValue.department,
        corporateEmail: formValue.corporateEmail,
        salary: formValue.salary,
        person: formValue.person,
        status: this.originalStatus
      };
      this.dialogRef.close({ type: 'withPersonID', data: employeeData });
    } else {
      // Lógica para nueva persona
      const employeeData = {
        positionID: formValue.positionID,
        employeeCode: formValue.employeeCode,
        hireDate: formValue.hireDate,
        terminationDate: formValue.terminationDate,
        contractType: formValue.contractType,
        department: formValue.department,
        corporateEmail: formValue.corporateEmail,
        salary: formValue.salary,
        person: formValue.person,
        status: this.originalStatus
      };
      this.dialogRef.close({ type: 'withPerson', data: employeeData });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
