import { CommonModule, formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core'; // Agregado OnInit
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle, } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { LeadersService } from '../../services/leaders.service';
import { LeaderWithPerson, Person, PersonApiResponse } from '../../interfaces/leader.interface';
import { PersonService } from '../../services/person.service';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { ProjectService } from '../../../projects/services/project.service';
import { Project } from '../../../projects/interfaces/project.interface';

@Component({
  selector: 'app-leader-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatButtonModule,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    MatFormFieldModule,
    MatRadioModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatInputModule
  ],
  providers: [
    PersonService,
    provideNativeDateAdapter()
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './leader-modal.component.html',
  styleUrl: './leader-modal.component.scss'
})
export class LeaderModalComponent implements OnInit { // Implementamos OnInit

  leaderForm!: FormGroup;
  personsList: Person[] = [];
  projectsList: Project[] = [];
  useExistingPerson: boolean = false;
  isLoadingPersons = false;
  isLoadingProjects = false;
  originalStatus: boolean = true;

  isEditMode: boolean = false;

  identificationTypes = [
    { id: 1, name: 'Cédula' },
    { id: 2, name: 'RUC' },
    { id: 3, name: 'Pasaporte' }
  ];

  genders = [
    { id: 1, name: 'Masculino' },
    { id: 2, name: 'Femenino' }
  ];

  personTypes = [
    { id: 'Natural', name: 'Persona Natural' },
    { id: 'Legal', name: 'Persona Jurídica' }
  ];

