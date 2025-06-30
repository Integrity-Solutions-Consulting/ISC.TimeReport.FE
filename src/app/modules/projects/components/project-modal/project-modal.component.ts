import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { ProjectService } from '../../services/project.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { Project } from '../../interfaces/project.interface';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatDialogModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
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

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
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

  clients = [
    { id: 1, name: 'Banco Guayaquil' },
    { id: 2, name: 'Banco Bolivariano' },
    { id: 3, name: 'Ferretería Don Diego' },
    { id: 4, name: 'Salchipapas El Negro' },
    { id: 5, name: 'GLK' },
    { id: 6, name: 'La Carreta del Caballo Paralítico' },
    { id: 7, name: 'Donde Sea' }
  ];

  ngOnInit(): void {
    this.initForm();

    if (this.data?.project) {
      this.isEditMode = true;
      this.originalStatus = this.data.project.status;
      /*this.projectId = this.data.project.projectId;*/
      this.patchFormValues(this.data.project);
    }
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
    if (this.projectForm.valid) {
      const formValue = this.projectForm.value;

      // Validación de fechas
      if (new Date(formValue.endDate) < new Date(formValue.startDate)) {
        alert('La fecha de fin no puede ser anterior a la fecha de inicio');
        return;
      }

      const projectData: Project = {
        id: this.isEditMode && this.projectId ? this.projectId : undefined,
        clientID: formValue.clientId,
        projectStatusID: formValue.projectStatusId,
        code: formValue.code,
        name: formValue.name,
        description: formValue.description,
        startDate: formValue.startDate?.toISOString(),
        endDate: formValue.endDate?.toISOString(),
        actualStartDate: formValue.startDate?.toISOString() || null,
        actualEndDate: formValue.endDate?.toISOString() || null,
        budget: formValue.budget,
        status: this.originalStatus,
      };

      if (this.isEditMode && this.data?.project?.id) {
        projectData.id = this.data.project.id;
      }

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
            // Manejo de errores para el usuario
            //this.snackBar.open('Error al actualizar proyecto', 'Cerrar', { duration: 5000 });
          }
        });
      } else {
        this.projectService.createProject(projectData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (err) => {
            console.error('Error al crear proyecto:', err);
            // Add user-friendly error handling here
          }
        });
      }
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
