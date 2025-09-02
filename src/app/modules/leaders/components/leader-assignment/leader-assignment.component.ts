// assignment-leader-dialog.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LeadersService } from '../../services/leaders.service';
import { ProjectService } from '../../../projects/services/project.service';
import { CommonModule, DatePipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { Subject, takeUntil } from 'rxjs';
import { provideNativeDateAdapter } from '@angular/material/core';

export interface LeaderAssignment {
  id: number;
  projectID: number;
  responsibility: string;
  startDate: string; // Formato YYYY-MM-DD para el backend
  endDate: string;   // Formato YYYY-MM-DD para el backend
  leadershipType: boolean;
  status: boolean;
  projectName?: string;
}

@Component({
  selector: 'app-assignment-leader-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDatepickerModule,
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
  styleUrls: ['./leader-assignment.component.scss'],
  providers: [provideNativeDateAdapter(), DatePipe]
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
    private snackBar: MatSnackBar,
    private datePipe: DatePipe
  ) {
    this.assignmentForm = this.fb.group({
      selectedProject: [null, Validators.required],
      responsibility: ['', Validators.required],
      startDate: [null, Validators.required],
      endDate: [null],
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
            startDate: assignment.startDate, // Mantener formato original del backend
            endDate: assignment.endDate      // Mantener formato original del backend
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

  getAvailableProjects(): any[] {
    const assignedProjectIds = this.assignedProjects.map(ap => ap.projectID);
    return this.allProjects.filter(project => !assignedProjectIds.includes(project.id));
  }

  isValidDateFormat(date: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(date);
  }

  addAssignment(): void {
    if (this.assignmentForm.valid) {
      const formValue = this.assignmentForm.value;

      const newAssignment: LeaderAssignment = {
        id: 0,
        projectID: formValue.selectedProject,
        responsibility: formValue.responsibility,
        startDate: this.formatDateForAPI(formValue.startDate),
        endDate: formValue.endDate ? this.formatDateForAPI(formValue.endDate) : '',
        leadershipType: formValue.leadershipType,
        status: formValue.status,
        projectName: this.getProjectName(formValue.selectedProject)
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

  onSubmit(): void {
    if (this.assignedProjects.length === 0) {
      this.snackBar.open('No hay asignaciones para guardar', 'Cerrar', { duration: 3000 });
      return;
    }

    this.saving = true;

    // Crear el payload con la estructura correcta que espera el backend
    const payload = {
        personID: this.leader.person.id,
        personProjectMiddle: this.assignedProjects.map(assignment => ({
          projectID: assignment.projectID,
          leadershipType: assignment.leadershipType,
          startDate: assignment.startDate, // Ya debe estar en formato YYYY-MM-DD
          endDate: assignment.endDate,     // Ya debe estar en formato YYYY-MM-DD
          responsibilities: assignment.responsibility,
          status: assignment.status
        }))
    };

    console.log('Payload enviado:', JSON.stringify(payload, null, 2));

    this.leaderService.assignLeaderToProject(payload).subscribe({
      next: () => {
        this.saving = false;
        this.snackBar.open('Asignaciones guardadas con éxito', 'Cerrar', { duration: 3000 });
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
      startDate: null,
      endDate: null,
      leadershipType: true,
      status: true
    });
  }

  formatDateForAPI(date: Date | null): string {
    if (!date) return '';

    // Formato YYYY-MM-DD que espera el backend
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);

    return `${year}-${month}-${day}`;
  }

  formatDateDisplay(date: string): string {
    if (!date) return 'N/A';
    // Convertir de YYYY-MM-DD (backend) a DD-MM-YYYY (visualización)
    try {
      const [year, month, day] = date.split('-');
      return `${day}-${month}-${year}`;
    } catch {
      return date; // Si no está en el formato esperado, devolver tal cual
    }
  }

  parseDateForInput(dateString: string): Date | null {
    if (!dateString) return null;
    try {
      // Convertir de YYYY-MM-DD (backend) a Date object
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day);
    } catch {
      return null;
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
