import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { ProjectService } from '../../services/project.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { Project } from '../../interfaces/project.interface';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Client } from '../../../clients/interfaces/client.interface';
import { ClientService } from '../../../clients/services/client.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';

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
    ReactiveFormsModule,
    MatButtonModule
  ],
  providers: [provideNativeDateAdapter()],
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

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private clientService: ClientService,
    private dialogRef: MatDialogRef<ProjectModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { project?: Project }
  ) {
    this.projectForm = this.fb.group({
      projectStatusId: ['', Validators.required],
      clientId: ['', Validators.required],
      code: ['', [Validators.required, Validators.maxLength(50)]],
      name: ['', [Validators.required, Validators.maxLength(150)]],
      description: [''],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      budget: ['', [Validators.required, Validators.min(0)]]
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
      this.originalStatus = this.data.project.status;
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
      budget: [0]
    });
  }

  private loadClients(): void {
    this.isLoadingClients = true;
    // Puedes ajustar los parámetros según necesites
    this.clientService.getClients(1, 1000, '').subscribe({
      next: (response) => {
        // Asume que response es un array de clientes o tiene una propiedad data que lo contiene
        this.clients = Array.isArray(response) ? response : response.items;
        this.isLoadingClients = false;
      },
      error: (err) => {
        console.error('Error al cargar clientes:', err);
        this.isLoadingClients = false;
      }
    });
  }

  private patchFormValues(project: Project): void {
    this.projectForm.patchValue({
      clientId: project.clientID,
      projectStatusId: project.projectStatusID,
      code: project.code,
      name: project.name,
      description: project.description,
      startDate: project.startDate ? new Date(project.startDate) : null,
      endDate: project.endDate ? new Date(project.endDate) : null,
      actualStartDate: project.actualStartDate ? new Date(project.actualStartDate) : null,
      actualEndDate: project.actualEndDate ? new Date(project.actualEndDate) : null,
      budget: project.budget
    });
  }

  onSubmit() {
    if (this.projectForm.invalid) {
      // Marcar todos los campos como touched para mostrar errores
      this.projectForm.markAllAsTouched();
      return;
    }

    const formValue = this.projectForm.value;

    // Validación adicional de fechas (por si acaso)
    if (new Date(formValue.endDate) < new Date(formValue.startDate)) {
      alert('La fecha de fin no puede ser anterior a la fecha de inicio');
      return;
    }

    const projectData: Project = {
      id: this.isEditMode && this.data?.project?.id ? this.data.project.id : undefined,
      clientID: formValue.clientId,
      projectStatusID: formValue.projectStatusId,
      code: formValue.code,
      name: formValue.name,
      description: formValue.description,
      startDate: formValue.startDate?.toISOString(),
      endDate: formValue.endDate?.toISOString(),
      actualStartDate: formValue.actualStartDate?.toISOString() || null,
      actualEndDate: formValue.actualEndDate?.toISOString() || null,
      budget: formValue.budget,
      status: this.originalStatus,
    };

    if (this.isEditMode) {
      const projectId = this.data?.project?.id;
      if (!projectId) {
        console.error('No se puede actualizar: ID de proyecto no proporcionado');
        return;
      }

      this.projectService.updateProject(projectId, projectData).subscribe({
        next: (response) => {
          this.dialogRef.close(response);
        },
        error: (err) => {
          console.error('Error al actualizar proyecto:', err);
        }
      });
    } else {
      this.projectService.createProject(projectData).subscribe({
        next: (response) => {
          this.dialogRef.close(response);
        },
        error: (err) => {
          console.error('Error al crear proyecto:', err);
        }
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
