// assignment-dialog.component.ts
import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { debounceTime, distinctUntilChanged, finalize, Subject, switchMap, forkJoin, of } from 'rxjs';
import { EmployeeService } from '../../../employees/services/employee.service';
import { catchError } from 'rxjs/operators';

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
    ReactiveFormsModule
  ]
})
export class AssignmentDialogComponent implements OnInit {
  assignmentForm: FormGroup;
  resourceTypes = [
    { id: 1, name: 'Empleado' },
    { id: 2, name: 'Proveedor' }
  ];

  employees: any[] = [];
  providers: any[] = [];
  positions: Position[] = [];
  filteredEmployees: any[] = [];
  filteredProviders: any[] = [];
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
      profile: [{value: null, disabled: false}, Validators.required],
      costPerHour: [0, [Validators.required, Validators.min(0)]],
      totalHours: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.setupSearch();
  }

  private loadInitialData() {
    // Cargar datos en paralelo
    forkJoin({
      positions: this.projectService.getPositions().pipe(
        catchError(error => {
          console.error('Error loading positions:', error);
          return of([]);
        })
      ),
      employees: this.projectService.getAllEmployees(1000, 1, '').pipe(
        catchError(error => {
          console.error('Error loading employees:', error);
          return of({items: []});
        })
      ),
      providers: this.projectService.getInventoryProviders().pipe(
        catchError(error => {
          console.error('Error loading providers:', error);
          return of({data: []});
        })
      )
    }).subscribe(({positions, employees, providers}) => {
      // Cargar posiciones
      this.positions = positions || [];

      // Cargar empleados y mapear sus posiciones
      this.employees = employees.items || [];
      this.filteredEmployees = [...this.employees];
      this.mapEmployeesWithPositions();

      // Cargar proveedores
      this.providers = providers.data || [];
      this.filteredProviders = [...this.providers];

      // Cargar detalles del proyecto después de tener los datos básicos
      this.loadProjectDetails();
    });
  }

  private mapEmployeesWithPositions(): void {
    this.employees.forEach(employee => {
      // Buscar la posición del empleado en el array de posiciones
      if (employee.positionID && this.positions.length > 0) {
        const position = this.positions.find(pos => pos.id === employee.positionID);
        if (position) {
          employee.positionName = position.positionName;
        } else {
          employee.positionName = 'Sin posición definida';
          console.warn(`No se encontró posición con ID ${employee.positionID} para el empleado ${employee.person.firstName} ${employee.person.lastName}`);
        }
      } else {
        employee.positionName = 'Sin posición definida';
        console.warn(`Empleado ${employee.person.firstName} ${employee.person.lastName} no tiene positionID definido`);
      }
    });
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
        this.filteredEmployees = [...this.employees];
      },
      error: (error) => {
        console.error('Error al buscar empleados:', error);
      }
    });
  }

  private resetForm(): void {
    this.assignmentForm.patchValue({
      resource: null,
      profile: null,
      costPerHour: 0,
      totalHours: 0
    });

    // Si es empleado, deshabilitar el campo de perfil
    if (this.selectedResourceType === 1) {
      this.assignmentForm.get('profile')?.disable();
    } else {
      this.assignmentForm.get('profile')?.enable();
    }
  }

  onResourceTypeChange(type: number) {
    this.selectedResourceType = type;

    // Resetear el formulario cuando cambia el tipo
    this.assignmentForm.get('resource')?.reset();
    this.assignmentForm.get('profile')?.reset();

    // Configurar el estado del campo de perfil según el tipo
    if (type === 1) {
      // Para empleados: deshabilitar y limpiar
      this.assignmentForm.get('profile')?.disable();
      this.assignmentForm.get('profile')?.setValue(null);
    } else {
      // Para proveedores: habilitar
      this.assignmentForm.get('profile')?.enable();
      this.assignmentForm.get('profile')?.setValue(null);
    }

    this.filterByType(type);
  }

  filterByType(type: number) {
    if (type === 1) {
      this.filteredEmployees = this.employees;
    } else if (type === 2) {
      this.filteredProviders = this.providers;
    }
  }

  onResourceSelected(resourceId: number) {
    if (this.selectedResourceType === 1 && resourceId) {
      // Buscar el empleado seleccionado
      const selectedEmployee = this.employees.find(emp => emp.id === resourceId);

      if (selectedEmployee) {
        // Establecer el valor en el campo de perfil
        this.assignmentForm.get('profile')?.setValue(selectedEmployee.positionName);
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
      const assignment = this.existingAssignments[index];

      // Guardar todos los campos necesarios para la eliminación
      if (assignment.id) {
        this.assignmentsToDelete.push({
          id: assignment.id,
          employeeID: assignment.employeeID,
          supplierID: assignment.supplierID,
          assignedRole: assignment.assignedRole,
          costPerHour: assignment.costPerHour,
          allocatedHours: assignment.allocatedHours
        });
      }

      this.existingAssignments.splice(index, 1);
      this.existingAssignments = [...this.existingAssignments];
    } else {
      this.selectedResources.splice(index, 1);
      this.selectedResources = [...this.selectedResources];
    }
  }

  getResourceName(resource: any): string {
    // Para recursos existentes (EmployeeProject)
    if ('employeeID' in resource) {
      if (this.data.employeesPersonInfo) {
        const employee = this.data.employeesPersonInfo.find(e => e.id === resource.employeeID);
        if (employee) return `${employee.firstName} ${employee.lastName}`;
      }
      const employee = this.employees.find(e => e.id === resource.employeeID);
      return employee ? `${employee.person.firstName} ${employee.person.lastName}` : 'Empleado no encontrado';
    }
    // Para proveedores existentes
    else if ('supplierID' in resource) {
      const provider = this.providers.find(p => p.id === resource.supplierID);
      return provider ? provider.businessName : 'Proveedor no encontrado';
    }
    // Para recursos nuevos (EmployeeProjectMiddle)
    else if ('employeeId' in resource) {
      const employee = this.employees.find(e => e.id === resource.employeeId);
      return employee ? `${employee.person.firstName} ${employee.person.lastName}` : 'Empleado no encontrado';
    }
    // Para proveedores nuevos
    else if ('supplierID' in resource) {
      const provider = this.providers.find(p => p.id === resource.supplierID);
      return provider ? provider.businessName : 'Proveedor no encontrado';
    }
    return 'Recurso no identificado';
  }

  assignResources() {
    // 1. Preparar nuevos recursos (sin ID)
    const newAssignments: EmployeeProjectMiddle[] = this.selectedResources.map(resource => ({
      employeeId: resource.employeeId || null,
      supplierID: resource.supplierID || null,
      assignedRole: resource.assignedRole,
      costPerHour: resource.costPerHour,
      allocatedHours: resource.allocatedHours,
    }));

    // 2. Preparar recursos existentes que se mantienen
    const keptResources: EmployeeProjectMiddle[] = this.existingAssignments.map(resource => ({
      employeeId: resource.employeeID,
      supplierID: resource.supplierID,
      assignedRole: resource.assignedRole,
      costPerHour: resource.costPerHour,
      allocatedHours: resource.allocatedHours,
    }));

    // Payload final
    const payload: ResourceAssignmentPayload = {
      projectID: this.data.projectId,
      employeeProjectMiddle: [
        ...newAssignments,
        ...keptResources,
      ]
    };

    this.projectService.assignResourcesToProject(payload).subscribe({
      next: () => this.dialogRef.close(true),
      error: (err) => {
        console.error('Error:', err);
        this.loadProjectDetails();
      }
    });
  }

  cancel() {
    this.dialogRef.close(false);
  }
}
