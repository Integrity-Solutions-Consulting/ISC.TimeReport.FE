import { EmployeeService } from './../../services/employee.service';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CustomButtonComponent } from '../../../../shared/components/custom-button/custom-button.component';
import { E } from '@angular/cdk/keycodes';
import { formatDate } from '@angular/common';

interface ContractType {
  value: boolean;
  viewValue: string;
}

interface IdentificationTypeid {
  value: number;
  viewValue: string;
}

interface Gender {
  value: number;
  viewValue: string;
}

interface Nationality {
  value: number;
  viewValue: string;
}

interface PersonType {
  value: string;
  viewValue: string;
}

interface Position {
  value: number;
  viewValue: string;
}

@Component({
  selector: 'employee-form',
  standalone: true,
  providers: [
    provideNativeDateAdapter()
  ],
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatSelectModule,
    CustomButtonComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './employee-form.component.html',
  styleUrl: './employee-form.component.scss'
})
export class EmployeeFormComponent {

  contractTypes: ContractType[] = [
    {value: false, viewValue: 'Por Proyecto'},
    {value: true, viewValue: 'Indefinido'}
  ];

  types: IdentificationTypeid[] = [
    {value: 1, viewValue: 'Cédula'},
    {value: 2, viewValue: 'Pasaporte'},
    {value: 3, viewValue: 'RUC'},
  ];

  genders: Gender[] = [
    {value: 1, viewValue: 'Masculino'},
    {value: 2, viewValue: 'Femenino'}
  ]

  nationalities: Nationality[] = [
    {value: 1, viewValue: 'Argentina'},
    {value: 2, viewValue: 'Bolivia'},
    {value: 3, viewValue: 'Chile'},
    {value: 4, viewValue: 'Colombia'},
    {value: 5, viewValue: 'Ecuador'},
    {value: 6, viewValue: 'Paraguay'},
    {value: 7, viewValue: 'Perú'},
    {value: 8, viewValue: 'Uruguay'},
    {value: 9, viewValue: 'Venezuela'},
  ]

  positions: Position[] = [
{ value: 1, viewValue:	'Gerente General'},
{ value: 2,	viewValue:'Asistente General'},
{value: 3,	viewValue:'Jefa Administrativa'},
{ value: 4,	viewValue:'Asistente Administrativa'},
{value: 5,	viewValue:'Asistente Contable'},
{value: 6,	viewValue:'Pasante Contable'},
{value: 7,	viewValue:'Coordinadora de Talento Humano'},
{value: 8,	viewValue:'Asistente de Talento Humano'},
{value: 9,	viewValue:'Gerente de Proyecto y Producto'},
{value: 10,	viewValue:'Líder Software'},
{value: 11,	viewValue:'Tester QA'},
{value: 12,	viewValue:'Desarrollador Fullstack'},
{value: 13,	viewValue:'Desarrollador Fullstack/Senior'},
{value: 14,	viewValue:'Desarrollador Fullstack/Semi Senior'},
{value: 15,	viewValue:'Desarrollador Cobol'},
{value: 16,	viewValue:'Arquitectura'},
{value: 17,	viewValue:'Analista QA'},
{value: 18,	viewValue:'Ingeniero de Soluciones'},
{value: 19,	viewValue:'Ingeniero de Procesos'},
{value: 20,	viewValue:'Asistente Administrativo'},
{value: 21,	viewValue:'Ingeniero de Seguridad de la Información'},
{value: 22,	viewValue:'Ingeniero DBA'},
{value: 23,	viewValue:'Arquitecto de Cyber Seguridad'},
{value: 24,	viewValue:'Analista en Middleware'},
{value: 25,	viewValue:'Desarrollador PHP'},
{value: 26,	viewValue:'Pasante QA'},
{value: 27,	viewValue:'Pasante de DevOps'},
{value: 28,	viewValue:'Pasante de Desarrollo'},
{value: 29,	viewValue:'Pasante DBA'},
{value: 30,	viewValue:'Pasante Contable'},
{value: 31,	viewValue:'Líder de Seguridad e Informática'},
{value: 32,	viewValue:'Ingeniero en Soporte Técnico Semi Senior'},
{value: 33,	viewValue:'Analista de Auditoria y Seguridad e Informática/Junior'},
{value: 34,	viewValue:'Pasante de Soporte Técnico/Auditoria'},
{value: 35,	viewValue:'Ingeniero de Procesos Senior'},
{value: 36,	viewValue:'Ingeniero de Procesos Junior'},
{value: 37,	viewValue:'Gerente Comercial'},
{value: 38,	viewValue:'Asistente de Marketing'},
{value: 39,	viewValue:'Ejecutivo Comercial'},
{value: 40,	viewValue:'Asistente Comercial'},
  ]

  personType: PersonType[] = [
    {value: 'NATURAL', viewValue: 'Natural'},
    {value: 'JURIDICA', viewValue: 'Jurídica'}
  ]

  employeeForm!: FormGroup;

  // Definir la propiedad 'valid' como pública
  public get valid(): boolean {
    return this.employeeForm.valid;
  }

  // Definir la propiedad 'value' como pública
  public get value(): any {
    return this.employeeForm.value;
  }

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.employeeForm = this.fb.group({
      employeeCode: [''],
      contractType: [''],
      hireDate: [''],
      terminationDate: [''],
      department: [''],
      corporateEmail: [''],
      salary: [''],
      identificationTypeId: [''],
      identificationNumber: [''],
      genderId: [''],
      positionID: [''],
      personType: [''],
      nationalityId: [''],
      firstName: [''],
      lastName: [''],
      birthDate: [null],
      phone: [''],
      email: [''],
      address: [''],
    });
  }

   private employeeService = inject(EmployeeService);
   // Resto de la implementación de ControlValueAccessor...
  writeValue(obj: any): void {
    if (obj) {
      this.employeeForm.patchValue(obj, { emitEvent: false });
    }
  }

  registerOnChange(fn: any): void {
    this.employeeForm.valueChanges.subscribe(fn);
  }

  registerOnTouched(fn: any): void {
    this.employeeForm.valueChanges.subscribe(fn);
  }

  setDisabledState(isDisabled: boolean): void {
    isDisabled ? this.employeeForm.disable() : this.employeeForm.enable();
  }

  isSubmitting = signal(false);
    errorMessage = signal<string | null>(null);
    successMessage = signal<string | null>(null);

  onSubmit() {
    console.log(this.employeeForm)
    if (this.employeeForm.valid) {
      this.isSubmitting.set(true);
      this.errorMessage.set(null);
      this.successMessage.set(null);

      const formData = this.employeeForm.value;

      const formatted = {
        ...formData,
        birthDate: formData.birthDate ? formatDate(formData.birthDate, 'yyyy-MM-dd', 'en-US') : null
      }

      console.log('Formulario enviado:', formatted);
      console.log('Datos a enviar:', JSON.stringify(formatted, null, 2));

      this.employeeService.createEmployee(formatted).subscribe({
        next: (response) => {
          this.isSubmitting.set(false);
          this.successMessage.set('Cliente creado exitosamente');
          this.employeeForm.reset();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err.message || 'Error al crear cliente');
        }
      });
      } else {
        this.employeeForm.markAllAsTouched();
    }
  }
}
