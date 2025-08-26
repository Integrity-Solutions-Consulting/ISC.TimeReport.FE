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

  yearControl = new FormControl<number>(new Date().getFullYear());

  years: number[] = this.generateYears(2020, new Date().getFullYear() + 1);

  private generateYears(start: number, end: number): number[] {
    const years = [];
    for (let year = start; year <= end; year++) {
      years.push(year);
    }
    return years;
  }

  ngOnInit() {
    this.loadData();
    this.monthControl.valueChanges.subscribe(() => this.updateDateRange());
    this.periodToggleControl.valueChanges.subscribe(() => this.updateDateRange());
    this.yearControl.valueChanges.subscribe((newYear) => {
    if (newYear) {
        this.currentYear = newYear;
        this.loadData();
      }
    });
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
      const year = this.yearControl.value ?? new Date().getFullYear();

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
      const year = this.yearControl.value ?? new Date().getFullYear();

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

  // En el método loadData() del CollaboratorsListComponent
loadData() {
  const selectedMonth = this.monthControl.value ?? new Date().getMonth();
  const selectedYear = this.yearControl.value ?? new Date().getFullYear();

  // 1. Obtenemos los empleados pendientes con los parámetros de mes y año
  forkJoin({
    employees: this.http.get<any[]>(
      `${this.urlBase}/api/TimeReport/recursos-pendientes`,
      {
        params: {
          month: selectedMonth + 1,
          year: selectedYear
        }
      }
    ).pipe(
      catchError(error => {
        console.error('Error loading employees:', error);
        return of([]);
      })
    ),
    activities: this.http.get<any>(`${this.urlBase}/api/DailyActivity/GetAllActivities`).pipe(
      catchError(() => of({ data: [] }))
    ),
    // Obtener todos los líderes (tanto Integrity como externos) con parámetros
    leaders: this.http.get<any>(`${this.urlBase}/api/Leader/GetAllLeaders`, {
      params: {
        pageNumber: 1,
        pageSize: 10000,
        search: ''
      }
    }).pipe(
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

      // 3. Creamos un mapa de actividades por empleado
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

      // 5. Procesamos cada empleado del response
      const requests = employees.map(emp => {
        const empActivities = employeeActivitiesMap.get(emp.employeeID) || [];
        const firstActivity = empActivities[0];

        // Si no hay actividades, usar datos básicos del empleado
        if (!firstActivity || !firstActivity.projectID) {
          return of({
            employee: emp,
            project: null,
            client: null,
            leader: null
          });
        }

        // Obtenemos el proyecto
        return this.http.get<any>(`${this.urlBase}/api/Project/GetProjectByID/${firstActivity.projectID}`).pipe(
          catchError(() => of(null)),
          switchMap(project => {
            if (!project || !project.clientID) {
              return of({
                employee: emp,
                project: project,
                client: null,
                leader: null
              });
            }

            // Obtenemos el cliente
            return this.http.get<any>(`${this.urlBase}/api/Client/GetClientByID/${project.clientID}`).pipe(
              catchError(() => of(null)),
              map(client => {
                const leader = projectLeadersMap.get(firstActivity.projectID);
                return {
                  employee: emp,
                  project: project,
                  client: client,
                  leader: leader
                };
              })
            );
          })
        );
      });

      // 6. Procesamos todas las solicitudes
      forkJoin(requests).subscribe({
        next: (results) => {
          const collaborators = results.map((result, index) => {
            const emp = employees[index]; // Usamos el empleado original del response
            const leader = result.leader;

            // Formatear el nombre del líder según su tipo
            let leaderName = 'No asignado';
            if (leader) {
              if (leader.person) {
                // Líder Integrity
                leaderName = `${leader.person.firstName} ${leader.person.lastName}`;
              } else if (leader.externalPerson) {
                // Líder externo
                leaderName = `${leader.externalPerson.firstName} ${leader.externalPerson.lastName}`;
              } else if (leader.firstName && leader.lastName) {
                // Líder con estructura directa
                leaderName = `${leader.firstName} ${leader.lastName}`;
              }
            }

            return {
              employeeID: emp.employeeID,
              nombre: emp.nombreCompletoEmpleado,
              cedula: emp.employeeID.toString(),
              proyecto: result.project?.name || 'No asignado',
              cliente: result.client?.tradeName || result.client?.legalName || 'No asignado',
              lider: leaderName,
              horas: emp.horasRegistradasMes, // Usamos las horas del response
              estado: this.getEstado(emp.horasRegistradasMes, emp.totalDiasHabilesMes),
              projectData: result.project,
              clientData: result.client,
              leaderData: result.leader,
              horasRegistradasMes: emp.horasRegistradasMes // Mantener también esta propiedad
            };
          }).filter(colaborador => colaborador.proyecto !== 'No asignado');

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

  // Método auxiliar para determinar el estado basado en las horas
  private getEstado(horasRegistradas: number, totalDiasHabiles: number): string {
    const horasEsperadas = totalDiasHabiles * 8; // 8 horas por día
    const porcentajeCompletado = (horasRegistradas / horasEsperadas) * 100;

    if (porcentajeCompletado >= 100) {
      return 'Completo';
    } else if (porcentajeCompletado >= 50) {
      return 'En progreso';
    } else {
      return 'Pendiente';
    }
  }
}
