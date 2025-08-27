// assignment-leader-dialog.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LeadersService } from '../../services/leaders.service';
import { ProjectService } from '../../../projects/services/project.service';
import { PersonService } from '../../services/person.service';
import { LeaderAssignmentPayload } from '../../interfaces/leader.interface';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export interface LeaderAssignment {
  id: number;
  responsibility: string;
  startDate: string;
  endDate: string;
  leadershipType: boolean;
  status: boolean;
  projectos: any;
  projectId?: number; // Asumiendo que este campo existe para hacer match
  projectName?: string; // Campo adicional para el nombre del proyecto
}

export interface LeaderGroup {
  person: {
    id: number;
    genderId: number;
    nationalityId: number;
    identificationTypeId: number;
    identificationNumber: string;
    personType: any;
    firstName: string;
    lastName: string;
    birthDate: string | null;
    email: string;
    phone: string;
    address: string;
    status: boolean;
  };
  leaderMiddle: LeaderAssignment[];
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
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    ReactiveFormsModule
  ],
  templateUrl: './leader-assignment.component.html',
  styleUrls: ['./leader-assignment.component.scss']
})
export class AssignmentLeaderDialogComponent implements OnInit {
  dataSource = new MatTableDataSource<LeaderAssignment>([]);
  assignmentForm: FormGroup;
  leader: any = null;
  projects: any[] = [];
  loading = false;
  expandedLeader: LeaderGroup | null = null;

  displayedColumns: string[] = ['project', 'startDate', 'endDate', 'responsibility'];
  readonly identificationTypesMap: {[key: number]: string} = {
    1: 'Cédula',
    2: 'Pasaporte',
    3: 'RUC',
  };

  constructor(
    public dialogRef: MatDialogRef<AssignmentLeaderDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private leaderService: LeadersService,
    private projectService: ProjectService,
    private personService: PersonService,
    private snackBar: MatSnackBar
  ) {
    this.assignmentForm = this.fb.group({
      personID: ['', Validators.required],
      personProjectMiddle: this.fb.array([])
    });
    this.leader = data.leader;
  }

  ngOnInit(): void {
    this.loadProjects();
    this.addProjectAssignment();

    if (this.leader) {
      this.loadLeaderAssignments();
    } else {
      this.snackBar.open('No se ha seleccionado un líder válido', 'Cerrar', { duration: 3000 });
      this.dialogRef.close();
    }

    if (this.data && this.data.presetPersonId) {
      // Esperar a que las personas se carguen para establecer el valor
      setTimeout(() => {
        this.assignmentForm.patchValue({
          personID: this.data.presetPersonId
        });
      }, 100);
    }
  }

  loadLeaderAssignments(): void {
    this.loading = true;

    // Cargar tanto los líderes agrupados como los proyectos
    this.leaderService.getLeadersWithProjects().subscribe({
      next: ({ leaders, projects }) => {
        this.projects = projects;

        // Buscar el líder específico en la lista de líderes agrupados
        const foundLeader = leaders.find(l =>
          l.person.id === this.leader.person.id ||
          l.person.identificationNumber === this.leader.person.identificationNumber
        );

        if (foundLeader) {
          // Enriquecer las asignaciones con información de proyectos
          const enrichedAssignments = foundLeader.leaderMiddle.map(assignment => ({
            ...assignment,
            projectName: this.getProjectName(assignment.id) // assignment.id es el projectId
          }));

          this.dataSource.data = enrichedAssignments;
        } else {
          this.snackBar.open('No se encontraron asignaciones para este líder', 'Cerrar', { duration: 3000 });
          this.dataSource.data = [];
        }

        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading leader assignments:', error);
        this.snackBar.open('Error al cargar las asignaciones del líder', 'Cerrar', { duration: 3000 });
      }
    });
  }

  get projectAssignments(): FormArray {
    return this.assignmentForm.get('personProjectMiddle') as FormArray;
  }

