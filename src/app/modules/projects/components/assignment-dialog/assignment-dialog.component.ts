// assignment-dialog.component.ts
import { Component, Inject } from '@angular/core';
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
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

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
export class AssignmentDialogComponent {
  assignmentForm: FormGroup;
  resourceTypes = [
    { id: 1, name: 'Empleado' },
    { id: 2, name: 'Proveedor' }
  ];

  employees: any[] = [];
  providers: any[] = [];
  positions: any[] = [];
  selectedResourceType: number = 1;
  projectName: string = '';
  existingAssignments: (EmployeeProject & {markedForDeletion?: boolean})[] = [];
  assignmentsToDelete: Partial<EmployeeProject>[] = [];
  selectedResources: EmployeeProjectMiddle[] = [];

  displayedColumns: string[] = ['type', 'name', 'profile', 'cost', 'hours', 'actions'];

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    public dialogRef: MatDialogRef<AssignmentDialogComponent>,
    private currencyPipe: CurrencyPipe,
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
    this.setupResourceChangeListener();
  }

  private setupResourceChangeListener(): void {
    // Escuchar cambios en el campo de recurso
    this.assignmentForm.get('resource')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe((resourceId) => {
        this.onResourceSelected(resourceId);
      });
  }

  private onResourceSelected(resourceId: number): void {
    if (this.selectedResourceType === 1 && resourceId) {
      // Buscar el empleado seleccionado
      const selectedEmployee = this.employees.find(emp => emp.id === resourceId);

      if (selectedEmployee) {
        // Intentar obtener la posición del empleado de diferentes formas
        const employeePosition = this.getEmployeePosition(selectedEmployee);

        if (employeePosition) {
          // Si el empleado tiene una posición, establecerla automáticamente
          this.assignmentForm.get('profile')?.setValue(employeePosition);
        }
      }
    }
  }

  private getEmployeePosition(employee: any): string | null {
    // Verificar diferentes formas en que la posición podría estar estructurada
    if (employee.position?.positionName) {
      return employee.position.positionName;
    }
    if (employee.employeePosition?.positionName) {
      return employee.employeePosition.positionName;
    }
    if (employee.positionName) {
      return employee.positionName;
    }
    if (employee.position) {
      return employee.position;
    }
    if (employee.employeePosition) {
      return employee.employeePosition;
    }

    return null;
  }

  private resetForm(): void {
    this.assignmentForm.patchValue({
      resource: null,
      profile: null,
      costPerHour: 0,
      totalHours: 0
    });
  }

  async loadInitialData() {
    try {
      // Cargar empleados
      const empResponse = await this.projectService.getAllEmployees(100, 1, '').toPromise();
      this.employees = empResponse?.items || [];

      const provResponse = await this.projectService.getInventoryProviders().toPromise();
      this.providers = provResponse?.data || [];

      const posResponse = await this.projectService.getPositions().toPromise();
      this.positions = posResponse || [];

      console.log('Employees loaded:', this.employees);
      console.log('Positions loaded:', this.positions);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  }

  // ... el resto del código permanece igual
  onResourceTypeChange() {
    this.selectedResourceType = this.assignmentForm.get('resourceType')?.value;
    this.assignmentForm.get('resource')?.reset();
    this.assignmentForm.get('profile')?.reset();
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

    // 3. Preparar recursos a eliminar (con todos los campos requeridos)
    const deletedResources: EmployeeProjectMiddle[] = this.assignmentsToDelete.map(assignment => ({
      employeeId: assignment.employeeID || null,
      supplierID: assignment.supplierID || null,
      assignedRole: assignment.assignedRole || 'Eliminado',
      costPerHour: assignment.costPerHour || 0,
      allocatedHours: assignment.allocatedHours || 0,
    }));

    // Payload final
    const payload: ResourceAssignmentPayload = {
      projectID: this.data.projectId,
      employeeProjectMiddle: [
        ...newAssignments,
        ...keptResources,
      ]
    };

    console.log('Payload a enviar:', payload);
    this.projectService.assignResourcesToProject(payload).subscribe({
      next: () => this.dialogRef.close(true),
      error: (err) => {
        console.error('Error:', err);
      }
    });
  }

  cancel() {
    this.dialogRef.close(false);
  }
}
