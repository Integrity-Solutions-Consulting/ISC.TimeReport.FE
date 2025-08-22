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
import { provideNativeDateAdapter, MatNativeDateModule, DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { EmployeeService } from '../../services/employee.service';
import { PersonService } from '../../services/person.service';
import { MatExpansionModule } from '@angular/material/expansion';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter, MomentDateModule } from '@angular/material-moment-adapter';
import { LoadingComponent } from '../../../auth/components/login-loading/login-loading.component';
import { MatTooltipModule } from '@angular/material/tooltip';

export const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMMM yyyy',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM yyyy'
  },
};

@Component({
  selector: 'employee-dialog',
  standalone: true,
  templateUrl: './employee-dialog.component.html',
  styleUrls: ['./employee-dialog.component.scss'],
  providers: [
    provideNativeDateAdapter(),
    PersonService,
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS }
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatDialogModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    MomentDateModule,
    LoadingComponent
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
  loading = true;
  error: string | null = null;

  personTypes = [
    { id: 'NATURAL', name: 'Persona Natural' },
    { id: 'JURIDICA', name: 'Persona Jurídica' }
  ];

  identificationTypes: { id: number, name: string }[] = [];
  genders: { id: number, name: string }[] = [];
  nationalities: { id: number, name: string }[] = [];
  positions: { id: number, name: string }[] = [];
  departments: { id: number, name: string }[] = [];
  workModes: { id: number, name: string }[] = [];
  employeeCategories = [
    { id: 1, name: 'Junior' },
    { id: 2, name: 'Semi-Senior' },
    { id: 3, name: 'Senior' },
    { id: 4, name: 'Especialista' },
    { id: 5, name: 'Ninguno' }
  ];
  companies = [
    { id: 1, name: 'ISC' },
    { id: 2, name: 'RPS' },
    { id: 3, name: 'ISC y RPS' }
  ];

  contractTypes = [
    { value: true, viewValue: 'Indefinido' },
    { value: false, viewValue: 'Por Proyecto' }
  ];

  isLoading = false;

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
    this.loadCatalogs();
    this.loadPersons();
    if (this.isEditMode && this.employeeId) {
      this.loadEmployeeData(this.employeeId);
    }
  }

  private loadEmployeeData(employeeId: number): void {
    this.employeeService.getEmployeeByID(employeeId).subscribe({
      next: (response) => {
        if (response) {
          // Esperar a que los catálogos estén cargados
          if (this.genders.length > 0) {
            this.patchFormValues(response);
          } else {
            // Si los catálogos no están cargados, esperar un momento
            setTimeout(() => this.patchFormValues(response), 100);
          }
          this.originalStatus = response.status;
        }
      },
      error: (err) => {
        console.error('Error loading employee data:', err);
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
      // Main controls
      personOption: ['new'],
      existingPerson: [null],
      positionID: [employeeData.positionID || null, Validators.required],
      workModeID: [employeeData.workModeID || null, Validators.required],
      employeeCode: [employeeData.employeeCode || '', Validators.required],
      departmentID: [employeeData.departmentID || null, Validators.required],
      corporateEmail: [employeeData.corporateEmail || null, [Validators.required, Validators.email]],
      salary: [employeeData.salary || 1, [Validators.required, Validators.min(1), Validators.max(99999)]],
      hireDate: [hireDateValue],
      terminationDate: [terminationDateValue || null],
      employeeCategoryID: [employeeData.employeeCategoryID || 5, Validators.required],
      companyCatalogID: [employeeData.companyCatalogID || null, Validators.required],
      contractType: [employeeData.contractType || true, Validators.required],

      // Nested group for 'person'
      person: this.fb.group({
        personType: [employeeData.person?.personType || 'NATURAL', Validators.required],
        identificationTypeId: [employeeData.person?.identificationTypeId || 1, Validators.required],
        identificationNumber: [employeeData.person?.identificationNumber || '',
          [Validators.required, this.identificationNumberValidator.bind(this)]],
        firstName: [employeeData.person?.firstName || null, Validators.required],
        lastName: [employeeData.person?.lastName || null, Validators.required],
        birthDate: [birthDateValue],
        email: [employeeData.person?.email || null, [Validators.required, Validators.email]],
        phone: [employeeData.person?.phone || null, [Validators.pattern(/^\d{1,10}$/)]],
        address: [employeeData.person?.address || null],
        genderId: [employeeData.person?.genderId || 1],
        nationalityId: [employeeData.person?.nationalityId || 5]
      })
    });

    this.employeeForm.get('person.personType')?.valueChanges.subscribe(personType => {
      this.updateIdentificationValidators(personType);
    });

    this.employeeForm.get('person.identificationTypeId')?.valueChanges.subscribe(() => {
      const personType = this.employeeForm.get('person.personType')?.value;
      this.updateIdentificationValidators(personType);
    });

    this.employeeForm.get('personOption')?.valueChanges.subscribe(value => {
      this.useExistingPerson = value === 'existing';
      this.togglePersonFields();
    });

    const initialPersonType = this.employeeForm.get('person.personType')?.value;
    this.updateIdentificationValidators(initialPersonType);

    if (this.isEditMode) {
      this.employeeForm.get('employeeCode')?.disable();
    }
  }

  loadCatalogs(): void {
    this.employeeService.getAllCatalogs().subscribe({
      next: (data) => {
        this.identificationTypes = data.identificationTypes;
        this.genders = data.genders;
        this.nationalities = data.nationalities;
        this.positions = data.positions;
        this.departments = data.departments;

        // Load work modes from separate endpoint
        this.employeeService.getWorkModes().subscribe({
          next: (workModes) => {
            this.workModes = workModes;
            this.loading = false;
          },
          error: (err) => {
            console.error('Error loading work modes:', err);
            this.loading = false;
          }
        });
      },
      error: (err) => {
        this.error = 'Error al cargar los catálogos';
        this.loading = false;
        console.error('Error loading catalogs:', err);
      }
    });
  }

  private identificationNumberValidator(control: FormControl): { [key: string]: any } | null {
    const personType = this.employeeForm?.get('person.personType')?.value;
    const identificationTypeId = this.employeeForm?.get('person.identificationTypeId')?.value;
    const value = control.value;

    if (!value) return null;

    // Validación para persona jurídica
    if (personType === 'JURIDICA') {
      if (identificationTypeId !== 2) { // 2 = RUC
        return { invalidIdentificationType: 'Persona jurídica debe usar RUC' };
      }
      if (!/^\d{13}$/.test(value)) {
        return { invalidRucLength: 'El RUC debe tener 13 dígitos' };
      }
    }

    // Validación para persona natural
    if (personType === 'NATURAL') {
      if (identificationTypeId === 1) { // 1 = Cédula
        if (!/^\d{1,10}$/.test(value)) {
          return { invalidCedulaLength: 'La cédula debe tener máximo 10 dígitos' };
        }
      }
    }

    return null;
  }

  private updateIdentificationValidators(personType: string): void {
    const identificationTypeControl = this.employeeForm.get('person.identificationTypeId');
    const identificationNumberControl = this.employeeForm.get('person.identificationNumber');

    if (personType === 'JURIDICA') {
      identificationTypeControl?.setValue(2, { emitEvent: false });
      identificationTypeControl?.disable();

      identificationNumberControl?.setValidators([
        Validators.required,
        Validators.pattern(/^\d{13}$/),
        this.identificationNumberValidator.bind(this)
      ]);
    } else {
      identificationTypeControl?.enable();

      identificationNumberControl?.setValidators([
        Validators.required,
        this.identificationNumberValidator.bind(this)
      ]);
    }

    identificationNumberControl?.updateValueAndValidity();
    this.employeeForm.get('person')?.updateValueAndValidity();
  }

  private patchFormValues(employeeData: any): void {
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
      workModeID: employeeData.workModeID,
      employeeCode: employeeData.employeeCode,
      contractType: employeeData.contractType,
      departmentID: employeeData.departmentID,
      corporateEmail: employeeData.corporateEmail,
      salary: employeeData.salary || 0,
      employeeCategoryID: employeeData.employeeCategoryID || 5,
      companyCatalogID: employeeData.companyCatalogID || null,
      hireDate: hireDateValue,
      terminationDate: terminationDateValue || null,
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
        genderId: employeeData.person?.genderId || 1,
        nationalityId: employeeData.person?.nationalityId
      }
    });

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
      personGroup.disable();
    } else {
      personGroup.enable();
    }
  }

  onSubmit(): void {
  if (this.employeeForm?.invalid) {
    this.markFormGroupTouched(this.employeeForm);
    return;
  }

  this.employeeService.showLoading();

  if (this.isEditMode && this.employeeForm.get('employeeCode')?.disabled) {
    this.employeeForm.get('employeeCode')?.enable();
  }

  const formValue = this.employeeForm?.getRawValue();

  // Format dates
  if (formValue.hireDate) {
    formValue.hireDate = formatDate(formValue.hireDate, 'yyyy-MM-dd', 'en-US');
  }
  if (formValue.terminationDate) {
    formValue.terminationDate = formatDate(formValue.terminationDate, 'yyyy-MM-dd', 'en-US');
  }
  if (formValue.person?.birthDate) {
    formValue.person.birthDate = formatDate(formValue.person.birthDate, 'yyyy-MM-dd', 'en-US');
  }

  const employeeData = {
    id: this.isEditMode ? this.employeeId : undefined, // Asegúrate de incluir el ID si es edición
    positionID: formValue.positionID,
    workModeID: formValue.workModeID,
    employeeCode: formValue.employeeCode,
    contractType: formValue.contractType,
    departmentID: formValue.departmentID,
    corporateEmail: formValue.corporateEmail,
    salary: formValue.salary,
    employeeCategoryID: formValue.employeeCategoryID,
    companyCatalogID: formValue.companyCatalogID,
    hireDate: formValue.hireDate,
    terminationDate: formValue.terminationDate,
    person: {
      ...formValue.person,
      id: this.isEditMode ? this.data.employee.person?.id : undefined // Incluye el ID de persona si es edición
    },
    status: this.originalStatus,
  };

  if (this.isEditMode) {
    this.employeeService.updateEmployeeWithPerson(this.employeeId, employeeData).subscribe({
      next: () => {
        this.employeeService.hideLoading();
        this.dialogRef.close({ success: true });
      },
      error: (err) => {
        this.employeeService.hideLoading();
        console.error('Error updating employee:', err);
      }
    });
  } else if (this.useExistingPerson) {
    this.employeeService.hideLoading();
    this.dialogRef.close({ type: 'withPersonID', data: employeeData });
  } else {
    this.employeeService.hideLoading();
    this.dialogRef.close({ type: 'withPerson', data: employeeData });
  }
}

  onCancel(): void {
    this.employeeService.hideLoading();
    this.dialogRef.close();
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
