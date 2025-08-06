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
    this.loadProjectDetails();
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
      const empResponse = await this.projectService.getAllEmployees(100, 1, '').toPromise();
      this.employees = empResponse?.items || [];

      const provResponse = await this.projectService.getInventoryProviders().toPromise();
      this.providers = provResponse?.data || [];

      const posResponse = await this.projectService.getPositions().toPromise();
      this.positions = posResponse || [];

      console.log('Employees:', this.employees);
      console.log('Positions:', this.positions);
    } catch (error) {
      console.error('Error loading initial data:', error);
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

  getResourceName(resource: EmployeeProject): string {
    if (resource.employeeID) {
      if (this.data.employeesPersonInfo) {
        const employee = this.data.employeesPersonInfo.find(e => e.id === resource.employeeID);
        if (employee) return `${employee.firstName} ${employee.lastName}`;
      }
      const employee = this.employees.find(e => e.id === resource.employeeID);
      return employee ? `${employee.person.firstName} ${employee.person.lastName}` : 'Empleado no encontrado';
    } else if (resource.supplierID) {
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
      //status: true
    }));

    // 2. Preparar recursos existentes que se mantienen
    const keptResources: EmployeeProjectMiddle[] = this.existingAssignments.map(resource => ({
      //id: resource.id,
      employeeId: resource.employeeID,
      supplierID: resource.supplierID,
      assignedRole: resource.assignedRole,
      costPerHour: resource.costPerHour,
      allocatedHours: resource.allocatedHours,
      //status: true
    }));

    // 3. Preparar recursos a eliminar (con todos los campos requeridos)
    const deletedResources: EmployeeProjectMiddle[] = this.assignmentsToDelete.map(assignment => ({
      //id: assignment.id!,
      employeeId: assignment.employeeID || null,
      supplierID: assignment.supplierID || null,
      assignedRole: assignment.assignedRole || 'Eliminado', // Valor por defecto
      costPerHour: assignment.costPerHour || 0,             // Valor por defecto
      allocatedHours: assignment.allocatedHours || 0,       // Valor por defecto
      //status: false
    }));

    // Payload final
    const payload: ResourceAssignmentPayload = {
      projectID: this.data.projectId,
      employeeProjectMiddle: [
        ...newAssignments,
        ...keptResources,
        //...deletedResources
      ]
    };

    console.log('Payload a enviar:', payload);
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
