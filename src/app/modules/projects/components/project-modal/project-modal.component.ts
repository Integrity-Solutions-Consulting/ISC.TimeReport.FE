import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { ProjectService } from '../../services/project.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { Project, ProjectWithID } from '../../interfaces/project.interface';
import { provideNativeDateAdapter, DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter, MomentDateModule } from '@angular/material-moment-adapter';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Client } from '../../../clients/interfaces/client.interface';
import { ClientService } from '../../../clients/services/client.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Observable, take, ReplaySubject, Subject, takeUntil } from 'rxjs';
import { SuccessResponse } from '../../../../shared/interfaces/response.interface';
import { LoadingComponent } from '../../../auth/components/login-loading/login-loading.component';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatTooltipModule } from '@angular/material/tooltip';

export const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'dd/MM/yyyy',
    monthYearLabel: 'MMMM yyyy',
    dateA11yLabel: 'dd/MM/yyyy',
    monthYearA11yLabel: 'MMMM yyyy'
  },
};

@Component({
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatDialogModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatProgressBarModule,
    MomentDateModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatTooltipModule,
    LoadingComponent,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },
    { provide: MAT_DATE_FORMATS, useValue: {
      parse: {
        dateInput: 'DD/MM/YYYY',
      },
      display: {
        dateInput: 'DD/MM/YYYY',
        monthYearLabel: 'MMMM YYYY',
        dateA11yLabel: 'LL',
        monthYearA11yLabel: 'MMMM YYYY'
      },
    }}
  ],
  selector: 'app-project-modal',
  templateUrl: './project-modal.component.html',
  styleUrls: ['./project-modal.component.scss']
})
export class ProjectModalComponent implements OnInit, OnDestroy {
  projectForm!: FormGroup;
  isEditMode: boolean = false;
  projectId: number | null = null;
  originalStatus: boolean = true;
  clients: Client[] = [];
  isLoadingClients = false;
  isSubmitting = false;
  isLoading = false;
  projectTypes: any[] = [];
  formattedProjectTypes: any[] = [];
  projectStatuses: any[] = [];
  isLoadingStatuses = false;

  showClientWaitingFields: boolean = false;

  public clientFilterCtrl: FormControl<string | null> = new FormControl<string>('');
  public filteredClients: ReplaySubject<Client[]> = new ReplaySubject<Client[]>(1);
  protected _onDestroy = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private clientService: ClientService,
    private dialogRef: MatDialogRef<ProjectModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { project?: ProjectWithID }
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadClients();
    this.loadProjectTypes();
    this.loadProjectStatuses();

    if (this.data?.project) {
      this.isEditMode = true;
      this.projectId = this.data.project.id;
      this.patchFormValues(this.data.project);
    }

    this.projectForm.get('startDate')?.valueChanges.subscribe(() => {
      this.projectForm.get('endDate')?.updateValueAndValidity();
      this.projectForm.get('estimatedEndDate')?.updateValueAndValidity();
    });

