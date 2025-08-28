// assignment-dialog.component.ts
import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProjectService } from '../../services/project.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { ProjectDetail, EmployeeProject, EmployeeProjectMiddle, ResourceAssignmentPayload, Position } from '../../interfaces/project.interface';
import { debounceTime, distinctUntilChanged, finalize, Subject, switchMap, ReplaySubject, takeUntil } from 'rxjs';
import { EmployeeService } from '../../../employees/services/employee.service';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatTooltipModule } from '@angular/material/tooltip';

interface DialogData {
  projectId: number;
  projectName: string;
  employeesPersonInfo?: any[];
}

@Component({
  standalone: true,
  selector: 'app-assignment-dialog',
  templateUrl: './assignment-dialog.component.html',
  styleUrls: ['./assignment-dialog.component.scss'],
  providers: [CurrencyPipe],
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule
  ]
})
export class AssignmentDialogComponent implements OnInit, OnDestroy {
  assignmentForm: FormGroup;
  resourceTypes = [
    { id: 1, name: 'Empleado' },
    { id: 2, name: 'Proveedor' }
  ];

  employees: any[] = [];
  providers: any[] = [];
  positions: any[] = [];
  private resourceSubscription: any;
  selectedResourceType: number = 1;
  projectName: string = '';
  existingAssignments: (EmployeeProject & {markedForDeletion?: boolean})[] = [];
  assignmentsToDelete: Partial<EmployeeProject>[] = [];
  selectedResources: EmployeeProjectMiddle[] = [];

  searchSubject = new Subject<string>();
  loadingEmployees = false;
  totalEmployees = 0;
  currentPage = 1;
  pageSize = 500;
  searchTerm = '';

