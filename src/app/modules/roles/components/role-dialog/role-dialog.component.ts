import { MatListModule } from '@angular/material/list';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Module } from '../../../auth/interfaces/auth.interface';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { RoleService } from '../../services/role.service';
import { AuthService } from '../../../auth/services/auth.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ErrorHandlerService } from '../../../../shared/services/errorhandler.service';

@Component({
  selector: 'app-role-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule
  ],
  templateUrl: './role-dialog.component.html',
  styleUrl: './role-dialog.component.scss'
})
export class RoleDialogComponent implements OnInit {
  roleForm: FormGroup;
  allModules: Module[] = [];
  selectedModules: number[] = [];
  isLoading = true;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private roleService: RoleService,
    private authService: AuthService,
    private errorHandler: ErrorHandlerService,
    public dialogRef: MatDialogRef<RoleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { role?: any }
  ) {
    this.isEditMode = !!data.role;
    this.roleForm = this.fb.group({
      roleName: [data.role?.roleName || '', Validators.required],
      description: [data.role?.description || ''],
      moduleIds: [data.role?.modules?.map((m: { id: number }) => m.id) || []]
    });
  }

  ngOnInit(): void {
    this.loadModules();
  }

  loadModules(): void {
    this.authService.getRoles().subscribe({
      next: (roles) => {
        const allModules = roles.flatMap(role => role.modules || []);

        // Filtrar módulos únicos y válidos
        this.allModules = Array.from(new Set(allModules.map(m => m.id)))
          .map(id => allModules.find(m => m.id === id))
          .filter((module): module is Module => !!module);

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading modules:', err);
        this.isLoading = false;
      }
    });
  }

  toggleModule(moduleId: number): void {
    const index = this.selectedModules.indexOf(moduleId);
    if (index === -1) {
      this.selectedModules.push(moduleId);
    } else {
      this.selectedModules.splice(index, 1);
    }
  }

  isModuleSelected(moduleId: number): boolean {
    return this.selectedModules.includes(moduleId);
  }

  onSave(): void {
    if (this.roleForm.valid) {
      this.isLoading = true;
      const formValue = this.roleForm.value;
      const roleData = {
        roleName: formValue.roleName,
        description: formValue.description,
        moduleIds: formValue.moduleIds
      };

      const operation = this.isEditMode
        ? this.roleService.updateRole(this.data.role.id, roleData)
        : this.roleService.createRole(roleData);

      operation.subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => {
          this.isLoading = false;
          if (err.error?.Message === 'Ya existe un rol con ese nombre') {
            this.errorHandler.showError(err.error.Message);
          } else {
            this.errorHandler.showError('Ocurrió un error al procesar la solicitud');
          }
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
