import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ProjectService } from '../../../projects/services/project.service';
import { CombinedAssignment, EmployeePersonInfo, EmployeeProject } from '../../interfaces/assignment.interface';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'assigments-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatTableModule
  ],
  templateUrl: './assigments-list.component.html',
  styleUrl: './assigments-list.component.scss'
})
export class AssigmentsListComponent implements OnInit{

  displayedColumns: string[] = ['employeeCode', 'fullName', 'identificationNumber', 'assignmentDate', 'status'];
  dataSource = new MatTableDataSource<CombinedAssignment>();

  snackBar = inject(MatSnackBar);

  isLoading: boolean = false;

  constructor(private projectService: ProjectService) { }

  ngOnInit(): void {
    this.loadProjectDetails(1); // Reemplaza con el ID del proyecto que necesites
  }

  loadProjectDetails(projectId: number): void {
    this.projectService.getProjectDetails(projectId).subscribe({
      next: (response) => {
        console.log(response)
        // Versión para respuesta SIN propiedad 'data'
        const employeeProjects = response?.employeeProjects || response || [];
        const employeesPersonInfo = response?.employeesPersonInfo || [];

        const combinedData = employeeProjects.map((assignment: any) => {
          const employeeInfo = employeesPersonInfo.find(
            (emp: any) => emp?.id === assignment?.employeeID
          ) || {};

          return {
            employeeCode: employeeInfo?.employeeCode || 'N/A',
            fullName: `${employeeInfo?.firstName || ''} ${employeeInfo?.lastName || ''}`.trim(),
            identificationNumber: employeeInfo?.identificationNumber || 'N/A',
            assignmentDate: assignment?.assignment_date ? new Date(assignment.assignment_date) : null,
            status: assignment?.status ? 'Activo' : 'Inactivo'
          };
        });

        this.dataSource.data = combinedData;
      },
      error: (err) => {
        console.error('Error al cargar proyectos:', err);
      }
    });
  }
}
