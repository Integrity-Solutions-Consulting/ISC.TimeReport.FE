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

interface DialogData {
  projectId: number;
  projectName: string;
  employeesPersonInfo?: any[]; // Añade esta propiedad
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
  selectedResources: any[] = [];
  projectName: string = '';
  existingAssignments: any[] = [];

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
    this.loadProjectDetails();
  }

  async loadInitialData() {
    try {
      // Cargar empleados
      const empResponse = await this.projectService.getAllEmployees(100, 1, '').toPromise();
      this.employees = empResponse?.items || [];

      // Cargar proveedores
      const provResponse = await this.projectService.getInventoryProviders().toPromise();
      this.providers = provResponse?.data || [];

      // Cargar posiciones
      const posResponse = await this.projectService.getPositions().toPromise();
      this.positions = posResponse || [];

      // Si necesitas verificar los datos cargados
      console.log('Employees:', this.employees);
      console.log('Positions:', this.positions);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  }

  async loadProjectDetails() {
    try {
      const projectDetails = await this.projectService.getProjectDetailByID(this.data.projectId).toPromise();
      this.existingAssignments = projectDetails?.employeeProjects || [];

      // Transformar los datos para que coincidan con la estructura de selectedResources
      this.existingAssignments = this.existingAssignments.map(assignment => ({
        employeeId: assignment.employeeID || null,
        supplierID: assignment.supplierID || null,
        assignedRole: assignment.assignedRole,
        costPerHour: assignment.costPerHour,
        allocatedHours: assignment.allocatedHours,
        isExisting: true // Marcar como asignación existente
      }));
    } catch (error) {
      console.error('Error loading project details:', error);
    }
  }

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
      // Mostrar todas las posiciones para empleados
      return this.positions;
    }
    // Para proveedores mostrar solo la opción "Proveedor"
    return [{ positionName: 'Proveedor' }];
  }

  addResource() {
    if (this.assignmentForm.valid) {
      const formValue = this.assignmentForm.value;

      // Crear nuevo recurso
      const newResource = {
        employeeId: this.selectedResourceType === 1 ? formValue.resource : null,
        supplierID: this.selectedResourceType === 2 ? formValue.resource : null,
        assignedRole: formValue.profile,
        costPerHour: formValue.costPerHour,
        allocatedHours: formValue.totalHours,
        // Agregar timestamp para key único
        timestamp: new Date().getTime()
      };

      // Agregar a la lista
      this.selectedResources = [...this.selectedResources, newResource];

      // Resetear el formulario manteniendo el tipo de recurso
      this.assignmentForm.patchValue({
        resource: null,
        profile: null,
        costPerHour: 0,
        totalHours: 0
      });

      // Enfocar el primer campo para nueva entrada
      setTimeout(() => {
        const firstField = document.querySelector('mat-select[formControlName="resource"]');
        if (firstField) {
          (firstField as HTMLElement).focus();
        }
      });
    }
  }

  removeResource(index: number) {
    this.selectedResources.splice(index, 1);
  }

  getResourceName(resource: any): string {
    if (resource.employeeId) {
      // Buscar en employeesPersonInfo para asignaciones existentes
      if (this.data.employeesPersonInfo) {
        const employee = this.data.employeesPersonInfo.find(e => e.id === resource.employeeId);
        if (employee) return `${employee.firstName} ${employee.lastName}`;
      }
      // Buscar en la lista de empleados cargada para nuevos
      const newEmployee = this.employees.find(e => e.id === resource.employeeId);
      return newEmployee ? `${newEmployee.person.firstName} ${newEmployee.person.lastName}` : 'Empleado no encontrado';
    } else {
      // Proveedor - buscar en la lista cargada
      const provider = this.providers.find(p => p.id === resource.supplierID);
      return provider ? provider.businessName : 'Proveedor no encontrado';
    }
  }

  assignResources() {
    if (this.selectedResources.length > 0) {
      const projectId = this.data.projectId;

      // Combinar asignaciones existentes (si es necesario) con las nuevas
      const allAssignments = [
        ...this.existingAssignments.filter(a => !a.isExisting), // si hay alguna lógica de filtrado
        ...this.selectedResources
      ];

      const request = {
        projectID: projectId,
        employeeProjectMiddle: allAssignments.map(resource => ({
          employeeID: resource.employeeId || null,
          supplierID: resource.supplierID || null,
          assignedRole: resource.assignedRole,
          costPerHour: resource.costPerHour,
          allocatedHours: resource.allocatedHours,
          projectID: projectId,
          status: true
        }))
      };

      this.projectService.assignResourcesToProject(request).subscribe({
        next: () => {
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('Error assigning resources:', err);
        }
      });
    }
  }

  cancel() {
    this.dialogRef.close(false);
  }
}
