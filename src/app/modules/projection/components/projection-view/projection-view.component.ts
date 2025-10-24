// projection-view.component.ts
import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { ProjectionDialogComponent } from '../projection-dialog/projection-dialog.component';

// Interfaces (mantén las mismas que tenías)
interface ProjectionResponse {
  groupProjection: string;
  resourceTypeId: number;
  resourceTypeName: string;
  resource_name: string;
  projection_name: string;
  hourly_cost: number;
  resource_quantity: number;
  time_distribution: string;
  total_time: number;
  resource_cost: number;
  participation_percentage: number;
  period_type: boolean;
  period_quantity: number;
}

interface PositionCatalog {
  id: number;
  positionName: string;
  department: string;
  description?: string;
}

interface Period {
  value: string;
  viewValue: string;
}

interface ResourceRow {
  [key: string]: any;
  tipoRecurso: string;
  nombreRecurso: string;
  costoPorHora: number;
  cantidadRecursos: number;
  tiempoTotal: number;
  costoRecurso: number;
  porcentajeParticipacion: number;
  resourceTypeId?: number;
  isExisting?: boolean;
  isActive?: boolean;
}

interface CreateProjectionRequest {
  groupProjection: string | null;
  resourceTypeId: number;
  resourceName: string;
  projectName: string;
  hourlyCost: number;
  resourceQuantity: number;
  timeDistribution: number[];
  totalTime: number;
  resourceCost: number;
  participationPercentage: number;
  periodType: boolean;
  periodQuantity: number;
}

interface UpdateProjectionRequest {
  resourceTypeId: number;
  resourceName: string;
  projectionName: string;
  hourlyCost: number;
  resourceQuantity: number;
  timeDistribution: number[];
  totalTime: number;
  resourceCost: number;
  participationPercentage: number;
}

interface ResourceStatusRequest {
  isActive: boolean;
}

@Component({
  selector: 'projection-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule
  ],
  templateUrl: './projection-view.component.html',
  styleUrls: ['./projection-view.component.scss']
})
export class ProjectionViewComponent implements OnInit, OnChanges {
  @Input() groupProjection!: string | number;

  private urlBase: string = environment.URL_BASE;

  // Configuración
  periods: Period[] = [
    { value: 'meses', viewValue: 'Meses' },
    { value: 'semanas', viewValue: 'Semanas' },
  ];

  // Datos
  positionsCatalog: PositionCatalog[] = [];
  isLoadingPositions: boolean = false;
  showTable: boolean = false;
  isRemoving: boolean = false;

  // Configuración de periodos
  selectedPeriod: string = 'meses';
  periodQuantity: number = 6;

  // Tabla
  dynamicColumns: string[] = [];
  displayedColumns: string[] = [];
  dataSource: ResourceRow[] = [];

  // Totales
  totalTiempo: number = 0;
  totalCosto: number = 0;

