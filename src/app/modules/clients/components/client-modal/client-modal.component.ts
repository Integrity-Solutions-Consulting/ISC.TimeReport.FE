import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
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
export class ClientModalComponent implements OnInit{
  clientForm!: FormGroup;
  isEditMode: boolean = false;
  useExistingPerson: boolean = false;
  filteredPersons: Person[] = [];
  personControl = new FormControl();
  personsList: Person[] = [];
  selectedPerson: Person | null = null;
  isLoadingPersons = false;
  originalStatus: boolean = true;

  identificationTypes = [
    { id: 1, name: 'Cédula' },
    { id: 2, name: 'RUC' },
    { id: 3, name: 'Pasaporte' }
  ];

  personTypes = [
    { id: 'Natural', name: 'Persona Natural' },
    { id: 'Legal', name: 'Persona Jurídica' }
  ];

  genders = [
    { id: 1, name: 'Masculino' },
    { id: 2, name: 'Femenino' },
  ];

  nationalities = [
    { id: 1, name: 'Argentina' },
    { id: 2, name: 'Bolivia' },
    { id: 3, name: 'Colombia' },
    { id: 4, name: 'Chile' },
    { id: 5, name: 'Ecuador' },
    { id: 6, name: 'Paraguay' },
    { id: 7, name: 'Perú' },
    { id: 8, name: 'Uruguay' },
    { id: 9, name: 'Venezuela' },
  ]

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
    this.loadPersons();
  }

  ngOnInit(): void {
    this.loadPersons();
    if (this.isEditMode && this.customerId) {
      this.loadClientData(this.customerId);
    }
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
      legalName: [customerData.legalName || '', Validators.required],

      // Grupo anidado para 'person'
      person: this.fb.group({
        personType: [customerData.person?.personType || 'Natural', Validators.required],
        identificationTypeId: [customerData.person?.identificationTypeId || 0, Validators.required],
        identificationNumber: [customerData.person?.identificationNumber || '', Validators.required],
        firstName: [customerData.person?.firstName || '', Validators.required],
        lastName: [customerData.person?.lastName || '', Validators.required],
        birthDate: [birthDateValue],
        email: [customerData.person?.email || '', [Validators.required, Validators.email]],
        phone: [customerData.person?.phone || '', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
        address: [customerData.person?.address || ''],
        genderId: [customerData.person?.genderId || 0],
        nationalityId: [customerData.person?.nationalityId || 0]
      })
    });
    this.clientForm.get('personOption')?.valueChanges.subscribe(value => {
      this.useExistingPerson = value === 'existing';
      this.togglePersonFields();
    });
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
    const personGroup = this.clientForm?.get('person') as FormGroup;

    if (this.useExistingPerson) {
      personGroup.disable(); // Deshabilita pero mantiene los valores
    } else {
      personGroup.enable();
    }
  }

  private fillPersonData(person: Person): void {
    this.clientForm.patchValue({
      personType: person.personType,
      identificationTypeId: person.identificationTypeId,
      identificationNumber: person.identificationNumber,
      firstName: person.firstName,
      lastName: person.lastName,
      birthDate: person.birthDate,
      email: person.email,
      phone: person.phone,
      address: person.address,
      genderId: person.genderId,
      nationalityId: person.nationalityId
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.clientForm?.invalid) return;

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
}
