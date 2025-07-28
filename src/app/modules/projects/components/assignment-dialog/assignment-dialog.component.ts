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

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    public dialogRef: MatDialogRef<AssignmentDialogComponent>,
    private currencyPipe: CurrencyPipe,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.assignmentForm = this.fb.group({
      resourceType: [1, Validators.required],
      resource: [null, Validators.required],
      profile: [null, Validators.required],
      costPerHour: [0, [Validators.required, Validators.min(0)]],
      totalHours: [0, [Validators.required, Validators.min(0)]]
    });

    this.loadInitialData();
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
      const selectedEmployeeId = this.assignmentForm.get('resource')?.value;
      const employee = this.employees.find(e => e.id === selectedEmployeeId);

      if (employee) {
        // Buscar la posición en el catálogo
        const position = this.positions.find(p => p.id === employee.positionID);
        return position ? [position] : [];
      }
    }
    return [];
  }

  addResource() {
    if (this.assignmentForm.valid) {
      const formValue = this.assignmentForm.value;
      const resource = {
        employeeId: this.selectedResourceType === 1 ? formValue.resource : null,
        supplierID: this.selectedResourceType === 2 ? formValue.resource : null,
        assignedRole: formValue.profile,
        costPerHour: formValue.costPerHour,
        allocatedHours: formValue.totalHours
      };
      this.selectedResources.push(resource);
      this.assignmentForm.reset({
        resourceType: this.selectedResourceType,
        resource: null,
        profile: null,
        costPerHour: 0,
        totalHours: 0
      });
    }
  }

  removeResource(index: number) {
    this.selectedResources.splice(index, 1);
  }

  assignResources() {
    if (this.selectedResources.length > 0) {
      const projectId = this.data.projectId; // Asumimos que pasamos el projectId al diálogo
      const request = {
        projectID: projectId,
        employeeProjectMiddle: this.selectedResources
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
