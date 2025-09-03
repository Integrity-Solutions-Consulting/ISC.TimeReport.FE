// assignment-leader-dialog.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LeadersService } from '../../services/leaders.service';
import { ProjectService } from '../../../projects/services/project.service';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { Subject, takeUntil } from 'rxjs';

export interface LeaderAssignment {
  id: number;
  projectID: number;
  responsibility: string;
  leadershipType: boolean;
  status: boolean;
  projectName?: string;
  startDate?: string; // Solo para visualización
  endDate?: string;   // Solo para visualización
}

@Component({
  selector: 'app-assignment-leader-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTooltipModule,
    ReactiveFormsModule
  ],
  templateUrl: './leader-assignment.component.html',
  styleUrls: ['./leader-assignment.component.scss']
})
export class AssignmentLeaderDialogComponent implements OnInit {
  assignmentForm: FormGroup;
  leader: any = null;
  allProjects: any[] = [];
  assignedProjects: LeaderAssignment[] = [];
  loading = false;
  saving = false;

  protected _onDestroy = new Subject<void>();

  constructor(
    public dialogRef: MatDialogRef<AssignmentLeaderDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private leaderService: LeadersService,
    private projectService: ProjectService,
    private snackBar: MatSnackBar
  ) {
    this.assignmentForm = this.fb.group({
      selectedProject: [null, Validators.required],
      responsibility: ['', Validators.required],
      leadershipType: [true, Validators.required],
      status: [true, Validators.required]
    });
    this.leader = data.leader;
  }

  ngOnInit(): void {
    this.loadProjectsAndAssignments();
  }

  loadProjectsAndAssignments(): void {
    this.loading = true;

    this.leaderService.getLeadersWithProjects().subscribe({
      next: ({ leaders, projects }) => {
        this.allProjects = projects;

        const foundLeader = leaders.find(l => l.person.id === this.leader.person.id);

        if (foundLeader) {
          this.assignedProjects = foundLeader.leaderMiddle.map(assignment => ({
            ...assignment,
            projectID: assignment.projectId || assignment.id,
            projectName: this.getProjectName(assignment.projectId || assignment.id),
            // Agregar fechas del proyecto para visualización
            startDate: this.getProjectStartDate(assignment.projectId || assignment.id),
            endDate: this.getProjectEndDate(assignment.projectId || assignment.id)
          }));
        }

        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading data:', error);
        this.snackBar.open('Error al cargar los datos', 'Cerrar', { duration: 3000 });
      }
    });
  }

  getProjectName(projectId: number): string {
    const project = this.allProjects.find(p => p.id === projectId);
    return project ? `${project.code} - ${project.name}` : `Proyecto no encontrado (ID: ${projectId})`;
  }

  getProjectStartDate(projectId: number): string {
    const project = this.allProjects.find(p => p.id === projectId);
    return project?.startDate ? this.formatDateDisplay(project.startDate) : 'N/A';
  }

  getProjectEndDate(projectId: number): string {
    const project = this.allProjects.find(p => p.id === projectId);
    return project?.endDate ? this.formatDateDisplay(project.endDate) : 'N/A';
  }

  getAvailableProjects(): any[] {
    const assignedProjectIds = this.assignedProjects.map(ap => ap.projectID);
    return this.allProjects.filter(project =>
      !assignedProjectIds.includes(project.id) && project.status === true
    );
  }

  addAssignment(): void {
    if (this.assignmentForm.valid) {
      const formValue = this.assignmentForm.value;

      const newAssignment: LeaderAssignment = {
        id: 0,
        projectID: formValue.selectedProject,
        responsibility: formValue.responsibility,
        leadershipType: formValue.leadershipType,
        status: formValue.status,
        projectName: this.getProjectName(formValue.selectedProject),
        // Solo para visualización, no se envían al backend
        startDate: this.getProjectStartDate(formValue.selectedProject),
        endDate: this.getProjectEndDate(formValue.selectedProject)
      };

      this.assignedProjects.push(newAssignment);
      this.resetForm();
    } else {
      this.markFormGroupTouched(this.assignmentForm);
    }
  }

  removeAssignment(index: number): void {
    this.assignedProjects.splice(index, 1);
  }

  getActiveAssignments(): LeaderAssignment[] {
    return this.assignedProjects.filter(assignment => assignment.status === true);
  }

  onSubmit(): void {
    if (this.assignedProjects.length === 0) {
      this.snackBar.open('No hay asignaciones para guardar', 'Cerrar', { duration: 3000 });
      return;
    }

    this.saving = true;

    const payload = {
        personID: this.leader.person.id,
        personProjectMiddle: this.assignedProjects.map(assignment => ({
          projectID: assignment.projectID,
          leadershipType: assignment.leadershipType,
          responsibilities: assignment.responsibility,
          status: assignment.status
        }))
    };

    console.log('Payload enviado:', JSON.stringify(payload, null, 2));

    this.leaderService.assignLeaderToProject(payload).subscribe({
      next: () => {
        this.saving = false;
        this.snackBar.open('Se guardaron los cambios correctamente', 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.saving = false;
        console.error('Error saving assignments:', error);

        let errorMessage = 'Error al guardar asignaciones';
        if (error.error?.errors) {
          const errors = Object.values(error.error.errors).flat();
          errorMessage += `: ${errors.join(', ')}`;
        }

        this.snackBar.open(errorMessage, 'Cerrar', { duration: 5000 });
      }
    });
  }

  private resetForm(): void {
    this.assignmentForm.reset({
      selectedProject: null,
      responsibility: '',
      leadershipType: true,
      status: true
    });
  }

  formatDateDisplay(dateString: string): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES'); // Formato DD/MM/YYYY
    } catch {
      return dateString;
    }
  }

  getLeadershipTypeName(isIntegrity: boolean): string {
    return isIntegrity ? 'Integrity' : 'Externo';
  }

  getStatusName(status: boolean): string {
    return status ? 'Activo' : 'Inactivo';
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this._onDestroy.next();
    this._onDestroy.complete();
  }
}