  leaderTypes = [
    { id: true, name: 'Integrity' },
    { id: false, name: 'Externo' }
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

  private leaderId: number;

  constructor(
    private leaderService: LeadersService,
    private personService: PersonService,
    private projectService: ProjectService,
    public dialogRef: MatDialogRef<LeaderModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder
  ) {
    const leaderData = data?.leader || {};
    this.leaderId = leaderData.id || null;
    this.originalStatus = data?.leader?.status || true;
    this.isEditMode = !!data?.leader?.id;

    this.initializeForm(leaderData);
  }

  ngOnInit(): void {
    this.loadPersons();
    if (this.isEditMode && this.leaderId) {
      this.loadLeaderData(this.leaderId);
    }
    this.loadProjects();
  }

  private initializeForm(leaderData: any): void {

    const birthDateValue = leaderData.person?.birthDate
      ? formatDate(leaderData.person.birthDate, 'yyyy-MM-dd', 'en-US')
      : '';

    const startDateValue = leaderData.startDate
      ? formatDate(leaderData.startDate, 'yyyy-MM-dd', 'en-US')
      : '';

    const endDateValue = leaderData.endDate
      ? formatDate(leaderData.endDate, 'yyyy-MM-dd', 'en-US')
      : '';

    this.leaderForm = this.fb.group({
      // Controles principales
      personOption: ['new'],
      existingPerson: [null],
      projectID: [leaderData.projectID || '', Validators.required], // Agregado Validators.required
      leadershipType: [leaderData.leadershipType || true, Validators.required], // Agregado Validators.required
      startDate: [startDateValue || '', Validators.required], // Agregado Validators.required
      endDate: [endDateValue || '', Validators.required], // Agregado Validators.required
      responsibilities: [leaderData.responsibilities || ''],

      // Grupo anidado para 'person'
      person: this.fb.group({
        personType: [leaderData.person?.personType || 'Natural', Validators.required],
        identificationTypeId: [leaderData.person?.identificationTypeId || 0, Validators.required],
        identificationNumber: [leaderData.person?.identificationNumber || '', [Validators.required, this.identificationNumberValidator.bind(this)]],
        firstName: [leaderData.person?.firstName || '', Validators.required],
        lastName: [leaderData.person?.lastName || '', Validators.required],
        birthDate: [birthDateValue],
        email: [leaderData.person?.email || '', [Validators.required, Validators.email]],
        phone: [leaderData.person?.phone || '', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
        address: [leaderData.person?.address || ''],
        genderID: [leaderData.person?.genderID || 0],
        nationalityId: [leaderData.person?.nationalityId || 0]
      })
    });

    this.leaderForm.get('person.personType')?.valueChanges.subscribe(personType => {
      this.updateIdentificationValidators(personType);
    });

    this.leaderForm.get('person.identificationTypeId')?.valueChanges.subscribe(() => {
      const personType = this.leaderForm.get('person.personType')?.value;
      this.updateIdentificationValidators(personType);
    });

    this.leaderForm.get('personOption')?.valueChanges.subscribe(value => {
      this.useExistingPerson = value === 'existing';
      this.togglePersonFields();
    });

    // Añadir listener para el cambio en existingPerson
    this.leaderForm.get('existingPerson')?.valueChanges.subscribe(value => {
      if (this.useExistingPerson) { // Solo si estamos en modo "existing"
        if (value) {
          this.leaderForm.get('existingPerson')?.setErrors(null);
        } else {
          this.leaderForm.get('existingPerson')?.setErrors({ 'required': true });
        }
        this.leaderForm.updateValueAndValidity(); // Forzar la revalidación del formulario completo
      }
    });

    const initialPersonType = this.leaderForm.get('person.personType')?.value;
    this.updateIdentificationValidators(initialPersonType);

    // Inicializa los campos de persona según el modo
    this.togglePersonFields();
  }

  private identificationNumberValidator(control: FormControl): { [key: string]: any } | null {
    const personType = this.leaderForm?.get('person.personType')?.value;
    const identificationTypeId = this.leaderForm?.get('person.identificationTypeId')?.value;
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
    const identificationTypeControl = this.leaderForm.get('person.identificationTypeId');
    const identificationNumberControl = this.leaderForm.get('person.identificationNumber');

    if (personType === 'Legal') {
      // Persona jurídica solo puede tener RUC (id: 2)
      identificationTypeControl?.setValue(2);
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
  }

  private loadLeaderData(leaderId: number): void {
    this.leaderService.getLeaderByID(leaderId).subscribe({
      next: (response) => {
        if (response) {
          this.patchFormValues(response);
          this.originalStatus = response.status;
        }
      },
      error: (err) => {
        console.error('Error loading leader data:', err);
      }
    });
  }

  displayPersonFn(person: Person): string {
    return person ? `${person.firstName} ${person.lastName} (${person.identificationNumber})` : '';
  }

  private togglePersonFields(): void {
    const personGroup = this.leaderForm.get('person') as FormGroup;
    const existingPersonControl = this.leaderForm.get('existingPerson');

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
      personGroup.get('identificationNumber')?.setValidators([Validators.required, this.identificationNumberValidator.bind(this)]);
      personGroup.get('firstName')?.setValidators(Validators.required);
      personGroup.get('lastName')?.setValidators(Validators.required);
      personGroup.get('email')?.setValidators([Validators.required, Validators.email]);
      personGroup.get('phone')?.setValidators([Validators.required, Validators.pattern(/^[0-9]+$/)]);

      Object.keys(personGroup.controls).forEach(key => {
        personGroup.get(key)?.updateValueAndValidity();
      });

      existingPersonControl?.clearValidators();
      existingPersonControl?.setValue(null); // Limpiar el valor seleccionado
    }
    // Forzar la revalidación del formulario completo
    this.leaderForm.updateValueAndValidity();
  }

  // Se añade esta función para manejar la selección de persona existente
  onPersonSelected(event: any): void {
    // No necesitas almacenar selectedPerson si solo es para la validación
    // this.selectedPerson = event.value;
    if (event.value) {
      this.leaderForm.get('existingPerson')?.setErrors(null);
    } else {
      this.leaderForm.get('existingPerson')?.setErrors({ 'required': true });
    }
    this.leaderForm.updateValueAndValidity();
  }


  private patchFormValues(leaderData: any): void {
    // Formatea la fecha si existe
    const birthDateValue = leaderData.person?.birthDate
      ? formatDate(leaderData.person.birthDate, 'yyyy-MM-dd', 'en-US')
      : '';

    const startDateValue = leaderData.startDate
      ? formatDate(leaderData.startDate, 'yyyy-MM-dd', 'en-US')
      : '';

    const endDateValue = leaderData.endDate
      ? formatDate(leaderData.endDate, 'yyyy-MM-dd', 'en-US')
      : '';

    this.leaderForm.patchValue({
      projectID: leaderData.projectID,
      leadershipType: leaderData.leadershipType,
      startDate: startDateValue,
      endDate: endDateValue,
      responsibilities: leaderData.responsibilities,
      person: {
        personType: leaderData.person?.personType,
        identificationTypeId: leaderData.person?.identificationTypeId,
        identificationNumber: leaderData.person?.identificationNumber,
        firstName: leaderData.person?.firstName,
        lastName: leaderData.person?.lastName,
        birthDate: birthDateValue,
        email: leaderData.person?.email,
        phone: leaderData.person?.phone,
        address: leaderData.person?.address,
        genderID: leaderData.person?.genderID,
        nationalityId: leaderData.person?.nationalityId
      }
    });

    // Si estamos editando, deshabilitamos la opción de cambiar persona
    this.leaderForm.get('personOption')?.disable();
    // También deshabilita existingPerson si se está editando y ya hay una persona asociada
    if (this.isEditMode && leaderData.personID) {
      this.leaderForm.get('existingPerson')?.disable();
      this.leaderForm.patchValue({ personOption: 'existing', existingPerson: leaderData.personID });
      this.useExistingPerson = true;
      this.togglePersonFields(); // Asegura que los campos de persona se deshabiliten
    }
  }

  private loadPersons(): void {
    this.isLoadingPersons = true;
    this.personService.getPersons().subscribe({
      next: (response) => {
        this.personsList = response.items;
        this.isLoadingPersons = false;
      },
      error: (err: any) => {
        console.error('Error:', err);
        this.personsList = [];
      }
    });
  }

  private loadProjects() {
    this.isLoadingProjects = true;
    this.projectService.getProjects().subscribe({
      next: (response) => {
        this.projectsList = response.items;
        this.isLoadingProjects = false;
      },
      error: (error) => {
        console.error('Error loading projects:', error);
        this.isLoadingProjects = false;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    this.markFormGroupTouched(this.leaderForm);

    if (this.leaderForm.invalid) {
      console.log('Formulario inválido', this.leaderForm.errors);
      return;
    }

    const formValue = this.leaderForm?.getRawValue(); // Usa getRawValue() para incluir campos deshabilitados

    if (formValue.person?.birthDate) {
      formValue.person.birthDate = formatDate(formValue.person.birthDate, 'yyyy-MM-dd', 'en-US');
    }

    if (formValue.startDate) {
      formValue.startDate = formatDate(formValue.startDate, 'yyyy-MM-dd', 'en-US');
    }

    if (formValue.endDate) {
      formValue.endDate = formatDate(formValue.endDate, 'yyyy-MM-dd', 'en-US');
    }

    if (this.isEditMode) {

      const leaderData = {
        projectID: formValue.projectID,
        leadershipType: formValue.leadershipType,
        startDate: formValue.startDate,
        endDate: formValue.endDate,
        responsibilities: formValue.responsabilities, // Corregido: responsibilities
        status: this.originalStatus,
        person: formValue.person
      };

      this.leaderService.updateLeaderWithPerson(this.leaderId, leaderData).subscribe({
        next: () => {
          this.dialogRef.close({ success: true });
        },
        error: (err) => {
          console.error('Error updating leader:', err); // Corregido el mensaje
        }
      });
    } else if (this.useExistingPerson) {
      // Lógica para persona existente
      const leaderData = {
        personID: formValue.existingPerson,
        projectID: formValue.projectID,
        leadershipType: formValue.leadershipType,
        startDate: formValue.startDate,
        endDate: formValue.endDate,
        responsibilities: formValue.responsibilities
      };
      this.dialogRef.close({ type: 'withPersonID', data: leaderData });
    } else {
      // Lógica para nueva persona
      const leaderData = {
        projectID: formValue.projectID,
        leadershipType: formValue.leadershipType,
        startDate: formValue.startDate,
        endDate: formValue.endDate,
        responsibilities: formValue.responsibilities,
        person: formValue.person // Ahora viene en la estructura correcta
      };
      this.dialogRef.close({ type: 'withPerson', data: leaderData });
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