    this.projectForm.get('projectStatusId')?.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe((statusId) => {
        this.updateClientWaitingFieldsVisibility(statusId);
      });
  }

  ngOnDestroy(): void {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  private dateRangeValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const formGroup = control as FormGroup;
      const startDate = formGroup.get('startDate')?.value;
      const endDate = formGroup.get('endDate')?.value;
      const estimatedEndDate = formGroup.get('estimatedEndDate')?.value;

      if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
        return { dateRange: true };
      }

      if (startDate && estimatedEndDate && new Date(estimatedEndDate) < new Date(startDate)) {
        return { estimatedDateRange: true };
      }

      return null;
    };
  }

  private initForm(): void {
    this.projectForm = this.fb.group({
      clientId: ['', Validators.required],
      projectStatusId: ['', Validators.required],
      projectTypeId: [null, Validators.required],
      code: ['', [Validators.required, Validators.maxLength(50)]],
      name: ['', [Validators.required, Validators.maxLength(150)]],
      description: [''],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      estimatedEndDate: [null],
      actualStartDate: [null],
      budget: [0, [Validators.required, Validators.min(0)]],
      hours: [0, [Validators.min(0)]],
      waitStartDate: [null],
      waitEndDate: [null],
      observations: ['', Validators.maxLength(50)]
    }, { validator: this.dateRangeValidator() });
  }

  private updateClientWaitingFieldsVisibility(statusId: number): void {
    this.showClientWaitingFields = statusId === 8;

    if (this.showClientWaitingFields) {
      this.projectForm.get('estimatedEndDate')?.setValidators([Validators.required]);
      this.projectForm.get('waitStartDate')?.setValidators([Validators.required]);
      this.projectForm.get('waitEndDate')?.setValidators([Validators.required]);
      this.projectForm.get('observations')?.setValidators([Validators.maxLength(50)]);
    } else {
      this.projectForm.get('estimatedEndDate')?.clearValidators();
      this.projectForm.get('waitStartDate')?.clearValidators();
      this.projectForm.get('waitEndDate')?.clearValidators();
      this.projectForm.get('observations')?.clearValidators();

      if (!this.isEditMode) {
        this.projectForm.get('estimatedEndDate')?.setValue(null);
        this.projectForm.get('waitStartDate')?.setValue(null);
        this.projectForm.get('waitEndDate')?.setValue(null);
        this.projectForm.get('observations')?.setValue('');
      }
    }

    this.projectForm.get('estimatedEndDate')?.updateValueAndValidity();
    this.projectForm.get('waitStartDate')?.updateValueAndValidity();
    this.projectForm.get('waitEndDate')?.updateValueAndValidity();
    this.projectForm.get('observations')?.updateValueAndValidity();
  }

  private setupClientFilter(): void {
    this.filteredClients.next(this.clients.slice());
    this.clientFilterCtrl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterClients();
      });
  }

  private filterClients(): void {
    if (!this.clients) {
      return;
    }

    let searchTerm = this.clientFilterCtrl.value || '';
    if (typeof searchTerm === 'string') {
      searchTerm = searchTerm.toLowerCase();
    } else {
      searchTerm = '';
    }

    const filteredClients = this.clients.filter(client => {
      const tradeName = (client.tradeName || '').toLowerCase();
      const businessName = (client.legalName || '').toLowerCase();
      return tradeName.includes(searchTerm) || businessName.includes(searchTerm);
    });

    this.filteredClients.next(filteredClients);
  }

  private loadProjectStatuses(): void {
    this.isLoadingStatuses = true;
    this.projectService.getProjectStatuses().subscribe({
      next: (statuses) => {
        this.projectStatuses = statuses;
        this.isLoadingStatuses = false;

        if (this.isEditMode && this.data?.project) {
          const projectData = this.data.project;

          if (projectData.projectStatusID === 8) {
            this.showClientWaitingFields = true;

            this.projectForm.get('estimatedEndDate')?.setValidators([Validators.required]);
            this.projectForm.get('waitStartDate')?.setValidators([Validators.required]);
            this.projectForm.get('waitEndDate')?.setValidators([Validators.required]);
            this.projectForm.get('observations')?.setValidators([Validators.maxLength(50)]);

            this.projectForm.get('estimatedEndDate')?.updateValueAndValidity();
            this.projectForm.get('waitStartDate')?.updateValueAndValidity();
            this.projectForm.get('waitEndDate')?.updateValueAndValidity();
            this.projectForm.get('observations')?.updateValueAndValidity();
          }
        }
      },
      error: (err) => {
        console.error('Error loading project statuses:', err);
        this.isLoadingStatuses = false;
        this.projectStatuses = [];
      }
    });
  }

  private loadClients(): void {
    this.isLoadingClients = true;
    this.clientService.getClients(1, 1000, '').subscribe({
      next: (response) => {
        const clients = Array.isArray(response) ? response : response.items;
        this.clients = clients.filter(client => client.status === true);
        this.setupClientFilter();
        this.isLoadingClients = false;
      },
      error: (err) => {
        console.error('Error al cargar clientes:', err);
        this.isLoadingClients = false;
      }
    });
  }

  private loadProjectTypes(): void {
    this.projectService.getProjectTypes().subscribe({
      next: (types) => {
        this.projectTypes = types;
        this.formatTypeNames();

        if (this.formattedProjectTypes.length > 0 && !this.isEditMode) {
          this.projectForm.get('projectTypeId')?.setValue(this.formattedProjectTypes[0].id);
        }
      },
      error: (err) => console.error('Error loading project types:', err)
    });
  }

  private formatTypeNames(): void {
    this.formattedProjectTypes = this.projectTypes.map(type => {
      if (type.typeName === 'Facturable') {
        return {
          ...type,
          displayName: type.subType ?
            'Facturable (Outsourcing)' :
            'Facturable (Llave en Mano)'
        };
      }
      return {
        ...type,
        displayName: type.typeName
      };
    });
  }

  private patchFormValues(project: ProjectWithID): void {
    this.projectForm.patchValue({
      clientId: project.clientID,
      projectStatusId: project.projectStatusID,
      projectTypeId: project.projectTypeID,
      code: project.code,
      name: project.name,
      description: project.description,
      startDate: project.startDate,
      endDate: project.endDate,
      actualStartDate: project.actualStartDate ? new Date(project.actualStartDate) : null,
      estimatedEndDate: project.actualEndDate ? new Date(project.actualEndDate) : null, // CORRECCIÓN: Usar actualEndDate
      budget: project.budget,
      hours: project.hours,
      waitStartDate: project.waitingStartDate ? new Date(project.waitingStartDate) : null,
      waitEndDate: project.waitingEndDate ? new Date(project.waitingEndDate) : null,
      observations: project.observation || ''
    });

    this.updateClientWaitingFieldsVisibility(project.projectStatusID);
  }

  private strictFormatDate(date: Date | string): string {
    const d = new Date(date);
    const pad = (num: number) => num.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.000Z`;
  }

  onSubmit() {
    if (this.isSubmitting) {
      return;
    }

    if (this.projectForm.invalid) {
      this.markFormGroupTouched(this.projectForm);
      console.error('El formulario es inválido. Por favor, revisa los campos.');
      return;
    }

    this.isSubmitting = true;
    this.projectService.showLoading();

    const formValue = this.projectForm.getRawValue();
    const selectedType = this.projectTypes.find(t => t.id === formValue.projectTypeId);

    const projectData: Project = {
      clientID: formValue.clientId,
      projectStatusID: Number(formValue.projectStatusId),
      projectTypeID: formValue.projectTypeId,
      code: formValue.code,
      name: formValue.name,
      description: formValue.description || '',
      startDate: new Date(formValue.startDate).toISOString(),
      endDate: new Date(formValue.endDate).toISOString(),
      actualStartDate: formValue.actualStartDate ? new Date(formValue.actualStartDate).toISOString() : null,
      actualEndDate: formValue.estimatedEndDate ? new Date(formValue.estimatedEndDate).toISOString() : null, // CORRECCIÓN: Mapear estimatedEndDate a actualEndDate
      budget: Number(formValue.budget) || 0,
      hours: Number(formValue.hours) || 0,
      status: true,
      waitingStartDate: formValue.waitStartDate ? new Date(formValue.waitStartDate).toISOString() : null,
      waitingEndDate: formValue.waitEndDate ? new Date(formValue.waitEndDate).toISOString() : null,
      observation: formValue.observations || ''
    };

    console.log('Datos del proyecto a enviar:', projectData);

    const request$: Observable<ProjectWithID | SuccessResponse<Project>> = this.isEditMode && this.data?.project?.id
      ? this.projectService.updateProject(this.data.project.id, projectData)
      : this.projectService.createProject(projectData);

    request$.subscribe({
      next: (response: any) => {
        this.projectService.hideLoading();
        this.isSubmitting = false;
        this.dialogRef.close(response);
      },
      error: (err: any) => {
        this.projectService.hideLoading();
        this.isSubmitting = false;
        console.error('Error al guardar el proyecto:', err);
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  onCancel() {
    this.projectService.hideLoading();
    this.dialogRef.close();
  }
}
