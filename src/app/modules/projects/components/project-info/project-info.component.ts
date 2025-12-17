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
import {
  EmployeePersonInfo,
  EmployeeProject,
  Project,
  ProjectDetails,
} from '../../interfaces/project.interface';
import { forkJoin, switchMap } from 'rxjs';
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
    MatTableModule,
  ],
  providers: [DatePipe],
  templateUrl: './project-info.component.html',
  styleUrl: './project-info.component.scss',
})
export class ProjectInfoComponent implements OnInit {
  project: Project | null = null; // Usando la interfaz Project
  client: Client | null = null; // Usando la interfaz Client
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
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (!idParam) {
      return; // 🚫 No es vista de proyecto
    }

    const projectId = Number(idParam);

    if (isNaN(projectId) || projectId <= 0) {
      return; // 🚫 Evita NaN y llamadas indebidas
    }

    this.loadProjectDetails(projectId);
  }

  loadProjectDetails(id: number): void {
    this.isLoading = true;

    forkJoin({
      basicInfo: this.projectService.getProjectById(id),
      detailInfo: this.projectService.getProjectDetailByID(id),
    })
      .pipe(
        switchMap(({ basicInfo, detailInfo }) => {
          // Combinamos la información básica con los detalles
          this.project = {
            ...basicInfo,
            ...detailInfo,
            status: basicInfo.status, // O usa detailInfo.projectStatusID según necesites
          };

          // Procesamos los recursos asignados del detalle
          if (detailInfo.employeeProjects && detailInfo.employeesPersonInfo) {
            this.dataSource = detailInfo.employeeProjects
              .filter((ep) => ep.status === true)
              .map((ep: EmployeeProject) => {
                const employeeInfo = detailInfo.employeesPersonInfo.find(
                  (epi) => epi.id === ep.employeeID
                );

                return {
                  type: ep.supplierID ? 'Proveedor' : 'Empleado',
                  name: employeeInfo
                    ? `${employeeInfo.firstName} ${employeeInfo.lastName}`
                    : ep.supplierID
                    ? 'Proveedor Externo'
                    : 'Desconocido',
                  role: ep.assignedRole,
                  cost: ep.costPerHour,
                  hours: ep.allocatedHours,
                };
              });
          } else {
            this.dataSource = [];
          }

          // Obtenemos la información del cliente
          return this.clientService.getClientByID(
            basicInfo.clientID || detailInfo.clientID
          );
        })
      )
      .subscribe({
        next: (clientData) => {
          this.client = clientData;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading data', err);
          this.isLoading = false;
          this.error =
            'No se pudo cargar la información del proyecto o del cliente.';
        },
      });
  }

  formatDate(date: string): string {
    return this.datePipe.transform(date, 'dd/MM/yyyy') || '';
  }

  goBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }
}
