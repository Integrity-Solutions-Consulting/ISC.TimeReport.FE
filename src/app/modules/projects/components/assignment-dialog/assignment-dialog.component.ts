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
import { ProjectDetail, EmployeeProject } from '../../interfaces/project.interface'; // Import ProjectDetail


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
  selectedResources: any[] = [];
  projectName: string = '';
  existingAssignments: any[] = [];
  assignmentsToDelete: any[] = [];

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
          .filter(assignment => assignment.status === true)
          .map(assignment => ({
            id: assignment.id,
            employeeId: assignment.employeeID ?? null,  // Use null coalescing
            supplierID: assignment.supplierID ?? null,  // Use null coalescing
            assignedRole: assignment.assignedRole,
            costPerHour: assignment.costPerHour,
            allocatedHours: assignment.allocatedHours,
            isExisting: true,
            status: assignment.status
          }));
      } else {
        this.existingAssignments = [];
      }
    } catch (error) {
      console.error('Error loading project details:', error);
      this.existingAssignments = [];
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
      const formValue = this.assignmentForm.value;

      const newResource = {
        employeeId: this.selectedResourceType === 1 ? formValue.resource : null,
        supplierID: this.selectedResourceType === 2 ? formValue.resource : null,
        assignedRole: formValue.profile,
        costPerHour: formValue.costPerHour,
        allocatedHours: formValue.totalHours,
        status: true,
        timestamp: new Date().getTime()
      };

      this.selectedResources = [...this.selectedResources, newResource];

      this.assignmentForm.patchValue({
        resource: null,
        profile: null,
        costPerHour: 0,
        totalHours: 0
      });

      setTimeout(() => {
        const firstField = document.querySelector('mat-select[formControlName="resource"]');
        if (firstField) {
          (firstField as HTMLElement).focus();
        }
      });
    }
  }

  removeResource(index: number, isExisting: boolean = false) {
    if (isExisting) {
      const assignmentToMarkInactive = { ...this.existingAssignments[index], status: false };
      this.assignmentsToDelete.push(assignmentToMarkInactive);
      this.existingAssignments.splice(index, 1);
      this.existingAssignments = [...this.existingAssignments];
    } else {
      this.selectedResources.splice(index, 1);
      this.selectedResources = [...this.selectedResources];
    }
  }

  getResourceName(resource: any): string {
    if (resource.employeeId) {
      if (this.data.employeesPersonInfo) {
        const employee = this.data.employeesPersonInfo.find(e => e.id === resource.employeeId);
        if (employee) return `${employee.firstName} ${employee.lastName}`;
      }
      const newEmployee = this.employees.find(e => e.id === resource.employeeId);
      return newEmployee ? `${newEmployee.person.firstName} ${newEmployee.person.lastName}` : 'Empleado no encontrado';
    } else {
      const provider = this.providers.find(p => p.id === resource.supplierID);
      return provider ? provider.businessName : 'Proveedor no encontrado';
    }
  }

  assignResources() {
    const allAssignmentsToUpdate = [
      ...this.existingAssignments,
      ...this.selectedResources,
      ...this.assignmentsToDelete
    ];

    const payload = {
      projectID: this.data.projectId,
      employeeProjectMiddle: allAssignmentsToUpdate.map(resource => ({
        id: resource.id || 0,
        employeeID: resource.employeeId || null,
        supplierID: resource.supplierID || null,
        assignedRole: resource.assignedRole,
        costPerHour: resource.costPerHour,
        allocatedHours: resource.allocatedHours,
        projectID: this.data.projectId,
        status: resource.status
      }))
    };

    this.projectService.assignResourcesToProject(payload).subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Error assigning resources:', err);
      }
    });
  }

  cancel() {
    this.dialogRef.close(false);
  }
}