  // Información del grupo
  projectionName: string = '';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog

  ) {
    console.log('🔧 ProjectionViewComponent constructor llamado');
  }

  ngOnInit() {
    console.log('🔄 ngOnInit llamado, projectId:', this.groupProjection);
    this.loadPositionsCatalog();

    // Si no hay projectId como input, intenta cargar desde la ruta
    if (!this.groupProjection) {
      this.loadGroupProjectionFromRoute();
    } else {
      this.loadProjectionData();
    }
  }

  isNewProjection(): boolean {
    return this.groupProjection === 'new' || this.groupProjection === 0 || !this.groupProjection;
  }

  ngOnChanges(changes: SimpleChanges) {
    // Reaccionar cuando cambie el projectId desde el padre
    if (changes['projectId'] && !changes['projectId'].firstChange) {
      console.log('🔄 projectId cambió:', changes['projectId'].currentValue);
      this.loadProjectionData();
    }
  }

  // Cargar el groupProjection desde la ruta (si no se usa projectId como input)
  loadGroupProjectionFromRoute() {
    this.route.paramMap.subscribe(params => {
      this.groupProjection = params.get('groupProjection') || '';
      console.log('🎯 groupProjection desde ruta:', this.groupProjection);

      if (this.groupProjection) {
        this.loadProjectionData();
      }
    });
  }

  // El resto de los métodos se mantienen igual...
  loadPositionsCatalog() {
    this.isLoadingPositions = true;

    this.http.get<PositionCatalog[]>(`${this.urlBase}/api/Catalog/positions`).subscribe({
      next: (positions) => {
        this.positionsCatalog = positions;
        this.isLoadingPositions = false;
        console.log('📊 Catálogo de posiciones cargado:', this.positionsCatalog);

        // Si estamos cargando una proyección existente, procesar los datos
        if (!this.isNewProjection()) {
          this.loadProjectionData();
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar el catálogo de posiciones:', error);
        this.snackBar.open('Error al cargar el catálogo de posiciones', 'Cerrar', {
          duration: 5000
        });
        this.isLoadingPositions = false;

        // Cargar datos de proyección incluso si falla el catálogo
        if (!this.isNewProjection()) {
          this.loadProjectionData();
        }
      }
    });
  }

  loadProjectionData() {
    // Si es una nueva proyección (groupProjection es 'new' o 0)
    if (this.groupProjection === 'new' || this.groupProjection === 0) {
      console.log('🆕 Inicializando nueva proyección');
      this.initializeNewProjection();
      return;
    }

    // Si tenemos projectId, usamos ese endpoint
    if (this.groupProjection != 0) {
      this.loadProjectionByProjectId();
    }
    // Si tenemos groupProjection, usamos ese endpoint
    else if (this.groupProjection) {
      this.loadProjectionByGroup();
    } else {
      console.error('❌ No hay projectId ni groupProjection disponible');
      this.initializeNewProjection();
    }
  }

  initializeNewProjection() {
    console.log('📝 Inicializando proyección en blanco');
    this.projectionName = 'Nueva Proyección';
    this.selectedPeriod = 'meses';
    this.periodQuantity = 6;
    this.applyConfiguration();
  }

  loadProjectionByProjectId() {
    const url = `${this.urlBase}/api/ProjectionHour/${this.groupProjection}/get-by-guid`;
    console.log('🌐 Cargando datos por projectId desde:', url);

    this.http.get<ProjectionResponse[]>(url).subscribe({
      next: (data) => {
        this.processProjectionData(data);
      },
      error: (error) => {
        console.error('❌ Error al cargar datos por projectId:', error);
        this.snackBar.open('Error al cargar los datos de la proyección', 'Cerrar', { duration: 5000 });
      }
    });
  }

  loadProjectionByGroup() {
    const url = `${this.urlBase}/api/ProjectionHour/${this.groupProjection}/get-by-guid`;

    this.http.get<ProjectionResponse[]>(url).subscribe({
      next: (data) => {
        this.processProjectionData(data);
      },
      error: (error) => {
        console.error('❌ Error al cargar datos por groupProjection:', error);
        this.snackBar.open('Error al cargar los datos de la proyección', 'Cerrar', { duration: 5000 });
      }
    });
  }

  // El resto de los métodos (processProjectionData, parseTimeDistribution, etc.) se mantienen igual
  processProjectionData(projectionData: ProjectionResponse[]) {
    if (!projectionData || projectionData.length === 0) {
      this.initializeEmptyTable();
      return;
    }

    const firstItem = projectionData[0];
    this.selectedPeriod = firstItem.period_type ? 'semanas' : 'meses';
    this.periodQuantity = firstItem.period_quantity;
    this.projectionName = firstItem.projection_name;

    this.generateDynamicColumns();

    this.dataSource = projectionData.map(item => {
      const timeDistribution = this.parseTimeDistribution(item.time_distribution);

      const row: ResourceRow = {
        tipoRecurso: item.resourceTypeName,
        nombreRecurso: item.resource_name,
        costoPorHora: item.hourly_cost,
        cantidadRecursos: item.resource_quantity,
        tiempoTotal: item.total_time,
        costoRecurso: item.resource_cost,
        porcentajeParticipacion: item.participation_percentage,
        resourceTypeId: item.resourceTypeId,
        isExisting: true,
        isActive: true // Por defecto asumimos que está activo
      };

      this.dynamicColumns.forEach((col, index) => {
        row[col] = timeDistribution[index] || 0;
      });

      return row;
    });

    this.showTable = true;
    this.calculateTotals();

    console.log('📊 Datos de proyección cargados:', {
      groupProjection: this.groupProjection,
      projectionName: this.projectionName,
      rows: this.dataSource.length
    });
  }

  private parseTimeDistribution(timeDistribution: string): number[] {
    try {
      if (typeof timeDistribution === 'string') {
        const cleanString = timeDistribution.replace(/[\[\]]/g, '');
        return cleanString.split(',').map(num => {
          const parsed = Number(num.trim());
          return isNaN(parsed) ? 0 : parsed;
        });
      }
      return [];
    } catch (error) {
      console.error('❌ Error al parsear time_distribution:', error);
      return Array(this.periodQuantity).fill(0);
    }
  }

  generateDynamicColumns() {
    this.dynamicColumns = [];
    for (let i = 1; i <= this.periodQuantity; i++) {
      this.dynamicColumns.push(`periodo${i}`);
    }

    this.displayedColumns = [
      'tipoRecurso',
      'nombreRecurso',
      'costoPorHora',
      'cantidadRecursos',
      ...this.dynamicColumns,
      'tiempoTotal',
      'costoRecurso',
      'porcentajeParticipacion',
      'estado',
      'acciones'
    ];

    console.log('📊 Columnas generadas:', {
      dynamicColumns: this.dynamicColumns,
      displayedColumns: this.displayedColumns
    });
  }

  initializeEmptyTable() {
    console.log('📭 Inicializando tabla vacía');
    this.applyConfiguration();
  }

  applyConfiguration() {
    if (!this.periodQuantity || this.periodQuantity < 1) {
      this.snackBar.open('La cantidad de períodos debe ser mayor a 0', 'Cerrar', { duration: 3000 });
      return;
    }

    console.log('⚙️ Aplicando configuración:', {
      periodos: this.periodQuantity,
      tipo: this.selectedPeriod
    });

    // Primero generar las nuevas columnas dinámicas
    this.generateDynamicColumns();

    // Si hay datos existentes, actualizar las filas con las nuevas columnas
    if (this.dataSource.length > 0) {
      // Crear una copia actualizada de los datos
      const updatedDataSource = this.dataSource.map(row => {
        const updatedRow: ResourceRow = {
          ...this.createEmptyRow(), // Crear una fila base con las nuevas columnas
          // Mantener los valores existentes de las columnas fijas
          tipoRecurso: row.tipoRecurso || '',
          nombreRecurso: row.nombreRecurso || '',
          costoPorHora: row.costoPorHora || 0,
          cantidadRecursos: row.cantidadRecursos || 1,
          // Mantener los valores de tiempo para las columnas que existen en ambos conjuntos
          ...this.preserveExistingTimeValues(row)
        };

        return updatedRow;
      });

      this.dataSource = updatedDataSource;
    } else {
      // Si no hay datos, crear una fila vacía
      this.dataSource = [this.createEmptyRow()];
    }

    this.showTable = true;
    this.calculateTotals();
    console.log('✅ Configuración aplicada exitosamente. Columnas:', this.dynamicColumns);
  }

  cancelEdit() {
    // Recargar los datos originales
    this.loadProjectionData();
    this.snackBar.open('Cambios descartados', 'Cerrar', { duration: 3000 });
  }

  private preserveExistingTimeValues(row: ResourceRow): Partial<ResourceRow> {
    const preservedValues: Partial<ResourceRow> = {};

    this.dynamicColumns.forEach((col, index) => {
      // Si la columna existía antes, mantener su valor
      if (row[col] !== undefined) {
        preservedValues[col] = Number(row[col]) || 0;
      } else {
        // Si es una nueva columna, inicializar en 0
        preservedValues[col] = 0;
      }
    });

    return preservedValues;
  }

  createEmptyRow(): ResourceRow {
    const row: ResourceRow = {
      tipoRecurso: '',
      nombreRecurso: '',
      costoPorHora: 0,
      cantidadRecursos: 1,
      tiempoTotal: 0,
      costoRecurso: 0,
      porcentajeParticipacion: 0,
      isExisting: false,
      isActive: true
    };

    this.dynamicColumns.forEach(col => {
      row[col] = 0;
    });

    this.dynamicColumns.forEach(col => {
      row[col] = 0;
    });

    return row;
  }

  getColumnHeader(index: number): string {
    const prefix = this.selectedPeriod === 'meses' ? 'Mes' : 'Semana';
    return `${prefix} ${index + 1}`;
  }

  onResourceTypeChange(index: number) {
    console.log('🔄 Tipo de recurso cambiado en fila:', index);
    this.calculateTotals();
  }

  addRow() {
    const newRow = this.createEmptyRow();

    // Si es una proyección existente, marcar como nueva fila
    if (!this.isNewProjection()) {
      newRow.isExisting = false;
      newRow.isActive = true;
    }

    this.dataSource.push(newRow);
    this.dataSource = [...this.dataSource];
    this.calculateTotals();
  }

  removeRow(index: number) {
    const row = this.dataSource[index];

    // Si es una proyección existente y la fila tiene resourceTypeId, inactivar en lugar de eliminar
    if (!this.isNewProjection() && row.resourceTypeId && row.isExisting) {
      // Preguntar confirmación antes de inactivar
      const confirmMessage = `¿Está seguro de que desea inactivar el recurso "${row.nombreRecurso}"?`;

      if (confirm(confirmMessage)) {
        this.inactivateResource(row, index);
      }
    } else {
      // Para nuevas proyecciones o filas nuevas, eliminar directamente
      if (this.dataSource.length > 1) {
        this.dataSource.splice(index, 1);
        this.dataSource = [...this.dataSource];
        this.calculateTotals();
        this.snackBar.open('Fila eliminada', 'Cerrar', { duration: 2000 });
      } else {
        this.snackBar.open('Debe haber al menos una fila en la tabla', 'Cerrar', { duration: 3000 });
      }
    }
  }

  calculateTotals() {
    let totalTiempo = 0;
    let totalCosto = 0;

    // Filtrar solo recursos activos para el cálculo
    const activeRows = this.dataSource.filter(row => row.isActive !== false);

    activeRows.forEach(row => {
      let tiempoRow = 0;
      this.dynamicColumns.forEach(col => {
        tiempoRow += Number(row[col]) || 0;
      });

      row.tiempoTotal = tiempoRow;
      row.costoRecurso = tiempoRow * (row.costoPorHora || 0) * (row.cantidadRecursos || 1);

      totalTiempo += row.tiempoTotal;
      totalCosto += row.costoRecurso;
    });

    // Calcular porcentajes solo para recursos activos
    activeRows.forEach(row => {
      row.porcentajeParticipacion = totalTiempo > 0 ? (row.tiempoTotal / totalTiempo) * 100 : 0;
    });

    this.totalTiempo = totalTiempo;
    this.totalCosto = totalCosto;
  }

  canSaveProjection(): boolean {
    return this.dataSource.length > 0 &&
           this.dataSource.some(row => row.tipoRecurso && row.tipoRecurso.trim() !== '');
  }

  saveAllProjections() {
    if (!this.canSaveProjection()) {
      this.snackBar.open('Complete al menos un tipo de recurso para guardar', 'Cerrar', { duration: 3000 });
      return;
    }

    if (this.isNewProjection()) {
      this.openProjectionNameDialog();
    } else {
      this.updateExistingProjection();
    }
  }

  toggleResourceStatus(row: ResourceRow, index: number) {
    // Validar que sea una proyección existente
    if (this.isNewProjection()) {
      this.snackBar.open('Esta funcionalidad solo está disponible para proyecciones existentes', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    // Validar que tenga resourceTypeId
    if (!row.resourceTypeId) {
      this.snackBar.open('No se puede cambiar el estado de un recurso sin ID', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    const newStatus = !row.isActive;
    const action = newStatus ? 'activar' : 'inactivar';

    console.log(`🔄 ${action.toUpperCase()} recurso:`, {
      groupProjection: this.groupProjection,
      resourceTypeId: row.resourceTypeId,
      active: newStatus,
      resourceName: row.nombreRecurso
    });

    // Llamar al servicio con los 3 parámetros
    this.http.put(
      `${this.urlBase}/api/ProjectionHour/${this.groupProjection}/activate-inactivate/${row.resourceTypeId}?active=${newStatus}`,
      {} // Body vacío ya que los parámetros van en la URL
    ).subscribe({
      next: () => {
        // Actualizar el estado localmente
        row.isActive = newStatus;
        this.dataSource = [...this.dataSource];

        this.snackBar.open(`Recurso ${action}do exitosamente`, 'Cerrar', {
          duration: 3000
        });

        console.log(`✅ Recurso ${action}do:`, row.nombreRecurso);

        // Recalcular totals
        this.calculateTotals();
      },
      error: (error) => {
        console.error(`❌ Error al ${action} recurso:`, error);
        this.snackBar.open(`Error al ${action} el recurso`, 'Cerrar', {
          duration: 5000
        });
      }
    });
  }

  exportToExcel() {
    // Validar que sea una proyección existente
    if (this.isNewProjection()) {
      this.snackBar.open('Solo se pueden exportar proyecciones existentes', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    // Validar que tengamos datos
    if (!this.showTable || this.dataSource.length === 0) {
      this.snackBar.open('No hay datos para exportar', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    console.log('📊 Exportando a Excel:', {
      groupProjection: this.groupProjection,
      projectionName: this.projectionName
    });

    // Mostrar loading
    const loadingSnackbar = this.snackBar.open('Generando archivo Excel...', 'Cerrar');

    // Llamar al servicio de exportación
    this.http.get(
      `${this.urlBase}/api/ProjectionHour/${this.groupProjection}/export-excel`,
      {
        responseType: 'blob' // Importante: especificar que la respuesta es un blob
      }
    ).subscribe({
      next: (blob: Blob) => {
        // Cerrar el loading
        loadingSnackbar.dismiss();

        // Crear y descargar el archivo
        this.downloadFile(blob);

        this.snackBar.open('Archivo Excel generado exitosamente', 'Cerrar', {
          duration: 5000
        });

        console.log('✅ Archivo Excel generado');
      },
      error: (error) => {
        // Cerrar el loading
        loadingSnackbar.dismiss();

        console.error('❌ Error al exportar a Excel:', error);

        let errorMessage = 'Error al generar el archivo Excel';

        if (error.status === 404) {
          errorMessage = 'Proyección no encontrada';
        } else if (error.status === 500) {
          errorMessage = 'Error interno al generar el archivo';
        }

        this.snackBar.open(errorMessage, 'Cerrar', {
          duration: 5000
        });
      }
    });
  }

  private downloadFile(blob: Blob) {
    // Crear un enlace temporal para la descarga
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // Generar nombre del archivo
    const fileName = this.generateFileName();
    link.download = fileName;

    // Simular click para descargar
    document.body.appendChild(link);
    link.click();

    // Limpiar
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  private generateFileName(): string {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const safeProjectName = this.projectionName
      ? this.projectionName.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, '').replace(/\s+/g, '_')
      : 'proyeccion';

    return `Proyeccion_${safeProjectName}_${timestamp}.xlsx`;
  }

  canExportToExcel(): boolean {
    return !this.isNewProjection() && this.showTable && this.dataSource.length > 0;
  }

  private createNewProjection(projectName: string) {
    // Validar que tenga recursos válidos
    const validResources = this.dataSource.filter(row =>
      row.tipoRecurso && row.tipoRecurso.trim() !== ''
    );

    if (validResources.length === 0) {
      this.snackBar.open('No hay recursos válidos para crear la proyección', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    console.log('📤 Creando nueva proyección con nombre:', projectName);

    // Crear requests para cada recurso en la tabla
    const createRequests = validResources.map(row =>
      this.createProjectionRequest(row, projectName)
    );

    // Enviar cada request individualmente
    const requests = createRequests.map(request =>
      this.http.post(`${this.urlBase}/api/ProjectionHour/create`, request)
    );

    // Mostrar loading
    this.snackBar.open('Creando proyección...', 'Cerrar', { duration: 2000 });

    // Ejecutar todas las requests
    Promise.all(requests.map(request => request.toPromise()))
      .then(() => {
        this.snackBar.open('Proyección creada exitosamente', 'Cerrar', {
          duration: 5000
        });
        console.log('✅ Proyección creada con nombre:', projectName);

        // Redirigir a la lista de proyecciones
        this.router.navigate(['../'], { relativeTo: this.route });
      })
      .catch(error => {
        console.error('❌ Error al crear proyección:', error);
        this.snackBar.open('Error al crear la proyección', 'Cerrar', {
          duration: 5000
        });
      });
  }

  activateResource(row: ResourceRow, index: number) {
    if (!row.isActive) {
      this.toggleResourceStatus(row, index);
    }
  }

  inactivateResource(row: ResourceRow, index: number) {
    if (row.isActive) {
      this.toggleResourceStatus(row, index);
    }
  }

  reactivateResource(row: ResourceRow, index: number) {
    this.toggleResourceStatus(row, index);
  }

  getActiveResources(): ResourceRow[] {
    return this.dataSource.filter(row => row.isActive !== false);
  }

  private openProjectionNameDialog(): void {
    const dialogRef = this.dialog.open(ProjectionDialogComponent, {
      width: '500px',
      data: { projectName: this.projectionName === 'Nueva Proyección' ? '' : this.projectionName }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('📝 Nombre de proyección establecido:', result);
        this.createNewProjection(result);
      } else {
        console.log('❌ Diálogo cerrado sin nombre');
        this.snackBar.open('La proyección necesita un nombre para ser creada', 'Cerrar', {
          duration: 3000
        });
      }
    });
  }

  private updateExistingProjection() {
    console.log('💾 Actualizando proyección existente...', this.dataSource);

    // Validar que tengamos un groupProjection válido
    if (!this.groupProjection || this.groupProjection === 'new' || this.groupProjection === 0) {
      this.snackBar.open('No se puede actualizar una proyección sin ID válido', 'Cerrar', {
        duration: 5000
      });
      return;
    }

    // Filtrar recursos válidos para actualizar
    const validResources = this.dataSource.filter(row =>
      row.tipoRecurso && row.tipoRecurso.trim() !== '' &&
      row.resourceTypeId !== undefined
    );

    if (validResources.length === 0) {
      this.snackBar.open('No hay recursos válidos para actualizar', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    console.log('📤 Actualizando proyección con groupProjection:', this.groupProjection);

    // Crear requests para cada recurso en la tabla
    const updateRequests = validResources.map(row =>
      this.updateProjectionRequest(row)
    );

    // Enviar cada request individualmente
    const requests = updateRequests.map(request =>
      this.http.put(
        `${this.urlBase}/api/ProjectionHour/${this.groupProjection}/update/${request.resourceTypeId}`,
        request
      )
    );

    // Mostrar loading
    this.snackBar.open('Actualizando proyección...', 'Cerrar', { duration: 2000 });

    // Ejecutar todas las requests
    Promise.all(requests.map(request => request.toPromise()))
      .then(() => {
        this.snackBar.open('Proyección actualizada exitosamente', 'Cerrar', {
          duration: 5000
        });
        console.log('✅ Proyección actualizada con groupProjection:', this.groupProjection);

        // Opcional: Recargar los datos para verificar
        this.loadProjectionData();
      })
      .catch(error => {
        console.error('❌ Error al actualizar proyección:', error);
        this.snackBar.open('Error al actualizar la proyección', 'Cerrar', {
          duration: 5000
        });
      });
  }

  private updateProjectionRequest(row: ResourceRow): UpdateProjectionRequest {
    // Obtener el resourceTypeId (usar el existente o buscar en el catálogo)
    let resourceTypeId = row.resourceTypeId;

    // Si no tiene resourceTypeId, buscarlo en el catálogo
    if (!resourceTypeId) {
      const position = this.positionsCatalog.find(p => p.positionName === row.tipoRecurso);
      resourceTypeId = position ? position.id : 0;
    }

    // Obtener la distribución de tiempo
    const timeDistribution = this.dynamicColumns.map(col => Number(row[col]) || 0);

    return {
      resourceTypeId: resourceTypeId,
      resourceName: row.nombreRecurso || '',
      projectionName: this.projectionName || '',
      hourlyCost: Number(row.costoPorHora) || 0,
      resourceQuantity: Number(row.cantidadRecursos) || 1,
      timeDistribution: timeDistribution,
      totalTime: Number(row.tiempoTotal) || 0,
      resourceCost: Number(row.costoRecurso) || 0,
      participationPercentage: Number(row.porcentajeParticipacion) || 0
    };
  }

  private createProjectionRequest(row: ResourceRow, projectName: string): CreateProjectionRequest {
    // Obtener el resourceTypeId del catálogo
    const position = this.positionsCatalog.find(p => p.positionName === row.tipoRecurso);
    const resourceTypeId = position ? position.id : 0;

    // Obtener la distribución de tiempo
    const timeDistribution = this.dynamicColumns.map(col => Number(row[col]) || 0);

    return {
      groupProjection: null,
      resourceTypeId: resourceTypeId,
      resourceName: row.nombreRecurso,
      projectName: projectName, // ← Usar el nombre del parámetro
      hourlyCost: Number(row.costoPorHora) || 0,
      resourceQuantity: Number(row.cantidadRecursos) || 1,
      timeDistribution: timeDistribution,
      totalTime: Number(row.tiempoTotal) || 0,
      resourceCost: Number(row.costoRecurso) || 0,
      participationPercentage: Number(row.porcentajeParticipacion) || 0,
      periodType: this.selectedPeriod === 'semanas',
      periodQuantity: this.periodQuantity
    };
  }

}
