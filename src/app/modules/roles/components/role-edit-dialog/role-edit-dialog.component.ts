import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { AuthService } from '../../../auth/services/auth.service';
import { Role, Module } from '../../../auth/interfaces/auth.interface';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ErrorHandlerService } from '../../../../shared/services/errorhandler.service';

@Component({
  selector: 'app-role-edit-dialog',
  standalone: true,
  templateUrl: './role-edit-dialog.component.html',
  styleUrls: ['./role-edit-dialog.component.scss'],
  imports: [
    CommonModule,
    MatButtonModule,
    MatCheckboxModule, // Añadir este módulo
    MatDialogModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    ReactiveFormsModule
  ]
})
export class RoleEditDialogComponent implements OnInit {
  roleForm: FormGroup;
  allModules: Module[] = [];
  isEditMode = false;
  isLoading = true;
  isSaving = false;

  constructor(
    public dialogRef: MatDialogRef<RoleEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {role?: Role},
    private fb: FormBuilder,
    private authService: AuthService,
    private errorHandler: ErrorHandlerService
  ) {
    this.roleForm = this.fb.group({
      roleName: ['', Validators.required],
      description: [''],
      moduleIds: new FormControl<number[]>([]) // Tipado explícito
    });

    if (data.role) {
      this.isEditMode = true;
      const moduleIds = data.role.modules?.map(m => m.id) || [];

      this.roleForm.patchValue({
        roleName: data.role.roleName,
        description: data.role.description,
        moduleIds: moduleIds // Asegurar que es un array de números
      });
    }
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

  onSave(): void {
    if (this.roleForm.invalid || this.isSaving) return;

    this.isSaving = true;
    const { roleName, description, moduleIds } = this.roleForm.value;
    const payload = {
      roleName,
      description,
      moduleIds: moduleIds || []
    };

    const operation = this.isEditMode && this.data.role
      ? this.authService.updateRole(this.data.role.id, payload)
      : this.authService.createRole(payload);

    operation.subscribe({
      next: () => {
        this.isSaving = false;
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.isSaving = false;
        if (err.error?.Message === 'Ya existe un rol con ese nombre') {
          this.errorHandler.showError(err.error.Message);
        } else {
          const errorMessage = err.error?.Message || 'Ocurrió un error al procesar la solicitud';
          this.errorHandler.showError(errorMessage);
        }
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
