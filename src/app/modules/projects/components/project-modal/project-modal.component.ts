import { CommonModule, formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'project-modal',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatButtonModule,
    MatDatepickerModule,
    MatDialogActions,
    MatDialogContent,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './project-modal.component.html',
  styleUrl: './project-modal.component.scss'
})
export class ProjectModalComponent {

  projectForm!: FormGroup;

  isEditMode: boolean = false;

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

  constructor(
      public dialogRef: MatDialogRef<ProjectModalComponent>,
      @Inject(MAT_DIALOG_DATA) public data: any,
      private fb: FormBuilder
    ) {
      this.projectForm = this.fb.group({
          projectStatus: [''],
          clientId: [''],
          code: [''],
          name: [''],
          description: [''],
          startDate: [''],
          endDate: [''],
          actualStartDate: [null],
          endStartDate: [null],
          budget: [''],
      });

      if (data && data.project) {
      this.isEditMode = true;
      this.projectForm.patchValue({
        ...data.project,
        startDate: data.project.startDate ? formatDate(data.project.startDate, 'yyyy-MM-dd', 'en-US') : null,
        endDate: data.project.endDate ? formatDate(data.project.endDate, 'yyyy-MM-dd', 'en-US') : null
      });
    }
    }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.projectForm.valid) {
      const project = {
        projectStatusID: this.projectForm.value.projectStatus,
        clientID: this.projectForm.value.clientId,
        code: this.projectForm.value.code,
        name: this.projectForm.value.name,
        description: this.projectForm.value.description,
        startDate: this.projectForm.value.startDate,
        endDate: this.projectForm.value.endDate,
        actualStartDate: this.projectForm.value.startDate,
        actualEndDate: this.projectForm.value.endDate,
        budget: this.projectForm.value.budget,
      };
      console.log(project);
      this.dialogRef.close(project);
    }
  }

}
