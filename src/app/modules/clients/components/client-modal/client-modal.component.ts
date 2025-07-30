import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl, AbstractControl } from '@angular/forms';
import { CommonModule, formatDate } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule, provideNativeDateAdapter } from '@angular/material/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { PersonService } from '../../services/person.service';
import { Person, PersonApiResponse } from '../../interfaces/client.interface';
import { Observable, map, startWith } from 'rxjs';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ClientService } from '../../services/client.service';

@Component({
  selector: 'app-customer-edit-modal',
  standalone: true,
  templateUrl: './client-modal.component.html',
  styleUrls: ['./client-modal.component.scss'],
  providers: [
    provideNativeDateAdapter()
  ],
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatFormFieldModule,
    MatOptionModule,
    MatInputModule,
    MatSelectModule,
    MatDialogContent,
    MatDialogTitle,
    MatDialogActions,
    MatButtonModule,
    MatRadioModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatProgressSpinnerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientModalComponent implements OnInit {
  clientForm!: FormGroup;
  isEditMode: boolean = false;
  useExistingPerson: boolean = false;
  filteredPersons: Person[] = [];
  personControl = new FormControl();
  personsList: Person[] = [];
  selectedPerson: Person | null = null;
  isLoadingPersons = false;
  originalStatus: boolean = true;

  personTypes = [
    { id: 'NATURAL', name: 'Persona Natural' },
    { id: 'JURIDICA', name: 'Persona Jurídica' }
  ];

  identificationTypes: { id: number, name: string }[] = [];
  genders: { id: number, name: string }[] = [];
  nationalities: { id: number, name: string }[] = [];
  loading = true;
  error: string | null = null;

  private customerId: number;

  constructor(
    private clientService: ClientService,
    public dialogRef: MatDialogRef<ClientModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private personService: PersonService
  ) {
    const customerData = data?.customer || {};
    this.customerId = customerData.id || null;
    this.isEditMode = !!customerData.id;

    this.initializeForm(customerData);
  }

  ngOnInit(): void {
    this.loadPersons();
    this.loadCatalogs();
    if (this.isEditMode && this.customerId) {
      this.loadClientData(this.customerId);
    }
  }

  loadCatalogs(): void {
    this.clientService.getAllCatalogs().subscribe({
      next: (data) => {
        this.identificationTypes = data.identificationTypes;
        this.genders = data.genders;
        this.nationalities = data.nationalities;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los catálogos';
        this.loading = false;
        console.error('Error loading catalogs:', err);
      }
    });
  }

  private initializeForm(customerData: any): void {

    const birthDateValue = customerData.person?.birthDate
      ? formatDate(customerData.person.birthDate, 'yyyy-MM-dd', 'en-US')
      : '';

    this.clientForm = this.fb.group({
      // Controles principales
      personOption: ['new'],
      existingPerson: [null],
      tradeName: [customerData.tradeName || '', Validators.required],
      legalName: [customerData?.legalName],
      company: [customerData.company || 'ISC', Validators.required],
      // Grupo anidado para 'person'
      person: this.fb.group({
        personType: [customerData.person?.personType || 'JURIDICA', Validators.required],
        firstName: [customerData.person?.firstName || '', Validators.required],
        lastName: [customerData.person?.lastName || '', Validators.required],
        birthDate: [new Date()],
        email: [customerData.person?.email || '', [Validators.required, Validators.email]],
        address: [customerData.person?.address || null],
        phone: [customerData.person?.phone || null],
        genderID: [customerData.person?.genderId || null],
        nationalityId: [customerData.person?.nationalityId || null],
        identificationTypeId: [customerData.person?.identificationTypeId || 0],
        identificationNumber: [customerData.person?.identificationNumber || '']
      })
    });

    this.clientForm.get('person.personType')?.valueChanges.subscribe(personType => {
      this.updateIdentificationValidators(personType);
    });

    this.clientForm.get('person.identificationTypeId')?.valueChanges.subscribe(() => {
      const personType = this.clientForm.get('person.personType')?.value;
      this.updateIdentificationValidators(personType);
    });

    this.clientForm.get('personOption')?.valueChanges.subscribe(value => {
      this.useExistingPerson = value === 'existing';
      this.togglePersonFields();
    });

    // Añadir listener para el cambio en existingPerson
    this.clientForm.get('existingPerson')?.valueChanges.subscribe(value => {
        if (this.useExistingPerson) { // Solo si estamos en modo "existing"
            if (value) {
                this.clientForm.get('existingPerson')?.setErrors(null);
            } else {
                this.clientForm.get('existingPerson')?.setErrors({ 'required': true });
            }
            this.clientForm.updateValueAndValidity(); // Forzar la revalidación del formulario completo
        }
    });


    const initialPersonType = this.clientForm.get('person.personType')?.value;
    this.updateIdentificationValidators(initialPersonType);

    // Inicializa los campos de persona según el modo
    this.togglePersonFields();
  }

  // Validador personalizado para el número de identificación
  private identificationNumberValidator(control: AbstractControl): { [key: string]: any } | null {
    const personType = this.clientForm?.get('person.personType')?.value;
    const identificationTypeId = this.clientForm?.get('person.identificationTypeId')?.value;
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
      // Para pasaporte (id: 3) no aplicamos validación de formato específico
    }

    return null;
  }

  // Actualizar validadores según tipo de persona
  private updateIdentificationValidators(personType: string): void {
    const identificationTypeControl = this.clientForm.get('person.identificationTypeId');
    const identificationNumberControl = this.clientForm.get('person.identificationNumber');

    if (personType === 'JURIDICA') {
      // Persona jurídica solo puede tener RUC (id: 2)
      identificationTypeControl?.setValue(2, { emitEvent: false });
      identificationTypeControl?.disable();

      // Actualizar validación del número de identificación
      identificationNumberControl?.setValidators([
        Validators.pattern(/^\d{13}$/),
        this.identificationNumberValidator.bind(this)
      ]);
    } else {
      // Persona natural puede tener cédula (1) o pasaporte (3)
      identificationTypeControl?.enable();

      // Actualizar validación del número de identificación
      identificationNumberControl?.setValidators([
        this.identificationNumberValidator.bind(this)
      ]);
    }

    identificationNumberControl?.updateValueAndValidity();

    this.clientForm.get('person')?.updateValueAndValidity();
  }

  private loadClientData(clientId: number): void {
    this.clientService.getClientByID(clientId).subscribe({
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

  private patchFormValues(clientData: any): void {
    // Formatea la fecha si existe
    const birthDateValue = clientData.person?.birthDate
      ? formatDate(clientData.person.birthDate, 'yyyy-MM-dd', 'en-US')
      : '';

    this.clientForm.patchValue({
      tradeName: clientData.tradeName,
      legalName: clientData.legalName,
      company: clientData.company,
      person: {
        personType: clientData.person?.personType,
        identificationTypeId: clientData.person?.identificationTypeId,
        identificationNumber: clientData.person?.identificationNumber,
        firstName: clientData.person?.firstName,
        lastName: clientData.person?.lastName,
        birthDate: birthDateValue,
        email: clientData.person?.email,
        phone: clientData.person?.phone,
        address: clientData.person?.address,
        genderId: clientData.person?.genderId,
        nationalityId: clientData.person?.nationalityId
      }
    });

    // Si estamos editando, deshabilitamos la opción de cambiar persona
    this.clientForm.get('personOption')?.disable();
  }

  private _filterPersons(value: string | Person): Person[] {
    if (!Array.isArray(this.personsList)) {
      console.error('personsList no es un array:', this.personsList);
      return [];
    }

    const filterValue = typeof value === 'string'
      ? value.toLowerCase()
      : value?.firstName?.toLowerCase() || '';

    return this.personsList.filter(person =>
      person.firstName?.toLowerCase().includes(filterValue) ||
      person.lastName?.toLowerCase().includes(filterValue) ||
      person.identificationNumber?.includes(filterValue)
    );
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

  displayPersonFn(person: Person): string {
    return person ? `${person.firstName} ${person.lastName} (${person.identificationNumber})` : '';
  }

  private togglePersonFields(): void {
    const personGroup = this.clientForm.get('person') as FormGroup;
    const existingPersonControl = this.clientForm.get('existingPerson');

    if (this.useExistingPerson) {
      personGroup.disable();
      // Elimina validadores de los campos de persona para que no afecten la validez general
      Object.keys(personGroup.controls).forEach(key => {
        personGroup.get(key)?.clearValidators();
        personGroup.get(key)?.updateValueAndValidity();
      });

      existingPersonControl?.setValidators(Validators.required);
    } else {
      personGroup.enable();
      // Restaura los validadores de los campos de persona
      personGroup.get('personType')?.setValidators(Validators.required);
      personGroup.get('identificationTypeId')?.setValidators(Validators.required);
      personGroup.get('identificationNumber')?.setValidators([Validators.pattern(/^[0-9]+$/),
        //this.identificationNumberValidator.bind(this)
      ]);
      personGroup.get('firstName')?.setValidators(Validators.required);
      personGroup.get('lastName')?.setValidators(Validators.required);
      personGroup.get('email')?.setValidators([Validators.required, Validators.email]);
      personGroup.get('phone')?.setValidators([Validators.pattern(/^[0-9]+$/)]);

      Object.keys(personGroup.controls).forEach(key => {
        personGroup.get(key)?.updateValueAndValidity();
      });

      existingPersonControl?.clearValidators();
      existingPersonControl?.setValue(null); // Limpiar el valor seleccionado
    }
    // Forzar la revalidación del formulario completo
    this.clientForm.updateValueAndValidity();
  }

  // Se añade esta función para manejar la selección de persona existente
  onPersonSelected(event: any): void {
    this.selectedPerson = event.value;
    if (this.selectedPerson) {
      this.clientForm.get('existingPerson')?.setErrors(null);
    } else {
      this.clientForm.get('existingPerson')?.setErrors({ 'required': true });
    }
    this.clientForm.updateValueAndValidity();
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    this.markFormGroupTouched(this.clientForm);

    if (this.clientForm.invalid) {
      console.log('Formulario inválido', this.clientForm.errors);
      return;
    }

    const formValue = this.clientForm?.getRawValue(); // Usa getRawValue() para incluir campos deshabilitados

    if (formValue.person?.birthDate) {
      formValue.person.birthDate = formatDate(formValue.person.birthDate, 'yyyy-MM-dd', 'en-US');
    }

    if (this.isEditMode) {

      const clientData = {
        tradeName: formValue.tradeName,
        legalName: formValue.legalName,
        person: formValue.person,
        status: this.originalStatus
      };

      this.clientService.updateClientWithPerson(this.customerId, clientData).subscribe({
        next: () => {
          this.dialogRef.close({ success: true });
        },
        error: (err) => {
          console.error('Error updating client:', err);
        }
      });
    } else if (this.useExistingPerson) {
      // Lógica para persona existente
      const clientData = {
        personID: formValue.existingPerson,
        tradeName: formValue.tradeName,
        legalName: formValue.legalName
      };
      this.dialogRef.close({ type: 'withPersonID', data: clientData });
    } else {
      // Lógica para nueva persona
      const clientData = {
        tradeName: formValue.tradeName,
        legalName: formValue.legalName,
        person: formValue.person // Ahora viene en la estructura correcta
      };
      this.dialogRef.close({ type: 'withPerson', data: clientData });
    }
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
