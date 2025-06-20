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

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private dialogRef: MatDialogRef<ProjectModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
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
    // Si hay datos, estamos en modo edición
    if (this.data && this.data.project) {
      this.isEditMode = true;
      this.patchFormValues(this.data.project);
    }
  }


  patchFormValues(project: any) {
    this.projectForm.patchValue({
      projectStatusId: project.projectStatusID,
      clientId: project.clientID,
      code: project.code,
      name: project.name,
      description: project.description,
      startDate: new Date(project.startDate),
      endDate: new Date(project.endDate),
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
        clientID: formValue.clientId,
        projectStatusID: formValue.projectStatusId,
        code: formValue.code,
        name: formValue.name,
        description: formValue.description,
        startDate: formValue.startDate?.toISOString(),
        endDate: formValue.endDate?.toISOString(),
        actualStartDate: formValue.startDate?.toISOString() || null,
        actualEndDate: formValue.endDate?.toISOString() || null,
        budget: formValue.budget
      };

      if (this.isEditMode && this.data?.project?.projectId) {
        projectData.projectId = this.data.project.projectId;
      }

      if (this.isEditMode) {
        // Modo edición
        this.projectService.updateProject(this.data.project.projectId, projectData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (err) => {
            console.error('Error al actualizar proyecto:', err);
          }
        });
      } else {
        // Modo creación
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
  }

  onCancel() {
    this.dialogRef.close();
  }
}
