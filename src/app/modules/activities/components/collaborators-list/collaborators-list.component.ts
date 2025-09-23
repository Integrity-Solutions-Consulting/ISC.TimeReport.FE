import { SelectionModel } from '@angular/cdk/collections';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
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
import { Collaborator } from '../../interfaces/activity.interface';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

interface Holiday {
  id: number;
  date: string; // Formato: "YYYY-MM-DD"
  description: string;
  isNational: boolean;
}

@Component({
  selector: 'collaborators-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTableModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule
  ],
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './collaborators-list.component.html',
  styleUrl: './collaborators-list.component.scss'
})
export class CollaboratorsListComponent implements OnInit {

  private http = inject(HttpClient);
  private dialog = inject(MatDialog);
  urlBase: string = environment.URL_BASE;

  monthControl = new FormControl<number>(new Date().getMonth());
  periodToggleControl = new FormControl<boolean>(this.shouldUseFullMonth());
  yearControl = new FormControl<number>(new Date().getFullYear());

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
  isApproving = false;
  noDataMessage: string = '';
  holidays: Holiday[] = [];
  businessDays: number = 0;

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
  currentMonth = new Date().getMonth();
  private clientNameToIdMap = new Map<string, number>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  years: number[] = this.generateYears(2020, new Date().getFullYear() + 1);

  // Propiedad computada para determinar si mostrar el toggle
  get showPeriodToggle(): boolean {
    const selectedMonth = this.monthControl.value ?? new Date().getMonth();
    const selectedYear = this.yearControl.value ?? new Date().getFullYear();

    return selectedMonth === this.currentMonth && selectedYear === this.currentYear;
  }

  private generateYears(start: number, end: number): number[] {
    const years = [];
    for (let year = start; year <= end; year++) {
      years.push(year);
    }
    return years;
  }

  ngOnInit() {
    this.periodToggleControl.setValue(this.shouldUseFullMonth());

    this.loadHolidaysAndData();

    // Suscribirse a cambios de mes y año para recalcular días laborables
    // y resetear el paginador a la primera página
    this.monthControl.valueChanges.subscribe(() => {
      this.resetPagination();
      this.loadHolidaysAndData();
    });

    this.yearControl.valueChanges.subscribe(() => {
      this.resetPagination();
      this.loadHolidaysAndData();
    });

    this.periodToggleControl.valueChanges.subscribe(() => {
      this.resetPagination();
      this.calculateBusinessDays(); // Recalcular inmediatamente
      this.loadData(); // Recargar datos para actualizar estados
    });
  }

