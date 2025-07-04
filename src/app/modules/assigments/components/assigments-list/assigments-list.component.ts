// project-assignments.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { ProjectService } from '../../../projects/services/project.service'; // Ajusta la ruta a tu servicio
import { ProjectDetail, EmployeePersonInfo } from '../../interfaces/assignment.interface'; // Ajusta la ruta a tus interfaces
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';

// Interfaz para la data que se mostrará en la tabla
export interface AssignmentDisplayData {
  projectName: string;
  projectCode: string;
  employeeName: string;
  employeeCode: string;
  identificationNumber: string;
  assignmentStatus: boolean;
}

@Component({
  selector: 'assignments-list',
  standalone: true,
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatTableModule,
    ReactiveFormsModule
  ],
  templateUrl: './assigments-list.component.html',
  styleUrls: ['./assigments-list.component.scss']
})
export class AssigmentsListComponent implements OnInit {
  displayedColumns: string[] = ['projectName', 'projectCode', 'employeeName', 'employeeCode', 'identificationNumber', 'assignmentStatus'];
  dataSource = new MatTableDataSource<AssignmentDisplayData>();

  searchControl = new FormControl('');

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private projectService: ProjectService) { }

  ngOnInit(): void {
    this.loadProjectAssignments();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  loadProjectAssignments(): void {
    this.projectService.getAllProjectsDetails().subscribe({
    next: (projectDetails: ProjectDetail[]) => {
      console.log('--- Received projectDetails (full array):', projectDetails);
      const assignmentData: AssignmentDisplayData[] = [];

      projectDetails.forEach((project, projectIndex) => {
        console.log(`\n--- Processing Project #${projectIndex} (ID: ${project?.id}, Name: ${project?.name || 'N/A'}) ---`);

        // Check 1: Is 'project' itself valid?
        if (!project) {
          console.warn(`[SKIP PROJECT] Project at index ${projectIndex} is null or undefined.`);
          return; // Skip this iteration if the project object itself is invalid
        }

        // Log the raw arrays from the project detail
        console.log(`  Project #${project.id} - employeeProjects:`, project.employeeProjects);
        console.log(`  Project #${project.id} - employeesPersonInfo:`, project.employeesPersonInfo);

        // Check 2: Are employeeProjects and employeesPersonInfo present and valid arrays?
        if (project.employeeProjects && Array.isArray(project.employeeProjects) &&
            project.employeesPersonInfo && Array.isArray(project.employeesPersonInfo)) {

          // Check 3: Does this project actually have any employee assignments?
          if (project.employeeProjects.length === 0) {
            console.warn(`[SKIP ASSIGNMENTS] Project '${project.name}' (ID: ${project.id}) has an empty 'employeeProjects' array. No assignments will be added from this project.`);
            return; // Skip to the next project if no assignments exist for this one
          }

          project.employeeProjects.forEach(employeeProject => {
            console.log(`    Processing employeeProject (ID: ${employeeProject.id}, EmployeeID: ${employeeProject.employeeID}) for Project: ${project.name}`);

            // Find the matching employee info from the project's employeesPersonInfo array
            const employeeInfo = project.employeesPersonInfo!.find(
              emp => emp.id === employeeProject.employeeID // Match by employee ID
            );

            // Check 4: Is there a matching employee's personal info?
            if (employeeInfo) {
              console.log(`    MATCH: Found employeeInfo for Employee ID ${employeeProject.employeeID} (${employeeInfo.firstName} ${employeeInfo.lastName})`);
              assignmentData.push({
                projectName: project.name,
                projectCode: project.code,
                employeeName: `${employeeInfo.firstName} ${employeeInfo.lastName}`,
                employeeCode: employeeInfo.employeeCode,
                identificationNumber: employeeInfo.identificationNumber,
                assignmentStatus: employeeProject.status // Assuming AssignmentDisplayData.assignmentStatus is boolean
                // If AssignmentDisplayData.assignmentStatus is string, use:
                // assignmentStatus: employeeProject.status ? 'Activo' : 'Inactivo'
              });
            } else {
              console.warn(`    NO MATCH: No matching 'employeesPersonInfo' found for 'employeeID': ${employeeProject.employeeID} in Project: ${project.name}. This assignment will be skipped.`);
            }
          });
        } else {
            console.warn(`[SKIP PROJECT] Project '${project.name}' (ID: ${project.id}) failed initial employee/person info array validation. 'employeeProjects' or 'employeesPersonInfo' is missing or not an array.`);
          }
        });

        console.log('\n--- Final assignmentData for table:', assignmentData);
        this.dataSource.data = assignmentData;
      },
      error: (err) => {
        console.error('Error al cargar las asignaciones de proyectos', err);
      }
    });
  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}
