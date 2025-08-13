import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
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
    MatButtonModule
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
export class ProjectModalComponent implements OnInit {
  projectForm!: FormGroup;
  isEditMode: boolean = false;
  projectId: number | null = null;
  originalStatus: boolean = true;
  clients: Client[] = [];
  isLoadingClients = false;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private clientService: ClientService,
    private dialogRef: MatDialogRef<ProjectModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { project?: ProjectWithID }
  ) {
    this.projectForm = this.fb.group({
      projectStatusId: ['', Validators.required],
      clientId: ['', Validators.required],
      code: ['', [Validators.required, Validators.maxLength(50)]],
      name: ['', [Validators.required, Validators.maxLength(150)]],
      description: [''],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      budget: ['', [Validators.required, Validators.min(0)]],
      hours: ['', Validators.min(0)]
    });
  }

  projectCodes = [
    { id: 1, name: 'Planificación' },
    { id: 2, name: 'Aprobado' },
    { id: 3, name: 'En Progreso' },
    { id: 4, name: 'En Espera' },
    { id: 5, name: 'Cancelado' },
    { id: 6, name: 'Completado' },
    { id: 7, name: 'Aplazado' }
  ];

  ngOnInit(): void {
    this.initForm();
    this.loadClients();

    if (this.data?.project) {
      this.isEditMode = true;
      /*this.originalStatus = this.data.project.status;
      /*this.projectId = this.data.project.projectId;*/
      this.patchFormValues(this.data.project);
    }
    this.projectForm.get('startDate')?.valueChanges.subscribe(() => {
      this.projectForm.get('endDate')?.updateValueAndValidity();
    });
  }

    private dateRangeValidator(): ValidatorFn {
      return (control: AbstractControl): ValidationErrors | null => {
        const startDate = control.get('startDate')?.value;
        const endDate = control.get('endDate')?.value;

        if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
          return { dateRange: true };
        }
        return null;
      };
    }

  private initForm(): void {
    this.projectForm = this.fb.group({
      clientId: ['', Validators.required],
      projectStatusId: ['', Validators.required],
      code: [''],
      name: ['', Validators.required],
      description: [''],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      actualStartDate: [null],
      actualEndDate: [null],
      budget: [0],
      hours: [0]
    });
  }

  private loadClients(): void {
    this.isLoadingClients = true;
    // Puedes ajustar los parámetros según necesites
    this.clientService.getClients(1, 1000, '').subscribe({
      next: (response) => {
        // Asume que response es un array de clientes o tiene una propiedad items que lo contiene
        const clients = Array.isArray(response) ? response : response.items;

        // Filtramos los clientes que tienen el status en true
        this.clients = clients.filter(client => client.status === true);

        // Marcamos el estado de carga como falso después de la operación
        this.isLoadingClients = false;
      },
      error: (err) => {
        console.error('Error al cargar clientes:', err);
        this.isLoadingClients = false;
      }
    });
  }

  private patchFormValues(project: ProjectWithID): void {
    const {id, ...projectData } = project;
    this.projectForm.patchValue({
      clientId: project.clientID,
      projectStatusId: project.projectStatusID,
      code: project.code,
      name: project.name,
      description: project.description,
      startDate: project.startDate,
      endDate: project.endDate,
      actualStartDate: project.actualStartDate ? this.strictFormatDate(project.actualStartDate) : null,
      actualEndDate: project.actualEndDate ? this.strictFormatDate(project.actualEndDate) : null,
      budget: project.budget,
      hours: project.hours
    });
  }

  private strictFormatDate(date: Date | string): string {
    const d = new Date(date);
    const pad = (num: number) => num.toString().padStart(2, '0');

    // Formato: YYYY-MM-DDTHH:mm:ss.000Z (incluyendo milisegundos)
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.000Z`;
  }

  onSubmit() {
    if (this.projectForm.invalid || this.isSubmitting) return;
    this.isSubmitting = true;

    const formValue = this.projectForm.getRawValue();

    this.projectService.showLoading();

    // Construir objeto Project sin ID
    const projectData: Project = {
      clientID: formValue.clientId,
      projectStatusID: Number(formValue.projectStatusId),
      projectTypeID: formValue.projectTypeId ? Number(formValue.projectTypeId) : null,
      code: formValue.code,
      name: formValue.name,
      description: formValue.description || '',
      startDate: new Date(formValue.startDate).toISOString(),
      endDate: new Date(formValue.endDate).toISOString(),
      actualStartDate: formValue.actualStartDate ? new Date(formValue.actualStartDate).toISOString() : null,
      actualEndDate: formValue.actualEndDate ? new Date(formValue.actualEndDate).toISOString() : null,
      budget: Number(formValue.budget) || 0,
      hours: Number(formValue.hours) || 0,
      status: undefined
    };


    if (this.isEditMode) {
      const projectId = this.data?.project?.id;
      if (!projectId) {
        console.error('No se puede actualizar: ID de proyecto no proporcionado');
        return;
      }

      this.projectService.updateProject(projectId, projectData).subscribe({
        next: (response) => {
          this.projectService.hideLoading();
          this.isSubmitting = false;
          this.dialogRef.close(response);
        },
        error: (err) => {
          this.projectService.hideLoading();
          this.isSubmitting = false;
          console.error('Error al actualizar proyecto:', err);
        }
      });
    } else {
      this.projectService.createProject(projectData).subscribe({
        next: (response) => {
          this.projectService.hideLoading();
          this.isSubmitting = false;
          this.dialogRef.close(response)},
        error: (err) => {
          this.projectService.hideLoading();
          this.isSubmitting = false;
          console.error('Error:', err)}
      });
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

  onCancel() {
    this.projectService.hideLoading();
    this.dialogRef.close();
  }
}