  // Método para resetear el paginador a la primera página
  private resetPagination(): void {
    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  private shouldUseFullMonth(): boolean {
    const today = new Date();
    const currentDay = today.getDate();
    return currentDay > 15;
  }

  // Método para aprobar actividades seleccionadas
  async approveSelectedActivities() {
    if (this.isApproving || this.selection.selected.length === 0) return;
    this.isApproving = true;

    try {
      const selectedMonth = this.monthControl.value ?? new Date().getMonth();
      const selectedYear = this.yearControl.value ?? new Date().getFullYear();
      const mesCompleto = this.periodToggleControl.value ?? false;

      // Crear array de promesas para todas las aprobaciones
      const approvalPromises = this.selection.selected.map(collaborator =>
        this.approveCollaboratorActivities(collaborator, selectedMonth, selectedYear, mesCompleto)
      );

      // Ejecutar todas las aprobaciones en paralelo
      const results = await Promise.allSettled(approvalPromises);

      // Contar resultados
      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;

      // Mostrar mensaje de resultado
      this.showApprovalResult(successful, failed);

      // Recargar datos para actualizar estados
      this.loadData();

    } catch (error) {
      console.error('Error inesperado en la aprobación:', error);
      // Mostrar mensaje de error
    } finally {
      this.isApproving = false;
      this.selection.clear(); // Limpiar selección después de aprobar
    }
  }

  private showApprovalResult(successful: number, failed: number): void {
    let title = '';
    let message = '';

    if (successful > 0 && failed === 0) {
      title = 'Aprobación Exitosa';
      message = `${successful} colaborador(es) aprobado(s) exitosamente`;
    } else if (successful > 0 && failed > 0) {
      title = 'Aprobación Parcial';
      message = `${successful} colaborador(es) aprobado(s) correctamente, ${failed} fallido(s)`;
    } else if (failed > 0) {
      title = 'Error en Aprobación';
      message = `Error al aprobar ${failed} colaborador(es)`;
    } else {
      // No hay resultados (caso improbable)
      return;
    }

    this.openConfirmationDialog(title, message);
  }

  private openConfirmationDialog(title: string, message: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: title,
        message: message,
        confirmText: 'Aceptar',
        cancelText: null // Esto ocultará el botón cancelar
      }
    });

    // Opcional: si quieres hacer algo cuando se cierre el diálogo
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Diálogo cerrado con Aceptar');
      }
    });
  }

  // Método para aprobar actividades de un colaborador específico
  private async approveCollaboratorActivities(
    collaborator: Collaborator,
    month: number,
    year: number,
    fullMonth: boolean
  ): Promise<any> {
    const payload = {
      employeeID: collaborator.employeeID,
      projectID: 0, // Siempre 0 según requerimiento
      activityId: null, // Siempre null según requerimiento
      month: month + 1, // Ajustar a formato 1-12
      year: year
    };

      return this.http.post(
      `${this.urlBase}/api/DailyActivity/ApproveActivities`,
      payload
    ).toPromise();
  }

  // Método para cargar feriados y luego los datos
  loadHolidaysAndData() {
    this.updatePeriodToggleBasedOnCurrentDate();
    this.loadHolidays().subscribe({
      next: () => {
        this.calculateBusinessDays();
        this.loadData();
      },
      error: (err) => {
        console.error('Error loading holidays:', err);
        this.calculateBusinessDays(); // Calcular sin feriados si hay error
        this.loadData();
      }
    });
  }

  private updatePeriodToggleBasedOnCurrentDate(): void {
    const selectedMonth = this.monthControl.value;
    const selectedYear = this.yearControl.value;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Solo actualizar automáticamente si estamos viendo el mes y año actual
    if (selectedMonth === currentMonth && selectedYear === currentYear) {
      const shouldUseFullMonth = this.shouldUseFullMonth();
      if (this.periodToggleControl.value !== shouldUseFullMonth) {
        this.periodToggleControl.setValue(shouldUseFullMonth, { emitEvent: false });
      }
    } else {
      // Para meses que no son el actual, forzar a mes completo
      this.periodToggleControl.setValue(true, { emitEvent: false });
    }
  }

  private loadHolidays() {
    const selectedYear = this.yearControl.value ?? new Date().getFullYear();

    return this.http.get<any>(`${this.urlBase}/api/Holiday/get-all-holiday`).pipe(
      map(response => {

        // Extraer el array de feriados de la propiedad data
        if (response && response.data && Array.isArray(response.data)) {
          this.holidays = response.data.map((holiday: any) => ({
            id: holiday.id,
            date: holiday.holidayDate, // Usar holidayDate en lugar de date
            description: holiday.holidayName || 'Feriado',
            isNational: holiday.holidayType === 'NACIONAL'
          }));

          // Filtrar feriados del año seleccionado
          this.holidays = this.holidays.filter((holiday: any) => {
            try {
              const holidayDate = new Date(holiday.date);
              return holidayDate.getFullYear() === selectedYear;
            } catch (error) {
              console.warn('Fecha de feriado inválida:', holiday.date, error);
              return false;
            }
          });
        }

        return this.holidays;
      }),
      catchError(error => {
        console.error('Error loading holidays:', error);
        this.holidays = [];
        return of([]);
      })
    );
  }

  // Calcular días laborables (lunes a viernes excluyendo feriados)
  private calculateBusinessDays() {
    this.businessDays = this.calculateBusinessDaysForPeriod();

    const selectedMonth = this.monthControl.value ?? new Date().getMonth();
    const selectedYear = this.yearControl.value ?? new Date().getFullYear();
    const isFullMonth = this.periodToggleControl.value ?? false;

    if (isFullMonth) {
        // Mes completo: calcular todos los días laborables del mes
        return this.calculateBusinessDaysForMonth(selectedMonth, selectedYear);
      } else {
        // Quincena: calcular días laborables del 1 al 15
        return this.calculateBusinessDaysForFortnight(selectedMonth, selectedYear);
      }
  }

  // Verificar si una fecha es feriado
  private isDateHoliday(date: Date): boolean {
    // Crear fecha en formato YYYY-MM-DD sin problemas de zona horaria
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    return this.holidays.some(holiday => holiday.date === dateString);
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

  downloadCollaboratorExcel(collaborator: Collaborator) {
    try {
      if (!collaborator?.employeeID || !collaborator?.clienteIDs) {
        console.error('Colaborador no válido o sin clientIDs:', collaborator);
        return;
      }

      const month = this.monthControl.value ?? new Date().getMonth();
      const fullMonth = this.periodToggleControl.value ?? false;
      const year = this.yearControl.value ?? new Date().getFullYear();

      // Parsear los clientIDs
      let clientIds: number[];

      if (Array.isArray(collaborator.clienteIDs)) {
        clientIds = collaborator.clienteIDs;
      } else if (typeof collaborator.clienteIDs === 'string') {
        clientIds = collaborator.clienteIDs
          .split(',')
          .map((id: string) => parseInt(id.trim(), 10))
          .filter((id: number) => !isNaN(id));
      } else {
        console.error('Formato de clienteIDs no válido:', collaborator.clienteIDs);
        return;
      }

      if (clientIds.length === 0) {
        console.warn('No hay clientIDs válidos para este colaborador:', collaborator);
        return;
      }

      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const monthName = monthNames[month];

      let periodText = '';
      if (fullMonth) {
        periodText = `Mes Completo ${monthName} ${year}`;
      } else {
        periodText = `Quincena ${monthName} ${year}`;
      }

      // Descargar reporte para cada clientID
      clientIds.forEach((clientId, index) => {
        setTimeout(() => {
          this.downloadSingleReportForClient(
            collaborator,
            clientId,
            month,
            year,
            fullMonth,
            monthName,
            periodText,
            index
          );
        }, index * 300);
      });

    } catch (error) {
      console.error('Error inesperado:', error);
    }
  }

  private downloadSingleReportForClient(
    collaborator: any,
    clientId: number,
    month: number,
    year: number,
    fullMonth: boolean,
    monthName: string,
    periodText: string,
    index: number
  ) {
    const params = new HttpParams()
      .set('employeeId', collaborator.employeeID.toString())
      .set('clientId', clientId.toString())
      .set('year', year.toString())
      .set('month', (month + 1).toString())
      .set('fullMonth', fullMonth.toString());

    // Crear nombre de archivo único para cada cliente
    const fileName = `Reporte_${collaborator.nombre || collaborator.employeeID}_Cliente_${clientId}_${periodText}.xlsm`
      .replace(/ /g, '_');

    this.http.get(`${this.urlBase}/api/TimeReport/export-excel`, {
      params,
      responseType: 'blob'
    }).subscribe({
      next: (blob) => {
        this.saveFile(blob, fileName);
        console.log(`Descargado reporte ${index + 1} de ${this.getClientIdsCount(collaborator)} para ${collaborator.nombre}`);
      },
      error: (err) => {
        console.error(`Error descargando reporte para cliente ${clientId}:`, err);
      }
    });
  }

  // Método auxiliar para contar clientIDs
  private getClientIdsCount(collaborator: Collaborator): number {
    if (!collaborator?.clienteIDs) return 0;

    if (Array.isArray(collaborator.clienteIDs)) {
      return collaborator.clienteIDs.length;
    }

    if (typeof collaborator.clienteIDs === 'string') {
      return collaborator.clienteIDs.split(',').length;
    }

    return 0;
  }

  private getClientIdFromCollaborator(collaborator: Collaborator): number {
    if (collaborator.projectData?.clientID) {
      return collaborator.projectData.clientID;
    }

    if (collaborator.clientData?.id) {
      return collaborator.clientData.id;
    }

    const clientName = collaborator.cliente;
    if (this.clientNameToIdMap.has(clientName)) {
      return this.clientNameToIdMap.get(clientName)!;
    }

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

      let downloadCount = 0;
      const totalDownloads = this.calculateTotalDownloads();

      for (const collaborator of this.selection.selected) {
        try {
          if (!collaborator.clienteIDs) {
            console.warn(`Colaborador ${collaborator.nombre} no tiene clientIDs`);
            continue;
          }

          const clientIds = this.parseClientIds(collaborator.clienteIDs);

          for (const clientId of clientIds) {
            const params = new HttpParams()
              .set('employeeId', collaborator.employeeID.toString())
              .set('clientId', clientId.toString())
              .set('year', year.toString())
              .set('month', (month + 1).toString())
              .set('fullMonth', fullMonth.toString());

            const fileName = this.generateReportFileName(collaborator, clientId, month, fullMonth);
            await this.downloadSingleReport(params, fileName);
            downloadCount++;
            console.log(`Descargado ${downloadCount} de ${totalDownloads}`);
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        } catch (error) {
          console.error(`Error descargando reportes para ${collaborator.nombre}:`, error);
        }
      }
    } finally {
      this.isDownloading = false;
    }
  }

  private calculateTotalDownloads(): number {
    let total = 0;
    for (const collaborator of this.selection.selected) {
      if (collaborator.clienteIDs) {
        total += this.parseClientIds(collaborator.clienteIDs).length;
      }
    }
    return total;
  }

  private parseClientIds(clientIds: string | number[]): number[] {
    if (Array.isArray(clientIds)) {
      return clientIds;
    }

    if (typeof clientIds === 'string') {
      return clientIds
        .split(',')
        .map((id: string) => parseInt(id.trim(), 10))
        .filter((id: number) => !isNaN(id));
    }

    return [];
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

  private generateReportFileName(collaborator: any, clientId: number, month: number, fullMonth: boolean): string {
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const monthName = monthNames[month];

    const periodText = fullMonth
      ? `Mes_Completo_${monthName}_${this.currentYear}`
      : `Quincena_${monthName}_${this.currentYear}`;

    return `Reporte_${(collaborator.nombre || collaborator.employeeID).toString().replace(/[^a-z0-9]/gi, '_')}_Cliente_${clientId}_${periodText}.xlsm`;
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  updateDateRange() {
    const selectedMonth = this.monthControl.value ?? new Date().getMonth();
    const year = this.yearControl.value ?? new Date().getFullYear();
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

  private calculateBusinessDaysForPeriod(): number {
    const selectedMonth = this.monthControl.value ?? new Date().getMonth();
    const selectedYear = this.yearControl.value ?? new Date().getFullYear();
    const isFullMonth = this.periodToggleControl.value ?? false;

    if (isFullMonth) {
      // Mes completo: calcular todos los días laborables del mes
      return this.calculateBusinessDaysForMonth(selectedMonth, selectedYear);
    } else {
      // Quincena: calcular días laborables del 1 al 15
      return this.calculateBusinessDaysForFortnight(selectedMonth, selectedYear);
    }
  }

  private calculateBusinessDaysForMonth(month: number, year: number): number {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let businessDays = 0;
    const currentDate = new Date(firstDay);

    while (currentDate <= lastDay) {
      const dayOfWeek = currentDate.getDay();

      // Es día de semana (lunes a viernes)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        // Verificar si no es feriado
        const isHoliday = this.isDateHoliday(currentDate);
        if (!isHoliday) {
          businessDays++;
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return businessDays;
  }

  private calculateBusinessDaysForFortnight(month: number, year: number): number {
    const firstDay = new Date(year, month, 1);
    const fifteenthDay = new Date(year, month, 15);

    let businessDays = 0;
    const currentDate = new Date(firstDay);

    while (currentDate <= fifteenthDay) {
      const dayOfWeek = currentDate.getDay();

      // Es día de semana (lunes a viernes)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        // Verificar si no es feriado
        const isHoliday = this.isDateHoliday(currentDate);
        if (!isHoliday) {
          businessDays++;
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return businessDays;
  }

  loadData() {
    const selectedMonth = this.monthControl.value ?? new Date().getMonth();
    const selectedYear = this.yearControl.value ?? new Date().getFullYear();
    const mesCompleto = this.periodToggleControl.value ?? false;

    this.calculateBusinessDays();

    this.http.get<any[]>(
      `${this.urlBase}/api/TimeReport/recursos-pendientes`,
      {
        params: {
          month: selectedMonth + 1,
          year: selectedYear,
          mesCompleto: mesCompleto.toString()
        }
      }
    ).pipe(
      catchError(error => {
        console.error('Error loading employees:', error);
        this.dataSource.data = [];
        this.noDataMessage = 'Error al cargar los datos. Por favor, inténtalo de nuevo.';
        this.resetPagination();
        return of([]);
      })
    ).subscribe({
      next: (employees) => {
        if (!employees || employees.length === 0) {
          this.dataSource.data = [];
          this.noDataMessage = 'No hay empleados que hayan registrado actividades durante ese periodo.';
          this.resetPagination();
          return;
        }

        const collaborators = employees.map(emp => ({
          employeeID: emp.employeeID,
          nombre: emp.nombreCompletoEmpleado,
          cedula: emp.codigoEmpleado,
          proyecto: emp.proyectosAsignados,
          cliente: emp.clientesAsociados,
          clienteIDs: emp.clienteIDs, // Agregar esta línea
          lider: emp.lideresTecnicos,
          horas: emp.horasRegistradasPeriodo,
          estado: this.getEstado(emp.horasRegistradasPeriodo),
          horasRegistradasPeriodo: emp.horasRegistradasPeriodo,
          projectData: undefined,
          clientData: undefined
        }));

        const filteredCollaborators = collaborators.filter(colaborador => colaborador.horas > 0);

        if (filteredCollaborators.length === 0) {
          this.noDataMessage = 'No hay empleados que hayan registrado actividades durante ese periodo.';
        } else {
          this.noDataMessage = '';
        }

        this.dataSource.data = filteredCollaborators;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.totalItems = filteredCollaborators.length;

        // Resetear a la primera página después de cargar nuevos datos
        this.resetPagination();
      },
      error: (err) => {
        console.error('Error loading data:', err);
        this.dataSource.data = [];
        this.noDataMessage = 'Ocurrió un error al cargar los datos. Por favor, inténtalo de nuevo.';
        this.resetPagination();
      }
    });
  }

  // Método auxiliar para determinar el estado basado en las horas
  private getEstado(horasRegistradas: number): string {
    const horasEsperadas = this.businessDays * 8; // 8 horas por día laborable

    if (horasEsperadas === 0) return 'Pendiente'; // Evitar división por cero

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
