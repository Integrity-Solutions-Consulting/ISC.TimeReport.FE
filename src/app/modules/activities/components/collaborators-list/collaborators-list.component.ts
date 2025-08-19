import { SelectionModel } from '@angular/cdk/collections';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { catchError, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { ClientDetail, LeaderDetail, ProjectDetail } from '../../interfaces/activity.interface';
import { environment } from '../../../../../environments/environment';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

interface Collaborator {
  employeeID: number;
  nombre: string;
  cedula: string;
  proyecto: string;
  cliente: string;
  lider: string;
  horas: number;
  estado: string;
  projectData?: {
    id: number;
    clientID: number;
    name: string;
    // otras propiedades relevantes...
  };
  clientData?: {
    id: number;
    tradeName: string;
    legalName: string;
    // otras propiedades relevantes...
  };
}

@Component({
  selector: 'collaborators-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTableModule,
    ReactiveFormsModule
  ],
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './collaborators-list.component.html',
  styleUrl: './collaborators-list.component.scss'
})
export class CollaboratorsListComponent implements OnInit{

  private http = inject(HttpClient);
  urlBase: string = environment.URL_BASE;

  monthControl = new FormControl<number>(new Date().getMonth());
  periodToggleControl = new FormControl<boolean>(false);

  months = [
    { value: 0, name: 'Enero' },
    { value: 1, name: 'Febrero' },
    { value: 2, name: 'Marzo' },
    { value: 3, name: 'Abril' },
    { value: 4, name: 'Mayo' },
    { value: 5, name: 'Junio' },
    { value: 6, name: 'Julio' },
    { value: 7, name: 'Agosto' },
    { value: 8, name: 'Septiembre' },
    { value: 9, name: 'Octubre' },
    { value: 10, name: 'Noviembre' },
    { value: 11, name: 'Diciembre' }
  ];

  isDownloading = false;

