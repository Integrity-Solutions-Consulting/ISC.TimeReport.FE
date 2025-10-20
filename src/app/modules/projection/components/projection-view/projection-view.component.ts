import { ProjectService } from '../../../projects/services/project.service';
// projection-view.component.ts
import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { Period, PositionCatalog, ProjectionResponse, ResourceRow, ResourceRowBase } from '../../../projects/interfaces/project.interface';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { ActivatedRoute } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { ConfirmationDialogComponent } from '../../../projects/components/confirmation-dialog/confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

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
  styleUrl: './projection-view.component.scss'
})
export class ProjectionViewComponent implements OnInit, OnChanges {
  @Input() projectId: number = 0;
  projectName: string = 'Cargando nombre del proyecto...';

  private urlBase: string = environment.URL_BASE; // Usando environment

  periods: Period[] = [
    {value: 'meses', viewValue: 'Meses'},
    {value: 'semanas', viewValue: 'Semanas'},
  ];

  positionsCatalog: PositionCatalog[] = [];
  isLoadingPositions: boolean = false;
  positionsError: boolean = false;
  isRemoving: boolean = false;

  selectedPeriod: string = 'meses';
  periodQuantity: number = 4;
  showTable: boolean = false;
  dynamicColumns: string[] = [];
  displayedColumns: string[] = [];

  dataSource: ResourceRow[] = [
    this.createEmptyRow()
  ];

