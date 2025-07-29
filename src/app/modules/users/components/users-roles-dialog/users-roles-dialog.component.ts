// user-roles-dialog.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../auth/services/auth.service';
import { Role, UserWithFullName } from '../../../auth/interfaces/auth.interface';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-user-roles-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule
  ],
  templateUrl: './users-roles-dialog.component.html',
  styleUrls: ['./users-roles-dialog.component.scss']
})
export class UsersRolesDialogComponent implements OnInit {
  rolesForm: FormGroup;
  allRoles: Role[] = [];
  isLoading = true;
  isSaving = false;

  constructor(
    public dialogRef: MatDialogRef<UsersRolesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { user: UserWithFullName },
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {
    this.rolesForm = this.fb.group({
      roleIds: new FormControl<number[]>([], Validators.required)
    });
  }

  ngOnInit(): void {
    this.loadAllRoles();
  }

  loadAllRoles(): void {
    this.authService.getRoles().subscribe({
      next: (roles) => {
        this.allRoles = roles;

        // Establecer los roles actuales del usuario
        const currentRoleIds = this.data.user.role?.map(r => r.id) || [];
        this.rolesForm.patchValue({
          roleIds: currentRoleIds
        });

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading roles:', err);
        this.snackBar.open('Error al cargar los roles', 'Cerrar', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  onSave(): void {
    if (this.rolesForm.invalid || this.isSaving) return;

    this.isSaving = true;
    const selectedRoleIds = this.rolesForm.value.roleIds;
    const userId = this.data.user.id;

    this.userService.assignRolesToUser(userId, selectedRoleIds).subscribe({
      next: (response) => {
        // Crear objeto de usuario actualizado
        const updatedUser = {
          ...this.data.user,
          role: this.allRoles.filter(role => selectedRoleIds.includes(role.id))
        };

        this.snackBar.open('Roles actualizados correctamente', 'Cerrar', { duration: 3000 });
        this.dialogRef.close(updatedUser);
      },
      error: (err) => {
        console.error('Error updating user roles:', err);
        this.snackBar.open('Error al actualizar los roles', 'Cerrar', { duration: 3000 });
        this.isSaving = false;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
