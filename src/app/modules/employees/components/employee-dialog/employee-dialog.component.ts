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
import { MatExpansionModule } from '@angular/material/expansion';

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
    MatExpansionModule,
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

  personTypes = [
    { id: 'NATURAL', name: 'Persona Natural' },
    { id: 'JURIDICA', name: 'Persona Jurídica' }
  ];

  identificationTypes: { id: number, name: string }[] = [];
  genders: { id: number, name: string }[] = [];
  nationalities: { id: number, name: string }[] = [];
  positions: { id: number, name: string }[] = [];
  departments: { id: number, name: string }[] = [];
  loading = true;
  error: string | null = null;

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
        positionID: [employeeData.positionID || null, Validators.required],
        workModeID: [employeeData.workModeID || 1],
        employeeCode: [employeeData.employeeCode || ''],
        departmentID: [employeeData.departmentID || null],
        corporateEmail: [employeeData.corporateEmail || null, [Validators.required, Validators.email]],
        salary: [employeeData.salary || 0],
        hireDate: [hireDateValue],
        terminationDate: [terminationDateValue],
        category: [employeeData.category || 'JUNIOR'],
        companies: [employeeData.companies || []],
        // Grupo anidado para 'person'
        person: this.fb.group({
          personType: [employeeData.person?.personType || 'NATURAL', Validators.required],
          identificationTypeId: [employeeData.person?.identificationTypeId || 1, Validators.required],
          identificationNumber: [employeeData.person?.identificationNumber || '', [Validators.required, this.identificationNumberValidator.bind(this)]],
          firstName: [employeeData.person?.firstName || null, Validators.required],
          lastName: [employeeData.person?.lastName || null, Validators.required],
          birthDate: [birthDateValue],
          email: [employeeData.person?.email || null, [Validators.required, Validators.email]],
          phone: [employeeData.person?.phone || null, [Validators.pattern(/^\d{1,10}$/)]],
          address: [employeeData.person?.address || null],
          genderID: [employeeData.person?.genderId || 1],
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
  }

  loadCatalogs(): void {
    this.employeeService.getAllCatalogs().subscribe({
      next: (data) => {
        this.identificationTypes = data.identificationTypes;
        this.genders = data.genders;
        this.nationalities = data.nationalities;
        this.positions = data.positions;
        this.departments = data.departments;
        this.loading = false;
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
    if (personType === 'Legal') {
      if (identificationTypeId !== 2) { // 2 = RUC
        return { invalidIdentificationType: 'Persona jurídica debe usar RUC' };
      }
      if (!/^\d{13}$/.test(value)) {
        return { invalidRucLength: 'El RUC debe tener 13 dígitos' };
      }
    }

    // Validación para persona natural
    if (personType === 'Natural') {
      if (identificationTypeId === 1) { // 1 = Cédula
        if (!/^\d{1,10}$/.test(value)) {
          return { invalidCedulaLength: 'La cédula debe tener máximo 10 dígitos' };
        }
      }
      // Para pasaporte (id: 3) no aplicamos validación de formato específico
    }

    return null;
  }

  private updateIdentificationValidators(personType: string): void {
    const identificationTypeControl = this.employeeForm.get('person.identificationTypeId');
    const identificationNumberControl = this.employeeForm.get('person.identificationNumber');

    if (personType === 'JURIDICA') {
      // Persona jurídica solo puede tener RUC (id: 2)
      identificationTypeControl?.setValue(2, { emitEvent: false });
      identificationTypeControl?.disable();

      // Actualizar validación del número de identificación
      identificationNumberControl?.setValidators([
        Validators.required,
        Validators.pattern(/^\d{13}$/),
        this.identificationNumberValidator.bind(this)
      ]);
    } else {
      // Persona natural puede tener cédula (1) o pasaporte (3)
      identificationTypeControl?.enable();

      // Actualizar validación del número de identificación
      identificationNumberControl?.setValidators([
        Validators.required,
        this.identificationNumberValidator.bind(this)
      ]);
    }

    identificationNumberControl?.updateValueAndValidity();

    this.employeeForm.get('person')?.updateValueAndValidity();
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
      contractType: employeeData.contractType,
      departmentID: employeeData.departmentID,
      corporateEmail: employeeData.corporateEmail,
      salary: employeeData.salary || 0,
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
        genderId: employeeData.person?.genderId || 0,
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

    this.markFormGroupTouched(this.employeeForm);

    if (this.employeeForm.invalid) {
      console.log('Formulario inválido', this.employeeForm.errors);
      return;
    }

    const formValue = this.employeeForm?.getRawValue(); // Usa getRawValue() para incluir campos deshabilitados

    let companyValue = 0;
    if (formValue.companies) {
      if (formValue.companies.includes('1') && formValue.companies.includes('2')) {
        companyValue = 3; // Ambas empresas
      } else if (formValue.companies.includes('1')) {
        companyValue = 1; // Solo ISC
      } else if (formValue.companies.includes('2')) {
        companyValue = 2; // Solo RPS
      }
    }

    if (formValue.person?.birthDate) {
      formValue.person.birthDate = formatDate(formValue.person.birthDate, 'yyyy-MM-dd', 'en-US');
    }

    if (this.isEditMode) {

      const employeeData = {
        positionID: formValue.positionID,
        workModeID: formValue.workModeID,
        employeeCode: formValue.employeeCode,
        contractType: formValue.contractType,
        departmentID: formValue.departmentID,
        corporateEmail: formValue.corporateEmail,
        salary: formValue.salary,
        person: formValue.person,
        status: this.originalStatus,
        hireDate: formValue.hireDate ? formatDate(formValue.hireDate, 'yyyy-MM-dd', 'en-US') : null,
        terminationDate: formValue.terminationDate ? formatDate(formValue.terminationDate, 'yyyy-MM-dd', 'en-US') : null,
        category: formValue.category,
        company: companyValue,
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
        workModeID: formValue.workModeID,
        employeeCode: formValue.employeeCode,
        contractType: formValue.contractType,
        departmentID: formValue.departmentID,
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
        workModeID: formValue.workModeID,
        employeeCode: formValue.employeeCode,
        contractType: formValue.contractType,
        departmentID: formValue.departmentID,
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

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