  totalTiempo: number = 0;
  totalCosto: number = 0;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private projectService: ProjectService,
    private dialog: MatDialog
  ) {
    console.log('🔧 ProjectionViewComponent constructor llamado');
    console.log('🌐 URL Base:', this.urlBase);
  }

  ngOnInit() {
    console.log('🔄 ngOnInit llamado');
    this.loadPositionsCatalog();
    this.loadProjectIdFromRoute();
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('🔄 ngOnChanges llamado, cambios:', changes);
    if (changes['projectId'] && changes['projectId'].currentValue) {
      console.log('🎯 projectId cambió a:', changes['projectId'].currentValue);
      this.loadProjectName();
      this.loadProjectionData();
    }
  }

  loadProjectName(): void {
    if (!this.projectId || this.projectId <= 0) {
      this.projectName = 'Proyecto no especificado';
      return;
    }

    console.log('📡 Cargando nombre del proyecto, ID:', this.projectId);

    this.projectService.getProjectById(this.projectId).subscribe({
      next: (project) => {
        console.log('✅ Datos del proyecto recibidos:', project);

        // Dependiendo de la estructura de tu API, ajusta estas líneas:
        if (project && project.name) {
          this.projectName = project.name;
        } else if (project && project.data && project.data.name) {
          this.projectName = project.data.name;
        } else {
          this.projectName = `Proyecto ${this.projectId}`;
        }

        console.log('🏷️ Nombre del proyecto establecido:', this.projectName);
      },
      error: (error) => {
        console.error('❌ Error al cargar nombre del proyecto:', error);
        this.projectName = `Proyecto ${this.projectId}`;
      }
    });
  }

  canSaveProjection(): boolean {
    // No se puede guardar si no hay recursos
    if (!this.dataSource || this.dataSource.length === 0) {
      return false;
    }

    // Verificar que al menos un recurso tenga tipo seleccionado
    return this.dataSource.some(resource =>
      resource.tipoRecurso && resource.tipoRecurso.trim() !== ''
    );
  }

  loadPositionsCatalog() {
    console.log('📡 Cargando catálogo de posiciones...');
    this.isLoadingPositions = true;
    this.positionsError = false;

    const url = `${this.urlBase}/api/Catalog/positions`;
    console.log('🌐 Haciendo request a:', url);

    this.http.get<any[]>(url) // Usar any[] temporalmente para ver la estructura real
      .subscribe({
        next: (positions) => {
          console.log('✅ Response completo del catálogo:', positions);

          // Debug detallado de la estructura
          if (positions && positions.length > 0) {
            console.log('🔍 Estructura del primer elemento:', positions[0]);
            console.log('🔍 Keys del primer elemento:', Object.keys(positions[0]));

            // Verificar diferentes nombres posibles para el ID
            const firstItem = positions[0];
            console.log('🔍 Posibles campos de ID:');
            console.log('   - positionId:', firstItem.positionId);
            console.log('   - id:', firstItem.id);
            console.log('   - positionID:', firstItem.positionID);
            console.log('   - PositionId:', firstItem.PositionId);
            console.log('   - Id:', firstItem.Id);

            console.log('🔍 Posibles campos de nombre:');
            console.log('   - positionName:', firstItem.positionName);
            console.log('   - name:', firstItem.name);
            console.log('   - positionName:', firstItem.positionName);
            console.log('   - PositionName:', firstItem.PositionName);
            console.log('   - Name:', firstItem.Name);
            console.log('   - description:', firstItem.description);
          }

          // Procesar el response según la estructura real
          this.positionsCatalog = this.processPositionsResponse(positions);
          this.isLoadingPositions = false;

          console.log('📊 Catálogo procesado:', this.positionsCatalog);

          if (this.projectId && this.projectId > 0) {
            this.loadProjectionData();
          } else {
            this.initializeEmptyTable();
          }
        },
        error: (error) => {
          console.error('❌ Error al cargar catálogo de posiciones:', error);
          this.isLoadingPositions = false;
          this.positionsError = true;
          this.positionsCatalog = [];
          this.initializeEmptyTable();
        }
      });
  }

  private processPositionsResponse(positions: any[]): PositionCatalog[] {
    if (!positions || positions.length === 0) {
      return [];
    }

    return positions.map((item, index) => {
      // Intentar diferentes nombres de campos
      const positionId = item.positionId || item.id || item.positionID || item.PositionId || item.Id || (index + 1);
      const positionName = item.positionName || item.name || item.PositionName || item.Name || item.description || `Posición ${positionId}`;

      console.log(`🔧 Procesando posición ${index}:`, {
        rawItem: item,
        processed: { positionId, positionName }
      });

      return {
        positionId: Number(positionId),
        positionName: String(positionName),
        description: item.description || ''
      };
    });
  }

  loadProjectIdFromRoute() {
    this.route.params.subscribe(params => {
      console.log('📋 Parámetros de ruta:', params);

      const projectIdFromParams = params['projectId'];
      this.projectId = this.safeConvertToNumber(projectIdFromParams);

      console.log('🎯 projectId desde ruta:', this.projectId);

      if (this.projectId > 0) {
        this.loadProjectName(); // 🔥 Cargar nombre cuando se obtenga de la ruta
        if (this.positionsCatalog.length > 0 && !this.isLoadingPositions) {
          this.loadProjectionData();
        }
      }
    });
  }

  private safeConvertToNumber(value: any): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }

    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const numberValue = Number(value);
      return isNaN(numberValue) ? 0 : numberValue;
    }

    return 0;
  }

  loadProjectionData() {
    console.log('📡 Cargando datos de proyección, projectId:', this.projectId);

    if (!this.projectId || this.projectId <= 0) {
      console.error('❌ projectId no válido para cargar proyección');
      this.initializeEmptyTable();
      return;
    }

    const url = `${this.urlBase}/api/Projection/${this.projectId}/get-all-projection-by-projectId`;
    console.log('🌐 Haciendo request a:', url);

    this.http.get<ProjectionResponse[]>(url)
      .subscribe({
        next: (data) => {
          console.log('✅ Datos de proyección recibidos:', data);
          if (data && data.length > 0) {
            this.processProjectionData(data);
          } else {
            console.log('📭 No hay datos de proyección, inicializando tabla vacía');
            this.initializeEmptyTable();
          }
        },
        error: (error) => {
          console.error('❌ Error al cargar datos de proyección:', error);
          this.initializeEmptyTable();
        }
      });
  }

  private adjustTimeDistributionToPeriods(
    originalDistribution: number[],
    targetPeriods: number
  ): number[] {
    console.log('🔄 Ajustando distribución de tiempos:', {
      original: originalDistribution,
      targetPeriods: targetPeriods,
      originalLength: originalDistribution.length
    });

    if (originalDistribution.length === targetPeriods) {
      return [...originalDistribution]; // Misma longitud, retornar copia
    }

    if (originalDistribution.length > targetPeriods) {
      // Truncar: tomar solo los primeros 'targetPeriods' elementos
      const truncated = originalDistribution.slice(0, targetPeriods);
      console.log('✂️ Distribución truncada:', truncated);
      return truncated;
    } else {
      // Extender: agregar ceros al final hasta alcanzar targetPeriods
      const extended = [...originalDistribution];
      while (extended.length < targetPeriods) {
        extended.push(0);
      }
      console.log('📈 Distribución extendida:', extended);
      return extended;
    }
  }

  processProjectionData(projectionData: ProjectionResponse[]) {
    console.log('🔄 Procesando datos de proyección...');

    const firstItem = projectionData[0];
    this.selectedPeriod = firstItem.period_type ? 'meses' : 'semanas';
    //this.periodQuantity = firstItem.period_quantity;

    console.log('⚙️ Configuración - Periodo:', this.selectedPeriod, 'Cantidad:', this.periodQuantity);

    this.generateDynamicColumns();

    // Limpiar el mapa de proyecciones existentes
    this.existingProjections.clear();

    this.dataSource = projectionData.map(item => {
      const timeDistribution = this.parseTimeDistribution(item.time_distribution);
      const adjustedTimeDistribution = this.adjustTimeDistributionToPeriods(timeDistribution, this.periodQuantity);
      const positionName = this.getPositionNameById(item.resourceTypeId);

      // Marcar esta proyección como existente
      this.existingProjections.set(item.resourceTypeId, true);

      const row: ResourceRow = {
        tipoRecurso: positionName,
        nombreRecurso: item.resource_name || '',
        costoPorHora: item.hourly_cost || 0,
        cantidadRecursos: item.resource_quantity || 1,
        tiempoTotal: item.total_time || 0,
        costoRecurso: item.resource_cost || 0,
        porcentajeParticipacion: item.participation_percentage || 0,
        resourceTypeId: item.resourceTypeId,
        isExisting: true,
        isActive: item.status !== false // Asumiendo que item.status indica si está activo
      } as ResourceRow;

      this.dynamicColumns.forEach((col, index) => {
        row[col] = timeDistribution[index] || 0;
      });

      return row;
    });

    this.showTable = true;
    this.calculateTotals();
    console.log('🎉 Tabla cargada exitosamente con datos del API');
  }

  determineSaveMethod(rowData: any): 'create' | 'update' {
    const resourceTypeId = rowData.resourceTypeId;
    return this.existingProjections.has(resourceTypeId) ? 'update' : 'create';
  }

  getPositionNameById(positionId: number): string {
    console.log(`🔍 Buscando posición con ID: ${positionId}`);

    const position = this.positionsCatalog.find(pos => pos.positionId === positionId);

    if (position) {
      console.log(`✅ Posición encontrada: "${position.positionName}"`);
      return position.positionName;
    } else {
      console.warn(`⚠️ No se encontró posición con ID: ${positionId}`);
      console.log('📋 Catálogo disponible:', this.positionsCatalog.map(p => `${p.positionId}: "${p.positionName}"`));
      return `Posición ${positionId}`; // Fallback: mostrar el ID si no se encuentra
    }
  }

  getPositionIdByName(positionName: string): number {
    const position = this.positionsCatalog.find(pos =>
      pos.positionName.toLowerCase() === positionName.toLowerCase()
    );
    return position ? position.positionId : 0;
  }

  parseTimeDistribution(timeDistribution: string): number[] {
    try {
      if (Array.isArray(timeDistribution)) {
        return timeDistribution;
      }

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
      return [];
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
      'acciones'
    ];
  }

  initializeEmptyTable() {
    console.log('📭 Inicializando tabla vacía');
    this.applyConfiguration();
  }

  applyConfiguration() {
    if (!this.periodQuantity || this.periodQuantity < 1) {
      return;
    }

    console.log('⚙️ Aplicando configuración:', {
      periodos: this.periodQuantity,
      tipo: this.selectedPeriod,
      filasActuales: this.dataSource.length
    });

    this.generateDynamicColumns();

    // Ajustar todas las filas existentes al nuevo número de períodos
    this.dataSource.forEach(row => {
      // Recoger los valores actuales de los períodos
      const currentPeriodValues: number[] = [];
      for (let i = 1; i <= this.dynamicColumns.length; i++) {
        const periodKey = `periodo${i}`;
        currentPeriodValues.push(Number(row[periodKey]) || 0);
      }

      // Limpiar todos los períodos
      this.dynamicColumns.forEach(col => {
        delete row[col];
      });

      // Reasignar los valores ajustados al nuevo número de períodos
      const adjustedValues = this.adjustTimeDistributionToPeriods(currentPeriodValues, this.periodQuantity);
      this.dynamicColumns.forEach((col, index) => {
        row[col] = adjustedValues[index] || 0;
      });
    });

    this.showTable = true;
    this.calculateTotals();

    console.log('✅ Configuración aplicada exitosamente');
  }

  getColumnHeader(index: number): string {
    const prefix = this.selectedPeriod === 'meses' ? 'Mes' : 'Semana';
    return `${prefix} ${index + 1}`;
  }

  createEmptyRow(): ResourceRow {
    const row = {
      tipoRecurso: '',
      nombreRecurso: '',
      costoPorHora: 0,
      cantidadRecursos: 1,
      tiempoTotal: 0,
      costoRecurso: 0,
      porcentajeParticipacion: 0,
      resourceTypeId: 0,
      isExisting: false,
      isActive: true
    } as ResourceRow;

    this.dynamicColumns.forEach(col => {
      row[col] = 0;
    });

    return row;
  }

  onResourceTypeChange(index: number) {
    console.log('🔄 Tipo de recurso cambiado en fila:', index);

    const selectedPositionName = this.dataSource[index].tipoRecurso;
    const positionId = this.getPositionIdByName(selectedPositionName);

    console.log(`📋 Posición seleccionada: "${selectedPositionName}" -> ID: ${positionId}`);

    // Asegurar que el resourceTypeId se asigne correctamente
    this.dataSource[index].resourceTypeId = positionId;

    // Si es una nueva fila, marcarla como no existente
    if (positionId && !this.existingProjections.has(positionId)) {
      this.dataSource[index].isExisting = false;
    }

    this.calculateTotals();
  }

  addRow() {
    this.dataSource.push(this.createEmptyRow());
    this.dataSource = [...this.dataSource];
    this.calculateTotals();
  }

  removeRow(index: number) {
    const row = this.dataSource[index];

    // Si es una fila vacía nueva, simplemente la removemos
    if (!row.tipoRecurso || !row.resourceTypeId || row.resourceTypeId === 0) {
      if (this.dataSource.length > 1) {
        this.dataSource.splice(index, 1);
        this.dataSource = [...this.dataSource];
        this.calculateTotals();
      }
      return;
    }

    // Para proyecciones existentes, usar el servicio de activar/inactivar
    if (row.resourceTypeId && this.projectId) {
      this.deactivateProjection(row.resourceTypeId, index);
    } else {
      // Para filas nuevas sin resourceTypeId, simplemente remover
      if (this.dataSource.length > 1) {
        this.dataSource.splice(index, 1);
        this.dataSource = [...this.dataSource];
        this.calculateTotals();
      }
    }
  }

  private deactivateProjection(resourceTypeId: number, rowIndex: number): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmar eliminación',
        message: '¿Estás seguro de que deseas quitar este recurso de la proyección?',
        confirmText: 'Sí, quitar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isRemoving = true;

        this.projectService.activateInactivateProjection(
          this.projectId,
          resourceTypeId,
          false  // active: false para "eliminar"
        ).subscribe({
          next: () => {
            this.snackBar.open('Recurso quitado de la proyección correctamente', 'Cerrar', {
              duration: 3000
            });

            // Remover la fila de la tabla
            this.dataSource.splice(rowIndex, 1);
            this.dataSource = [...this.dataSource];

            // Actualizar el mapa de proyecciones existentes
            this.existingProjections.delete(resourceTypeId);

            this.calculateTotals();
            this.isRemoving = false;
          },
          error: (error) => {
            console.error('❌ Error al quitar el recurso:', error);
            this.snackBar.open('Error al quitar el recurso de la proyección', 'Cerrar', {
              duration: 5000
            });
            this.isRemoving = false;
          }
        });
      }
    });
  }

  generateRequest(): any[] {
    return this.dataSource.map(row => {
      const timeDistribution: number[] = [];

      // Usar this.periodQuantity en lugar de this.dynamicColumns.length
      // para asegurar consistencia
      for (let i = 1; i <= this.periodQuantity; i++) {
        const periodKey = `periodo${i}`;
        const value = row[periodKey] || 0;
        timeDistribution.push(Number(value));
      }

      const resourceTypeId = this.getPositionIdByName(row.tipoRecurso);
      const totalTime = this.calculateRowTotalTime(row);

      return {
        resourceTypeId: resourceTypeId,
        resourceName: row.nombreRecurso || '',
        hourlyCost: Number(row.costoPorHora) || 0,
        resourceQuantity: Number(row.cantidadRecursos) || 1,
        timeDistribution: timeDistribution,
        totalTime: totalTime,
        resourceCost: Number(row.costoRecurso) || 0,
        participationPercentage: Number(row.porcentajeParticipacion) || 0,
        periodType: this.selectedPeriod === 'meses',
        periodQuantity: this.periodQuantity, // 🔥 Usar la cantidad actual
        projectID: this.projectId
      };
    });
  }

  private calculateRowTotalTime(row: ResourceRow): number {
    let total = 0;
    this.dynamicColumns.forEach(col => {
      total += Number(row[col]) || 0;
    });
    return total;
  }

  saveAllProjections(): void {
    if (!this.projectId || this.projectId <= 0) {
      this.snackBar.open('Error: ID de proyecto no válido', 'Cerrar', { duration: 5000 });
      return;
    }

    const requestData = this.generateRequest();
    console.log('📤 Datos a enviar:', requestData);

    // Verificar que todos los campos requeridos estén completos
    const invalidRows = requestData.filter(item =>
      !item.resourceTypeId ||
      !item.resourceName ||
      item.hourlyCost <= 0
    );

    if (invalidRows.length > 0) {
      this.snackBar.open('Por favor complete todos los campos requeridos (Tipo de Recurso, Nombre y Costo por Hora)', 'Cerrar', { duration: 5000 });
      return;
    }

    // Mostrar loading
    const loadingSnackbar = this.snackBar.open('Guardando proyecciones...', '', { duration: undefined });

    // Enviar cada proyección individualmente
    const saveRequests = requestData.map(data => {
      const method = this.determineSaveMethod(data);

      if (method === 'update') {
        // UPDATE: PUT /api/Projection/{projectId}/update/{resourceTypeId}
        return this.projectService.updateProjection(
          this.projectId,
          data.resourceTypeId,
          {
            resourceTypeId: data.resourceTypeId,
            resourceName: data.resourceName,
            hourlyCost: data.hourlyCost,
            resourceQuantity: data.resourceQuantity,
            timeDistribution: data.timeDistribution,
            totalTime: data.totalTime,
            resourceCost: data.resourceCost,
            participationPercentage: data.participationPercentage
          }
        );
      } else {
        // CREATE: POST /api/Projection/create
        return this.projectService.createProjection(data);
      }
    });

    // Ejecutar todas las peticiones
    forkJoin(saveRequests).subscribe({
      next: (responses) => {
        loadingSnackbar.dismiss();

        // Actualizar el mapa de proyecciones existentes
        requestData.forEach(data => {
          this.existingProjections.set(data.resourceTypeId, true);
        });

        const createdCount = requestData.filter(data =>
          this.determineSaveMethod(data) === 'create'
        ).length;

        const updatedCount = requestData.length - createdCount;

        let message = '✅ Proyecciones guardadas con éxito';
        if (createdCount > 0 && updatedCount > 0) {
          message = `✅ ${createdCount} proyecciones creadas y ${updatedCount} actualizadas`;
        } else if (createdCount > 0) {
          message = `✅ ${createdCount} proyecciones creadas`;
        } else if (updatedCount > 0) {
          message = `✅ ${updatedCount} proyecciones actualizadas`;
        }

        this.snackBar.open(message, 'Cerrar', { duration: 5000 });

        // Recargar los datos para asegurar sincronización
        this.loadProjectionData();
      },
      error: (error) => {
        loadingSnackbar.dismiss();
        console.error('❌ Error al guardar proyecciones:', error);
        this.snackBar.open('Error al guardar las proyecciones', 'Cerrar', { duration: 5000 });
      }
    });
  }

  submitData() {
    this.saveAllProjections();
  }

  existingProjections: Map<number, boolean> = new Map();

  calculateTotals() {
    let totalTiempo = 0;
    let totalCosto = 0;

    this.dataSource.forEach(row => {
      let tiempoRow = 0;
      this.dynamicColumns.forEach(col => {
        tiempoRow += Number(row[col]) || 0;
      });

      row.tiempoTotal = tiempoRow;
      row.costoRecurso = tiempoRow * (row.costoPorHora || 0) * (row.cantidadRecursos || 1);

      totalTiempo += row.tiempoTotal;
      totalCosto += row.costoRecurso;
    });

    this.dataSource.forEach(row => {
      row.porcentajeParticipacion = totalTiempo > 0 ? (row.tiempoTotal / totalTiempo) * 100 : 0;
    });

    this.totalTiempo = totalTiempo;
    this.totalCosto = totalCosto;
  }

  toggleProjectionStatus(resourceTypeId: number, currentStatus: boolean): void {
    if (!this.projectId || !resourceTypeId) {
      this.snackBar.open('Error: Datos incompletos', 'Cerrar', { duration: 5000 });
      return;
    }

    const newStatus = !currentStatus;
    const action = newStatus ? 'activar' : 'inactivar';

    const confirmMessage = `¿Estás seguro de que deseas ${action} esta proyección de recursos?`;
    const confirmAction = confirm(confirmMessage);

    if (confirmAction) {
      this.projectService.activateInactivateProjection(this.projectId, resourceTypeId, newStatus)
        .subscribe({
          next: () => {
            this.snackBar.open(`Proyección ${action}ada con éxito`, 'Cerrar', { duration: 3000 });

            // Actualizar el estado en la tabla
            const rowIndex = this.dataSource.findIndex(row =>
              this.getPositionIdByName(row.tipoRecurso) === resourceTypeId
            );

            if (rowIndex !== -1) {
              // Si se inactiva, puedes optar por removerla de la tabla o marcarla como inactiva
              if (!newStatus) {
                // Opción 1: Remover de la tabla
                this.dataSource.splice(rowIndex, 1);
                this.dataSource = [...this.dataSource];
                this.existingProjections.delete(resourceTypeId);
              } else {
                // Opción 2: Marcar como activa (si decides mostrar el estado)
                this.dataSource[rowIndex].isActive = newStatus;
              }

              this.calculateTotals();
            }
          },
          error: (error) => {
            console.error(`❌ Error al ${action} proyección:`, error);
            this.snackBar.open(`Error al ${action} la proyección`, 'Cerrar', { duration: 5000 });
          }
        });
    }
  }

  exportToExcel(): void {
    if (!this.projectId || this.projectId <= 0) {
      this.snackBar.open('Error: ID de proyecto no válido', 'Cerrar', { duration: 5000 });
      return;
    }

    console.log('📤 Exportando Excel para projectId:', this.projectId);

    const loadingSnackbar = this.snackBar.open('Generando archivo Excel...', '', { duration: undefined });

    this.projectService.exportProjectionToExcel(this.projectId).subscribe({
      next: (blob: Blob) => {
        loadingSnackbar.dismiss();

        // Crear URL para el blob y descargar
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        // Nombre del archivo con fecha
        const date = new Date().toISOString().split('T')[0];
        a.download = `proyeccion_proyecto_${this.projectId}_${date}.xlsx`;

        // Trigger download
        document.body.appendChild(a);
        a.click();

        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        this.snackBar.open('✅ Archivo Excel exportado correctamente', 'Cerrar', { duration: 3000 });
      },
      error: (error) => {
        loadingSnackbar.dismiss();
        console.error('❌ Error al exportar Excel:', error);
        this.snackBar.open('Error al exportar el archivo Excel', 'Cerrar', { duration: 5000 });
      }
    });
  }

  /*
  deleteProjection(resourceTypeId: number): void {
    if (!this.projectId || !resourceTypeId) {
      this.snackBar.open('Error: Datos incompletos para eliminar', 'Cerrar', { duration: 5000 });
      return;
    }

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        message: '¿Estás seguro de que deseas eliminar esta proyección de recursos?'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.projectService.deleteProjection(resourceTypeId).subscribe({
          next: () => {
            this.snackBar.open('Proyección eliminada con éxito', 'Cerrar', { duration: 3000 });

            // Remover del mapa de existentes
            this.existingProjections.delete(resourceTypeId);

            // Remover de la tabla
            this.dataSource = this.dataSource.filter(row =>
              this.getPositionIdByName(row.tipoRecurso) !== resourceTypeId
            );

            this.calculateTotals();
          },
          error: (error) => {
            console.error('❌ Error al eliminar proyección:', error);
            this.snackBar.open('Error al eliminar la proyección', 'Cerrar', { duration: 5000 });
          }
        });
      }
    });
  }
    */
}
