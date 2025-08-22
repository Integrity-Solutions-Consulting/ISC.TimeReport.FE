import { CommonModule, formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject, OnDestroy, OnInit } from '@angular/core'; // Agregado OnInit
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
import { Project, ProjectWithID } from '../../../projects/interfaces/project.interface';
import { ReplaySubject, Subject, takeUntil } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

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
    MatInputModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    PersonService,
    provideNativeDateAdapter()
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './leader-modal.component.html',
  styleUrl: './leader-modal.component.scss'
})
export class LeaderModalComponent implements OnInit, OnDestroy {

  leaderForm!: FormGroup;
  personsList: Person[] = [];
  projectsList: any[] = [];
  useExistingPerson: boolean = false;
  isLoadingPersons = false;
  isLoadingProjects = false;
  originalStatus: boolean = true;

  isEditMode: boolean = false;

  public personFilterCtrl: FormControl<string | null> = new FormControl<string>('');
  public filteredPersons: ReplaySubject<Person[]> = new ReplaySubject<Person[]>(1);

  public projectFilterCtrl: FormControl<string | null> = new FormControl<string>('');
  public filteredProjects: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);

  protected _onDestroy = new Subject<void>();

  personTypes = [
    { value: 'NATURAL', viewValue: 'Natural' },
    { value: 'JURIDICA', viewValue: 'Jurídica' }
  ];

  identificationTypes: { id: number, name: string }[] = [];
  genders: { id: number, name: string }[] = [];
  nationalities: { id: number, name: string }[] = [];
  positions: { id: number, name: string }[] = [];
  departments: { id: number, name: string }[] = [];

  leaderTypes = [
    { id: true, name: 'Integrity' },
    { id: false, name: 'Externo' }
  ];

  projectTypes: { id: number, name: string }[] = [];
  projectStatus: { id: number, name: string }[] = [];

  loading = true;
  error: string | null = null;

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
    this.loadCatalogs();
    if (this.isEditMode && this.leaderId) {
      this.loadLeaderData(this.leaderId);
    }
    if (this.data.isEdit && this.data.leader) {
      this.loadLeaderData(this.data.leader);
    }
    this.loadProjects();
    this.setupPersonFilter();
    this.setupProjectFilter();

    // Actualizar campos después de cargar todo
    setTimeout(() => {
      this.updateEditModeFields();
    });
  }

  ngOnDestroy(): void {
    this._onDestroy.next();
    this._onDestroy.complete();
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
      projectID: [leaderData?.projectID || '', Validators.required], // Agregado Validators.required
      leadershipType: [leaderData?.leadershipType || true, Validators.required], // Agregado Validators.required
      responsibilities: [leaderData?.responsibilities || ''],
      startDate: [new Date()],
      endDate: [new Date()],

      // Grupo anidado para 'person'
      person: this.fb.group({
        personType: [leaderData.person?.personType || 'NATURAL', Validators.required],
        identificationTypeId: [leaderData.person?.identificationTypeId || 1, Validators.required],
        identificationNumber: [leaderData.person?.identificationNumber || '', [Validators.required, this.identificationNumberValidator.bind(this)]],
        firstName: [leaderData.person?.firstName || '', Validators.required],
        lastName: [leaderData.person?.lastName || '', Validators.required],
        birthDate: [birthDateValue],
        email: [leaderData.person?.email || '', [Validators.required, Validators.email]],
        phone: [leaderData.person?.phone || '', [Validators.pattern(/^[0-9]+$/)]],
        address: [leaderData.person?.address || ''],
        genderId: [leaderData.person?.genderId || null],
        nationalityId: [leaderData.person?.nationalityId || null]
      })
    });

    this.leaderForm.get('person.personType')?.valueChanges.subscribe(personType => {
      this.updateIdentificationValidators(personType);
    });

    this.leaderForm.get('person.identificationTypeId')?.valueChanges.subscribe(() => {
      const personType = this.leaderForm.get('person.personType')?.value;
      this.updateIdentificationValidators(personType);
    });

    this.leaderForm.get('leadershipType')?.valueChanges.subscribe(value => {
      this.isIdentificationTypeDisabled = value === false;
      const identificationTypeControl = this.leaderForm.get('person.identificationTypeId');
      if (value === false) { // Externo
        identificationTypeControl?.disable();
      } else { // Integrity
        identificationTypeControl?.enable();
      }
      this.updateIdentificationRequiredStatus(value);
      // También actualiza los validadores del número de identificación
      const personType = this.leaderForm.get('person.personType')?.value;
      this.updateIdentificationValidators(personType);

      this.updateEditModeFields();
    });

    this.updateIdentificationRequiredStatus(this.leaderForm.get('leadershipType')?.value);

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

    const initialLeadershipType = this.leaderForm.get('leadershipType')?.value;
    this.isIdentificationTypeDisabled = initialLeadershipType === false;

    const initialPersonType = this.leaderForm.get('person.personType')?.value;
    this.updateIdentificationValidators(initialPersonType);

    // Inicializa los campos de persona según el modo
    this.togglePersonFields();
  }

  private updateEditModeFields(): void {
    if (this.isEditMode) {
      const isIntegrityLeader = this.leaderForm.get('leadershipType')?.value === true;
      const personGroup = this.leaderForm.get('person') as FormGroup;

      if (isIntegrityLeader) {
        // Deshabilitar los campos específicos para Integrity en modo edición
        personGroup.get('personType')?.disable();
        personGroup.get('identificationTypeId')?.disable();
        personGroup.get('identificationNumber')?.disable();
      }
    }
  }

  loadCatalogs(): void {
    this.leaderService.getAllCatalogs().subscribe({
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

    const leadershipType = this.leaderForm?.get('leadershipType')?.value;

    if (leadershipType === false) {
      return null;
    }

    const personType = this.leaderForm?.get('person.personType')?.value;
    const identificationTypeId = this.leaderForm?.get('person.identificationTypeId')?.value;
    const value = control.value;

    if (!value) return null;

    // Validación para persona jurídica
    if (personType === 'JURIDICA') {
      if (identificationTypeId !== 3) {
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

    private setupProjectFilter(): void {
      // Cargar set inicial
      this.filteredProjects.next(this.projectsList.slice());

      // Escuchar cambios en el filtro
      this.projectFilterCtrl.valueChanges
        .pipe(takeUntil(this._onDestroy))
        .subscribe(() => {
          this.filterProjects();
        });
    }

  private updateIdentificationValidators(personType: string): void {
    const identificationTypeControl = this.leaderForm.get('person.identificationTypeId');
    const identificationNumberControl = this.leaderForm.get('person.identificationNumber');

    if (personType === 'JURIDICA') {
      // Persona jurídica solo puede tener RUC (id: 2)
      identificationTypeControl?.setValue(3, { emitEvent: false });
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

    this.leaderForm.get('person')?.updateValueAndValidity();
  }

  private setupPersonFilter(): void {
    // Cargar set inicial
    this.filteredPersons.next(this.personsList.slice());

    // Escuchar cambios en el filtro
    this.personFilterCtrl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterPersons();
      });
  }

    private filterProjects(): void {
      if (!this.projectsList) {
        return;
      }

      // Obtener la palabra clave de búsqueda
      let searchTerm = this.projectFilterCtrl.value || '';
      if (typeof searchTerm === 'string') {
        searchTerm = searchTerm.toLowerCase();
      } else {
        searchTerm = '';
      }

      // Filtrar proyectos
      const filteredProjects = this.projectsList.filter(project => {
        const name = (project.name || '').toLowerCase();
        const code = (project.code || '').toLowerCase();
        return name.includes(searchTerm) || code.includes(searchTerm);
      });

      this.filteredProjects.next(filteredProjects);
    }

  isIdentificationTypeDisabled: boolean = false;

  private filterPersons(): void {
    if (!this.personsList) {
      return;
    }

    // Obtener la palabra clave de búsqueda
    let searchTerm = this.personFilterCtrl.value || '';
    if (typeof searchTerm === 'string') {
      searchTerm = searchTerm.toLowerCase();
    } else {
      searchTerm = '';
    }

    // Filtrar personas
    const filteredPersons = this.personsList.filter(person => {
      const fullName = `${person.firstName || ''} ${person.lastName || ''}`.toLowerCase();
      const identification = (person.identificationNumber || '').toLowerCase();
      return fullName.includes(searchTerm) || identification.includes(searchTerm);
    });

    this.filteredPersons.next(filteredPersons);
  }

  private updateIdentificationRequiredStatus(isIntegrityLeader: boolean): void {
    const personGroup = this.leaderForm.get('person') as FormGroup;
    const identificationNumberControl = personGroup.get('identificationNumber');
    const personTypeControl = personGroup.get('personType');
    const identificationTypeControl = personGroup.get('identificationTypeId'); // Este es el campo que quieres desactivar

    if (!isIntegrityLeader) { // Externo
      // Deshabilitar los campos relevantes
      identificationNumberControl?.disable();
      personTypeControl?.disable();
      identificationTypeControl?.disable(); // Desactivar el campo identificationType

      identificationNumberControl?.clearValidators();
      identificationNumberControl?.setErrors(null);
    } else { // Integrity
      // Habilitar los campos
      identificationNumberControl?.enable();
      personTypeControl?.enable();
      identificationTypeControl?.enable(); // Activar el campo identificationType

      identificationNumberControl?.setValidators([
        Validators.required,
        this.identificationNumberValidator.bind(this)
      ]);

      // Forzar validación después de habilitar
      identificationNumberControl?.updateValueAndValidity();
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
      personGroup.get('email')?.setValidators([Validators.required, Validators.email]);
      personGroup.get('phone')?.setValidators(Validators.pattern(/^[0-9]+$/));

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
        personType: leaderData.person?.personType || 'NATURAL',
        identificationTypeId: leaderData.person?.identificationTypeId,
        identificationNumber: leaderData.person?.identificationNumber,
        firstName: leaderData.person?.firstName,
        lastName: leaderData.person?.lastName,
        birthDate: birthDateValue,
        email: leaderData.person?.email,
        phone: leaderData.person?.phone,
        address: leaderData.person?.address,
        genderId: leaderData.person?.genderId,
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

    this.updateEditModeFields();
  }

  private loadPersons(): void {
    this.isLoadingPersons = true;

    // Usa el método que mejor se adapte a tu API
    this.personService.getAllPersons().subscribe({
      next: (persons) => {
        this.personsList = persons;
        this.isLoadingPersons = false;

        // Inicializar el filtro después de cargar las personas
        this.filteredPersons.next(this.personsList.slice());
      },
      error: (err: any) => {
        console.error('Error loading all persons:', err);
        // Fallback: intentar con método simple
        this.personService.getAllPersonsSimple().subscribe({
          next: (persons) => {
            this.personsList = persons;
            this.isLoadingPersons = false;

            // Inicializar el filtro después de cargar las personas
            this.filteredPersons.next(this.personsList.slice());
          },
          error: (fallbackError) => {
            console.error('Fallback also failed:', fallbackError);
            this.personsList = [];
            this.isLoadingPersons = false;
            this.filteredPersons.next([]);
          }
        });
      }
    });
  }

  private loadProjects() {
    this.isLoadingProjects = true;

    // Usamos valores grandes para pageSize para obtener todos los proyectos
    this.projectService.getProjectsForTables(1, 1000).subscribe({
      next: (response) => {
        this.projectsList = response.items || [];
        this.isLoadingProjects = false;

        // Inicializar el filtro después de cargar los proyectos
        this.filteredProjects.next(this.projectsList.slice());
      },
      error: (error) => {
        console.error('Error loading projects:', error);
        this.isLoadingProjects = false;
        this.projectsList = [];
        this.filteredProjects.next([]);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {

    const isIntegrityLeader = this.leaderForm.get('leadershipType')?.value;

    if (!isIntegrityLeader) {
      // Para líderes externos, limpiar errores de validación en los campos deshabilitados
      const personGroup = this.leaderForm.get('person') as FormGroup;
      personGroup.get('personType')?.setErrors(null);
      personGroup.get('identificationTypeId')?.setErrors(null);
      personGroup.get('identificationNumber')?.setErrors(null);
    }

    if (this.leaderForm.get('leadershipType')?.value === false) {
      this.leaderForm.get('person.identificationNumber')?.setErrors(null);
    }

    this.markFormGroupTouched(this.leaderForm);

    if (this.leaderForm.invalid) {
      console.log('Formulario inválido', this.leaderForm.errors);
      return;
    }

    this.leaderService.showLoading();

    const formValue = this.leaderForm?.getRawValue(); // Usa getRawValue() para incluir campos deshabilitados

    formValue.person.birthDate = formValue.person?.birthDate
      ? formatDate(formValue.person.birthDate, 'yyyy-MM-dd', 'en-US')
      : null;

    if (formValue.startDate) {
      formValue.startDate = formatDate(formValue.startDate, 'yyyy-MM-dd', 'en-US');
    } else {
      formValue.startDate = null;
    }

    if (formValue.endDate) {
      formValue.endDate = formatDate(formValue.endDate, 'yyyy-MM-dd', 'en-US');
    } else {
      formValue.endDate = null;
    }

    if (this.isEditMode) {

      const leaderData = {
        projectID: formValue.projectID,
        leadershipType: formValue.leadershipType,
        startDate: formValue.startDate,
        endDate: formValue.endDate,
        responsibilities: formValue.responsibilities, // Corregido: responsibilities
        status: this.originalStatus,
        person: formValue.person
      };

      this.leaderService.updateLeaderWithPerson(this.leaderId, leaderData).subscribe({
        next: () => {
          this.dialogRef.close({ success: true });
          this.leaderService.hideLoading();
        },
        error: (err) => {
          console.error('Error updating leader:', err);
          this.leaderService.hideLoading();
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
      this.leaderService.hideLoading();
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
      this.leaderService.hideLoading();
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
