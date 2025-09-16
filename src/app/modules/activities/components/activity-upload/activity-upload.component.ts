import { SelectionModel } from '@angular/cdk/collections';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { catchError, of } from 'rxjs';
import { MatSelectModule } from '@angular/material/select';
import { Collaborator } from '../../interfaces/activity.interface';
import { environment } from '../../../../../environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { ExcelUploadDialogComponent } from '../excel-upload-dialog/excel-upload-dialog.component';

@Component({
  selector: 'activity-upload',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
    MatTableModule,
    ReactiveFormsModule
  ],
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './activity-upload.component.html',
  styleUrl: './activity-upload.component.scss'
})
export class ActivityUploadComponent implements OnInit {

  private http = inject(HttpClient);
  private dialog = inject(MatDialog);
  urlBase: string = environment.URL_BASE;

  monthControl = new FormControl<number>(new Date().getMonth());
  yearControl = new FormControl<number>(new Date().getFullYear());

  periodToggleControl = new FormControl<boolean>(this.shouldUseFullMonth());

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
  noDataMessage: string = '';

  displayedColumns: string[] = ['select', 'colaborador', 'proyecto', 'cliente', 'lider', 'horas', 'estado', 'actions'];
  dataSource: MatTableDataSource<Collaborator> = new MatTableDataSource<Collaborator>([]);
  selection = new SelectionModel<Collaborator>(true, []);
  searchControl = new FormControl('');
  totalItems = 0;
  pageSize = 10;

  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

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

    // Suscribirse a cambios de mes y año
    this.monthControl.valueChanges.subscribe(() => {
      this.resetPagination();
      this.loadData();
    });

    this.yearControl.valueChanges.subscribe(() => {
      this.resetPagination();
      this.loadData();
    });
  }

  private resetPagination(): void {
    if (this.paginator) {
      this.paginator.firstPage();
    }
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

  private shouldUseFullMonth(): boolean {
    const today = new Date();
    const currentDay = today.getDate();
    return currentDay > 15;
  }

  uploadExcel() {
    const dialogRef = this.dialog.open(ExcelUploadDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result && result.success) {
        // Recargar datos después de subir el archivo exitosamente
        this.loadData();
      }
    });
  }

  private handleExcelUpload(file: File): void {
    console.log('Archivo seleccionado:', file.name);

    // Aquí implementarías la lógica para subir el archivo al servidor
    // Por ejemplo:
    const formData = new FormData();
    formData.append('excelFile', file);
    formData.append('month', (this.monthControl.value ?? new Date().getMonth() + 1).toString());
    formData.append('year', (this.yearControl.value ?? new Date().getFullYear()).toString());

    this.http.post(`${this.urlBase}/api/TimeReport/upload-excel`, formData, {
      reportProgress: true,
      observe: 'events'
    }).subscribe({
      next: (event) => {
        // Manejar progreso y respuesta
        console.log('Evento de upload:', event);
      },
      error: (error) => {
        console.error('Error al subir el archivo:', error);
        // Aquí podrías mostrar un mensaje de error al usuario
      },
      complete: () => {
        console.log('Upload completado');
        // Recargar datos después de subir el archivo
        this.loadData();
      }
    });
  }

  // Método para descargar reportes seleccionados
  async downloadSelectedReports() {
    if (this.isDownloading) return;
    this.isDownloading = true;

    try {
      if (this.selection.selected.length === 0) {
        console.warn('No hay colaboradores seleccionados');
        return;
      }

      const month = this.monthControl.value ?? new Date().getMonth();
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
              .set('fullMonth', 'true'); // Siempre mes completo para esta vista

            const fileName = this.generateReportFileName(collaborator, clientId, month);
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

  private generateReportFileName(collaborator: any, clientId: number, month: number): string {
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const monthName = monthNames[month];

    const periodText = `Mes_Completo_${monthName}_${this.currentYear}`;

    return `Reporte_${(collaborator.nombre || collaborator.employeeID).toString().replace(/[^a-z0-9]/gi, '_')}_Cliente_${clientId}_${periodText}.xlsm`;
  }

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

  private saveFile(blob: Blob, fileName: string) {
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(link.href);
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.dataSource.data.forEach(row => this.selection.select(row));
  }

  loadData() {
    const selectedMonth = this.monthControl.value ?? new Date().getMonth();
    const selectedYear = this.yearControl.value ?? new Date().getFullYear();

    this.http.get<any[]>(
      `${this.urlBase}/api/TimeReport/recursos-pendientes-filtrado`,
      {
        params: {
          month: (selectedMonth + 1).toString(),
          year: selectedYear.toString(),
          mesCompleto: 'true',
          bancoGuayaquil: '1'
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
          clienteIDs: emp.clienteIDs,
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

        // Asegurar que el paginador y ordenamiento estén configurados
        setTimeout(() => {
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        });

        this.totalItems = filteredCollaborators.length;
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

  private getEstado(horasRegistradas: number): string {
    // Lógica simplificada para el estado
    if (horasRegistradas === 0) return 'Pendiente';
    if (horasRegistradas < 120) return 'En progreso'; // Asumiendo 15 días * 8 horas = 120 horas
    return 'Completo';
  }
}