  // Para ngx-mat-select-search - Recursos
  public resourceFilterCtrl: FormControl<string | null> = new FormControl<string>('');
  public filteredEmployees: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);
  public filteredProviders: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);

  // Para ngx-mat-select-search - Perfiles
  public profileFilterCtrl: FormControl<string | null> = new FormControl<string>('');
  public filteredPositions: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);

  protected _onDestroy = new Subject<void>();

  displayedColumns: string[] = ['type', 'name', 'profile', 'cost', 'hours', 'actions'];

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private employeeService: EmployeeService,
    public dialogRef: MatDialogRef<AssignmentDialogComponent>,
    private currencyPipe: CurrencyPipe,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.assignmentForm = this.fb.group({
      resourceType: [1, Validators.required],
      resource: [null, Validators.required],
      profile: [null, Validators.required],
      costPerHour: [0, [Validators.required, Validators.min(0)]],
      totalHours: [0, [Validators.required, Validators.min(0)]]
    });

    this.loadInitialData();
    this.loadProjectDetails();
  }

  ngOnInit(): void {
    this.setupSearch();
    this.setupProfileAutofill();
    this.setupResourceFilter();
    this.setupProfileFilter();

    // Suscribirse a cambios en el tipo de recurso
    this.assignmentForm.get('resourceType')?.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.onResourceTypeChange();
      });
  }

  private resetForm(): void {
    this.assignmentForm.patchValue({
      resource: null,
      profile: null,
      costPerHour: 0,
      totalHours: 0
    });

    // Limpiar filtros al resetear el formulario
    this.resourceFilterCtrl.setValue('', { emitEvent: false });
    this.profileFilterCtrl.setValue('', { emitEvent: false });
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  private setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(searchTerm => {
        this.loadingEmployees = true;
        this.searchTerm = searchTerm;
        this.currentPage = 1;
        return this.employeeService.getEmployees(this.currentPage, this.pageSize, searchTerm)
          .pipe(finalize(() => this.loadingEmployees = false));
      })
    ).subscribe({
      next: (response) => {
        this.employees = response.items;
        this.totalEmployees = response.totalItems;
        this.mapEmployeesWithPositions();
        this.filterResources(); // Actualizar filtros después de cargar empleados
      },
      error: (error) => {
        console.error('Error al buscar empleados:', error);
      }
    });
  }

  /**
   * Configura el filtro para recursos usando ngx-mat-select-search
   */
  private setupResourceFilter(): void {
    // Cargar sets iniciales
    this.filteredEmployees.next(this.employees.slice());
    this.filteredProviders.next(this.providers.slice());

    // Escuchar cambios en el filtro
    this.resourceFilterCtrl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterResources();
      });
  }

  /**
   * Configura el filtro para perfiles usando ngx-mat-select-search
   */
  private setupProfileFilter(): void {
    // Cargar set inicial
    this.filteredPositions.next(this.positions.slice());

    // Escuchar cambios en el filtro
    this.profileFilterCtrl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterProfiles();
      });
  }

  /**
   * Filtra los recursos basado en la consulta
   */
  private filterResources(): void {
    // Obtener la palabra clave de búsqueda
    let searchTerm = this.resourceFilterCtrl.value || '';
    if (typeof searchTerm === 'string') {
      searchTerm = searchTerm.toLowerCase();
    } else {
      searchTerm = '';
    }

    // Filtrar empleados
    if (this.employees.length > 0) {
      const filteredEmps = this.employees.filter(emp => {
        const fullName = `${emp.person?.firstName || ''} ${emp.person?.lastName || ''}`.toLowerCase();
        const position = (emp.positionName || emp.position?.positionName || '').toLowerCase();
        return fullName.includes(searchTerm) || position.includes(searchTerm);
      });
      this.filteredEmployees.next(filteredEmps);
    }

    // Filtrar proveedores
    if (this.providers.length > 0) {
      const filteredProvs = this.providers.filter(prov => {
        const businessName = (prov.businessName || '').toLowerCase();
        const supplierType = (prov.supplierType?.name || '').toLowerCase();
        return businessName.includes(searchTerm) || supplierType.includes(searchTerm);
      });
      this.filteredProviders.next(filteredProvs);
    }
  }

  /**
   * Filtra los perfiles basado en la consulta
   */
  private filterProfiles(): void {
    // Obtener la palabra clave de búsqueda
    let searchTerm = this.profileFilterCtrl.value || '';
    if (typeof searchTerm === 'string') {
      searchTerm = searchTerm.toLowerCase();
    } else {
      searchTerm = '';
    }

    // Filtrar posiciones
    if (this.positions.length > 0) {
      const filteredPositions = this.positions.filter(position => {
        const positionName = (position.positionName || '').toLowerCase();
        return positionName.includes(searchTerm);
      });
      this.filteredPositions.next(filteredPositions);
    }
  }

  private setupProfileAutofill(): void {
    this.assignmentForm.get('resource')?.valueChanges.subscribe(employeeId => {
      if (this.selectedResourceType === 1 && employeeId) {
        this.setDefaultProfileForEmployee(employeeId);
      }
    });
  }

  async loadInitialData() {
    try {
      // Cargar empleados iniciales
      this.loadingEmployees = true;
      const empResponse = await this.employeeService.getEmployees(1, this.pageSize, '').toPromise();
      this.employees = empResponse?.items || [];
      this.totalEmployees = empResponse?.totalItems || 0;

      const provResponse = await this.projectService.getInventoryProviders().toPromise();
      this.providers = provResponse?.data || [];

      const posResponse = await this.projectService.getPositions().toPromise();
      this.positions = posResponse || [];

      this.mapEmployeesWithPositions();

      // Inicializar los filtros después de cargar los datos
      this.filteredEmployees.next(this.employees.slice());
      this.filteredProviders.next(this.providers.slice());
      this.filteredPositions.next(this.positions.slice());

    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      this.loadingEmployees = false;
    }
  }

  private mapEmployeesWithPositions(): void {
    // Esto es un ejemplo - ajusta según tu estructura de datos real
    this.employees.forEach(employee => {
      // Si el empleado tiene un positionId, buscar la posición correspondiente
      if (employee.positionId && this.positions.length > 0) {
        const position = this.positions.find(pos => pos.id === employee.positionId);
        if (position) {
          employee.position = position;
          employee.positionName = position.positionName;
        }
      }
    });
  }

  private setDefaultProfileForEmployee(employeeId: number): void {
    const selectedEmployee = this.employees.find(emp => emp.id === employeeId);

    if (selectedEmployee) {
      // Intentar obtener el nombre de la posición de diferentes maneras
      const positionName = selectedEmployee.positionName ||
                          selectedEmployee.position?.positionName ||
                          this.getPositionNameById(selectedEmployee.positionId);

      if (positionName) {
        this.assignmentForm.get('profile')?.setValue(positionName);
        this.cdr.detectChanges();
      } else {
        this.assignmentForm.get('profile')?.reset();
      }
    }
  }

  async loadProjectDetails() {
    try {
      const projectDetails = await this.projectService.getProjectDetailByID(this.data.projectId).toPromise();

      if (projectDetails?.employeeProjects) {
        this.existingAssignments = projectDetails.employeeProjects
          .filter(assignment => assignment.status)
          .map(assignment => ({
            ...assignment,
            employeeID: assignment.employeeID,
            supplierID: assignment.supplierID,
            markedForDeletion: false
          }));
      }
    } catch (error) {
      console.error('Error loading project details:', error);
    }
  }

  private getPositionNameById(positionId: number): string | null {
    if (!positionId || this.positions.length === 0) return null;
    const position = this.positions.find(pos => pos.id === positionId);
    return position?.positionName || null;
  }

  onSearchChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.searchSubject.next(inputElement.value);
  }

  onResourceTypeChange() {
    this.selectedResourceType = this.assignmentForm.get('resourceType')?.value;
    this.assignmentForm.get('resource')?.reset();
    this.assignmentForm.get('profile')?.reset();

    // Limpiar los filtros cuando cambia el tipo
    this.resourceFilterCtrl.setValue('', { emitEvent: false });
    this.profileFilterCtrl.setValue('', { emitEvent: false });

    // Si es proveedor, establecer perfil por defecto
    if (this.selectedResourceType === 2) {
      this.assignmentForm.get('profile')?.setValue('Proveedor');
    }
  }

  getResourceOptions() {
    return this.selectedResourceType === 1 ? this.employees : this.providers;
  }

  getProfileOptions() {
    if (this.selectedResourceType === 1) {
      return this.positions;
    }
    return [{ positionName: 'Proveedor' }];
  }

  addResource() {
    if (this.assignmentForm.valid) {
      const newResource: EmployeeProjectMiddle = {
        [this.selectedResourceType === 1 ? 'employeeId' : 'supplierID']: this.assignmentForm.value.resource,
        assignedRole: this.assignmentForm.value.profile,
        costPerHour: this.assignmentForm.value.costPerHour,
        allocatedHours: this.assignmentForm.value.totalHours
      };

      this.selectedResources = [...this.selectedResources, newResource];
      this.resetForm();
    }
  }

  removeResource(index: number, isExisting: boolean = false) {
    if (isExisting) {
      // TOGGLE: Si ya está marcado para eliminación, lo reactivamos
      // Si NO está marcado, lo marcamos para eliminación
      this.existingAssignments[index].markedForDeletion =
        !this.existingAssignments[index].markedForDeletion;

      this.existingAssignments = [...this.existingAssignments]; // Trigger change detection
    } else {
      this.selectedResources.splice(index, 1);
      this.selectedResources = [...this.selectedResources];
    }
  }

  getResourceName(resource: any): string {
    // Para recursos existentes (EmployeeProject)
    if ('employeeID' in resource && resource.employeeID !== null) {
      if (this.data.employeesPersonInfo) {
        const employee = this.data.employeesPersonInfo.find(e => e.id === resource.employeeID);
        if (employee) return `${employee.firstName} ${employee.lastName}`;
      }
      const employee = this.employees.find(e => e.id === resource.employeeID);
      return employee ? `${employee.person.firstName} ${employee.person.lastName}` : 'Empleado no encontrado';
    }
    // Para proveedores existentes
    else if ('supplierID' in resource && resource.supplierID !== null) {
      const provider = this.providers.find(p => p.id === resource.supplierID);
      return provider ? provider.businessName : 'Proveedor no encontrado';
    }
    // Para recursos nuevos (EmployeeProjectMiddle)
    else if ('employeeId' in resource && resource.employeeId !== null) {
      const employee = this.employees.find(e => e.id === resource.employeeId);
      return employee ? `${employee.person.firstName} ${employee.person.lastName}` : 'Empleado no encontrado';
    }
    // Para proveedores nuevos
    else if ('supplierID' in resource && resource.supplierID !== null) {
      const provider = this.providers.find(p => p.id === resource.supplierID);
      return provider ? provider.businessName : 'Proveedor no encontrado';
    }
    return 'Recurso no identificado';
  }

  assignResources() {
    // 1. Preparar NUEVOS recursos (los que se acaban de agregar)
    const newAssignments: EmployeeProjectMiddle[] = this.selectedResources.map(resource => ({
      employeeId: resource.employeeId || null,
      supplierID: resource.supplierID || null,
      assignedRole: resource.assignedRole,
      costPerHour: resource.costPerHour,
      allocatedHours: resource.allocatedHours,
      status: true
    }));

    // 2. Preparar recursos EXISTENTES que se MANTIENEN (no marcados para eliminación)
    const keptResources: EmployeeProjectMiddle[] = this.existingAssignments
      .filter(resource => !resource.markedForDeletion)
      .map(resource => ({
        id: resource.id, // Incluir ID para updates
        employeeId: resource.employeeID || null,
        supplierID: resource.supplierID || null,
        assignedRole: resource.assignedRole,
        costPerHour: resource.costPerHour,
        allocatedHours: resource.allocatedHours,
        status: true
      }));

    // 3. Preparar recursos EXISTENTES que se ELIMINAN (marcados para eliminación)
    // SOLO si el backend espera que se envíen con status: false
    const deletedResources: EmployeeProjectMiddle[] = this.existingAssignments
      .filter(resource => resource.markedForDeletion && resource.id)
      .map(resource => ({
        id: resource.id!, // ID es requerido para eliminación
        employeeId: resource.employeeID || null,
        supplierID: resource.supplierID || null,
        assignedRole: resource.assignedRole,
        costPerHour: resource.costPerHour,
        allocatedHours: resource.allocatedHours,
        status: false // Esto indica eliminación
      }));

    // Payload final - Depende de cómo el backend maneje las eliminaciones
    const payload: ResourceAssignmentPayload = {
      projectID: this.data.projectId,
      employeeProjectMiddle: [
        ...newAssignments,
        ...keptResources,
      ]
    };

    console.log('Payload enviado:', payload);

    this.projectService.assignResourcesToProject(payload).subscribe({
      next: () => this.dialogRef.close(true),
      error: (err) => {
        console.error('Error al asignar recursos:', err);
        this.loadProjectDetails(); // Recargar en caso de error
      }
    });
  }

  hasChanges(): boolean {
    // Hay cambios si:
    // 1. Hay recursos nuevos para agregar
    const hasNewResources = this.selectedResources.length > 0;

    // 2. Hay recursos existentes marcados para eliminación
    const hasResourcesToDelete = this.existingAssignments.some(assignment => assignment.markedForDeletion);

    return hasNewResources || hasResourcesToDelete;
  }

  cancel() {
    this.dialogRef.close(false);
  }
}
