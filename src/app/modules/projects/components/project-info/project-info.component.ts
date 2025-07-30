import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatError } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { ClientService } from '../../../clients/services/client.service';
import { Client } from '../../../clients/interfaces/client.interface';
import { EmployeePersonInfo, EmployeeProject, Project, ProjectDetails } from '../../interfaces/project.interface';
import { switchMap } from 'rxjs';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'project-info',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatListModule,
    MatDividerModule,
    MatChipsModule,
    MatButtonModule,
    MatProgressSpinner,
    MatIconModule,
    MatTableModule
  ],
  providers: [DatePipe],
  templateUrl: './project-info.component.html',
  styleUrl: './project-info.component.scss'
})
export class ProjectInfoComponent implements OnInit{

  project: Project | null = null; // Usando la interfaz Project
  client: Client | null = null;   // Usando la interfaz Client
  isLoading = true;
  error: string | null = null;

  // Propiedades para la tabla de recursos
  displayedColumns: string[] = ['type', 'name', 'role', 'cost', 'hours']; // Columnas actualizadas
  dataSource: any[] = []; // Fuente de datos para la tabla

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private clientService: ClientService,
    private datePipe: DatePipe
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProjectDetails(+id);
    }
  }

  loadProjectDetails(id: number): void {
      this.projectService.getProjectById(id).pipe(
      switchMap((projectData: ProjectDetails) => { // Asegúrate de tipar projectData aquí también
        this.project = projectData;

        // Tu lógica para dataSource con las validaciones
        if (projectData && Array.isArray(projectData.employeeProjects) && Array.isArray(projectData.employeesPersonInfo)) {
          this.dataSource = projectData.employeeProjects.map((ep: EmployeeProject) => {
            const employeeInfo = projectData.employeesPersonInfo!.find((epi: EmployeePersonInfo) => epi.id === ep.employeeID);
            return {
              type: ep.supplierID ? 'Externo' : 'Interno', // Determina el tipo de recurso
              name: employeeInfo ? `${employeeInfo.firstName} ${employeeInfo.lastName}` : 'Desconocido',
              role: ep.assignedRole,
              cost: ep.costPerHour, // Mapeado a 'cost'
              hours: ep.allocatedHours // Mapeado a 'hours'
            };
          });
        } else {
          this.dataSource = [];
          console.warn('employeeProjects or employeesPersonInfo is missing or not an array in the project data.', projectData);
        }

        return this.clientService.getClientByID(projectData.clientID);
      })
    ).subscribe({
      next: (clientData) => {
        this.client = clientData;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading data', err);
        this.isLoading = false;
        this.error = 'No se pudo cargar la información del proyecto o del cliente.';
      }
    });
  }

  formatDate(date: string): string {
    return this.datePipe.transform(date, 'dd/MM/yyyy') || '';
  }

  goBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

}