  readonly range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });

  displayedColumns: string[] = ['select', 'colaborador', 'proyecto', 'cliente', 'lider', 'horas', 'estado', 'actions'];
  dataSource: MatTableDataSource<Collaborator> = new MatTableDataSource<Collaborator>([]);
  selection = new SelectionModel<Collaborator>(true, []);
  searchControl = new FormControl('');
  totalItems = 0;
  pageSize = 10;

  currentYear = new Date().getFullYear();
  private clientNameToIdMap = new Map<string, number>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    this.loadData();
    this.monthControl.valueChanges.subscribe(() => this.updateDateRange());
    this.periodToggleControl.valueChanges.subscribe(() => this.updateDateRange());
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onPageChange(event: any) {
    // Handle pagination changes
  }

  downloadCollaboratorExcel(collaborator: any) {
    try {
      // Validación básica
      if (!collaborator?.employeeID) {
        console.error('Colaborador no válido:', collaborator);
        return;
      }

      // Obtener valores con defaults
      const month = this.monthControl.value ?? new Date().getMonth();
      const fullMonth = this.periodToggleControl.value ?? false;

      // Obtener clientId
      let clientId: number;
      try {
        clientId = this.getClientIdFromCollaborator(collaborator);
      } catch (error) {
        console.error('Error obteniendo clientId:', error);
        // Mostrar notificación al usuario
        return;
      }

      // Crear parámetros
      const params = new HttpParams()
        .set('employeeId', collaborator.employeeID.toString())
        .set('clientId', clientId.toString())
        .set('year', this.currentYear.toString())
        .set('month', (month + 1).toString())
        .set('fullMonth', fullMonth.toString());

      // Generar nombre del archivo con periodo
      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const monthName = monthNames[month];

      let periodText = '';
      if (fullMonth) {
        periodText = `Mes Completo ${monthName} ${this.currentYear}`;
      } else {
        periodText = `Quincena ${monthName} ${this.currentYear}`;
      }

      const fileName = `Reporte_${collaborator.nombre || collaborator.employeeID}_${periodText}.xlsm`
        .replace(/ /g, '_'); // Reemplazar espacios por guiones bajos

      this.http.get(`${this.urlBase}/api/TimeReport/export-excel`, {
        params,
        responseType: 'blob'
      }).subscribe({
        next: (blob) => {
          this.saveFile(blob, fileName);
          // Mostrar notificación de éxito
        },
        error: (err) => {
          console.error('Error descargando reporte:', err);
          // Mostrar notificación de error al usuario
        }
      });
    } catch (error) {
      console.error('Error inesperado:', error);
    }
  }

  private getClientIdFromCollaborator(collaborator: Collaborator): number {
    // 1. Primero intentar con projectData.clientID
    if (collaborator.projectData?.clientID) {
      return collaborator.projectData.clientID;
    }

    // 2. Luego con clientData.id
    if (collaborator.clientData?.id) {
      return collaborator.clientData.id;
    }

    // 3. Si todo falla, usar el mapeo por nombre
    const clientName = collaborator.cliente;
    if (this.clientNameToIdMap.has(clientName)) {
      return this.clientNameToIdMap.get(clientName)!;
    }

    // 4. Finalmente lanzar error si no se encuentra
    throw new Error(`
      No se pudo obtener clientID para ${collaborator.nombre}.
      ProjectData: ${JSON.stringify(collaborator.projectData)}
      ClientData: ${JSON.stringify(collaborator.clientData)}
      Nombre cliente: ${clientName}
    `);
  }

  private saveFile(blob: Blob, fileName: string) {
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(link.href);
  }

  async downloadSelectedReports() {
    // Evitar múltiples ejecuciones
    if (this.isDownloading) return;
    this.isDownloading = true;

    try {
      if (this.selection.selected.length === 0) {
        console.warn('No hay colaboradores seleccionados');
        return;
      }

      const month = this.monthControl.value ?? new Date().getMonth();
      const fullMonth = this.periodToggleControl.value ?? false;
      const year = this.currentYear;

      // Descargar cada reporte seleccionado
      for (const collaborator of this.selection.selected) {
        try {
          const clientId = this.getClientIdFromCollaborator(collaborator);
          const params = new HttpParams()
            .set('employeeId', collaborator.employeeID.toString())
            .set('clientId', clientId.toString())
            .set('year', year.toString())
            .set('month', (month + 1).toString())
            .set('fullMonth', fullMonth.toString());

          const fileName = this.generateReportFileName(collaborator, month, fullMonth);
          await this.downloadSingleReport(params, fileName);
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error(`Error descargando reporte para ${collaborator.nombre}:`, error);
        }
      }
    } finally {
      this.isDownloading = false;
    }
  }

  private async downloadSingleReport(params: HttpParams, fileName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get(`${this.urlBase}/api/TimeReport/export-excel`, {
        params,
        responseType: 'blob'
      }).subscribe({
        next: (blob) => {
          this.saveFile(blob, fileName);
          resolve();
        },
        error: (err) => {
          reject(err);
        }
      });
    });
  }

  private generateReportFileName(collaborator: any, month: number, fullMonth: boolean): string {
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const monthName = monthNames[month];

    const periodText = fullMonth
      ? `Mes_Completo_${monthName}_${this.currentYear}`
      : `Quincena_${monthName}_${this.currentYear}`;

    return `Reporte_${(collaborator.nombre || collaborator.employeeID).toString().replace(/[^a-z0-9]/gi, '_')}_${periodText}.xlsm`;
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  updateDateRange() {
    const selectedMonth = this.monthControl.value ?? new Date().getMonth();
    const year = new Date().getFullYear();
    const isFullMonth = this.periodToggleControl.value;

    let startDate: Date;
    let endDate: Date;

    if (isFullMonth) {
      startDate = new Date(year, selectedMonth, 1);
      endDate = new Date(year, selectedMonth + 1, 0);
    } else {
      const currentDay = new Date().getDate();
      const isFirstFortnight = currentDay <= 15;

      if (isFirstFortnight) {
        startDate = new Date(year, selectedMonth, 1);
        endDate = new Date(year, selectedMonth, 15);
      } else {
        startDate = new Date(year, selectedMonth, 16);
        endDate = new Date(year, selectedMonth + 1, 0);
      }
    }

    this.range.setValue({ start: startDate, end: endDate });
    this.loadData();
  }

  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.dataSource.data.forEach(row => this.selection.select(row));
  }

  loadData() {
    // 1. Obtenemos los empleados pendientes y las actividades
    forkJoin({
      employees: this.http.get<any[]>(`${this.urlBase}/api/TimeReport/recursos-pendientes`).pipe(
        catchError(error => {
          console.error('Error loading employees:', error);
          return of([]);
        })
      ),
      activities: this.http.get<any>(`${this.urlBase}/api/DailyActivity/GetAllActivities`).pipe(
        catchError(() => of({ data: [] }))
      ),
      leaders: this.http.get<any>(`${this.urlBase}/api/Leader/GetAllLeaders`).pipe(
        catchError(() => of({ items: [] }))
      )
    }).subscribe({
      next: ({ employees, activities, leaders }) => {
        if (!employees || employees.length === 0) {
          this.dataSource.data = [];
          return;
        }

        // 2. Filtramos las actividades que tienen un projectID válido
        const validActivities = activities.data.filter((activity: any) => activity.projectID);

        // Si no hay actividades válidas, la lista de colaboradores estará vacía
        if (validActivities.length === 0) {
          this.dataSource.data = [];
          return;
        }

        // 3. Creamos un mapa de actividades por empleado, usando solo las válidas
        const employeeActivitiesMap = new Map<number, any[]>();
        validActivities.forEach((activity: any) => {
          if (!employeeActivitiesMap.has(activity.employeeID)) {
            employeeActivitiesMap.set(activity.employeeID, []);
          }
          employeeActivitiesMap.get(activity.employeeID)?.push(activity);
        });

        // 4. Creamos un mapa de líderes por proyecto
        const projectLeadersMap = new Map<number, any>();
        leaders.items.forEach((leader: any) => {
          if (leader.projectID) {
            projectLeadersMap.set(leader.projectID, leader);
          }
        });

        // 5. Filtramos los empleados que tienen al menos un proyecto asignado
        const employeesWithProjects = employees.filter(emp => employeeActivitiesMap.has(emp.employeeID));

        // 6. Procesamos cada empleado filtrado
        const requests = employeesWithProjects.map(emp => {
          const empActivities = employeeActivitiesMap.get(emp.employeeID) || [];
          const firstActivity = empActivities[0];

          // Obtenemos el proyecto
          return this.http.get<any>(`${this.urlBase}/api/Project/GetProjectByID/${firstActivity.projectID}`).pipe(
            catchError(() => of(null)),
            switchMap(project => {
              if (!project || !project.clientID) {
                return of({
                  employee: emp,
                  project: project,
                  client: null,
                  leader: null,
                  totalHours: empActivities.reduce((sum, act) => sum + act.hoursQuantity, 0)
                });
              }

              // Obtenemos el cliente
              return this.http.get<any>(`${this.urlBase}/api/Client/GetClientByID/${project.clientID}`).pipe(
                catchError(() => of(null)),
                map(client => {
                  const leader = projectLeadersMap.get(firstActivity.projectID);
                  const totalHours = empActivities.reduce((sum, act) => sum + act.hoursQuantity, 0);

                  return {
                    employee: emp,
                    project: project,
                    client: client,
                    leader: leader,
                    totalHours: totalHours
                  };
                })
              );
            })
          );
        });

        // 7. Procesamos todas las solicitudes y actualizamos la tabla
        forkJoin(requests).subscribe({
          next: (results) => {
            const collaborators = results.map(result => {
              const emp = result.employee;
              const project = result.project;
              const client = result.client;
              const leader = result.leader;
              const totalHours = result.totalHours;

              return {
                employeeID: emp.employeeID,
                nombre: emp.nombreCompletoEmpleado || `${emp.firstName} ${emp.lastName}`,
                cedula: emp.employeeID.toString(),
                proyecto: project?.name || 'No asignado',
                cliente: client?.tradeName || client?.legalName || 'No asignado',
                lider: leader ? `${leader.person.firstName} ${leader.person.lastName}` : 'No asignado',
                horas: totalHours,
                estado: totalHours >= 80 ? 'Completo' : 'Pendiente',
                projectData: project,
                clientData: client,
                leaderData: leader
              };
            })
            .filter(colaborador => colaborador.proyecto !== 'No asignado'); // Añade este filtro

            this.dataSource.data = collaborators;
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
            this.totalItems = collaborators.length;
          },
          error: (err) => {
            console.error('Error loading details:', err);
            this.dataSource.data = [];
          }
        });
      },
      error: (err) => {
        console.error('Error loading initial data:', err);
        this.dataSource.data = [];
      }
    });
  }
}