  createProjectAssignment(): FormGroup {
    return this.fb.group({
      projectID: ['', Validators.required],
      leadershipType: [true, Validators.required],
      startDate: ['', Validators.required],
      endDate: [''],
      responsibilities: [''],
      status: [true]
    });
  }

  addProjectAssignment(): void {
    this.projectAssignments.push(this.createProjectAssignment());
  }

  removeProjectAssignment(index: number): void {
    this.projectAssignments.removeAt(index);
  }

  getProjectName(projectId: number): string {
    const project = this.projects.find(p => p.id === projectId);
    return project ? `${project.code} - ${project.name}` : `Proyecto no encontrado (ID: ${projectId})`;
  }

  toggleExpand(leader: LeaderGroup): void {
    this.expandedLeader = this.expandedLeader === leader ? null : leader;
  }

  getIdentificationTypeName(idType: number): string {
    return this.identificationTypesMap[idType] || 'Desconocido';
  }

  getLeadershipTypeName(isIntegrity: boolean): string {
    return isIntegrity ? 'Integrity' : 'Externo';
  }

  getStatusName(status: boolean): string {
    return status ? 'Activo' : 'Inactivo';
  }

  onClose(): void {
    this.dialogRef.close();
  }

  loadProjects(): void {
    this.projectService.getProjectsForTables(1, 10000, '').subscribe({
      next: (response) => {
        this.projects = response.items || [];
      },
      error: (error) => {
        console.error('Error loading projects:', error);
        this.snackBar.open('Error al cargar proyectos', 'Cerrar', { duration: 3000 });
      }
    });
  }

  // Función para agregar nueva asignación
  addAssignment(): void {
    // Aquí implementarías la lógica para agregar una nueva asignación
    this.snackBar.open('Funcionalidad de agregar asignación en desarrollo', 'Cerrar', { duration: 3000 });
  }

  // Función para editar asignación
  editAssignment(assignment: LeaderAssignment): void {
    // Aquí implementarías la lógica para editar una asignación existente
    this.snackBar.open(`Editando asignación: ${assignment.responsibility}`, 'Cerrar', { duration: 3000 });
  }

  // Función para eliminar asignación
  deleteAssignment(assignment: LeaderAssignment): void {
    // Aquí implementarías la lógica para eliminar una asignación
    if (confirm(`¿Estás seguro de eliminar la asignación "${assignment.responsibility}"?`)) {
      this.snackBar.open(`Eliminando asignación: ${assignment.responsibility}`, 'Cerrar', { duration: 3000 });
    }
  }

  onSubmit(): void {
    if (this.assignmentForm.valid) {
      this.loading = true;

      // Formatear las fechas correctamente para la API
      const formValue = this.assignmentForm.value;
      const payload: LeaderAssignmentPayload = {
        personID: formValue.personID,
        personProjectMiddle: formValue.personProjectMiddle.map((assignment: any) => ({
          ...assignment,
          startDate: this.formatDate(assignment.startDate),
          endDate: assignment.endDate ? this.formatDate(assignment.endDate) : undefined
        }))
      };

      this.leaderService.assignLeaderToProject(payload).subscribe({
        next: () => {
          this.loading = false;
          this.snackBar.open('Líder asignado con éxito', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.loading = false;
          console.error('Error assigning leader:', error);
          let errorMessage = 'Error al asignar líder';

          if (error.error && error.error.message) {
            errorMessage += `: ${error.error.message}`;
          }

          this.snackBar.open(errorMessage, 'Cerrar', { duration: 5000 });
        }
      });
    } else {
      // Marcar todos los campos como touched para mostrar errores
      this.markFormGroupTouched(this.assignmentForm);
    }
  }

  formatDate(date: Date | string): string {
    if (!date) return '';

    const d = new Date(date);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);

    return `${year}-${month}-${day}`;
  }

  private markFormGroupTouched(formGroup: FormGroup | FormArray) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);

      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      } else {
        control?.markAsTouched();
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
