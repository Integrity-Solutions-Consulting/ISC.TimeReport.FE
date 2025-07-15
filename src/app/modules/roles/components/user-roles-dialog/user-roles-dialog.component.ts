import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../auth/services/auth.service';
import { Role } from '../../../auth/interfaces/auth.interface';
import { User, UserWithFullName } from '../../interfaces/role.interface';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { forkJoin } from 'rxjs';
import { RoleService } from '../../services/role.service';

@Component({
  selector: 'app-user-roles-dialog',
  standalone: true,
  templateUrl: './user-roles-dialog.component.html',
  styleUrls: ['./user-roles-dialog.component.scss'],
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    ReactiveFormsModule,
  ]
})
export class UserRolesDialogComponent implements OnInit {
  rolesForm: FormGroup;
  allRoles: Role[] = [];
  isLoading = true;

  constructor(
    public dialogRef: MatDialogRef<UserRolesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {user: UserWithFullName},
    private fb: FormBuilder,
    private authService: AuthService,
    private roleService: RoleService,
    private cdRef: ChangeDetectorRef
  ) {
    this.rolesForm = this.fb.group({
      roles: new FormControl([], Validators.required)
    });
  }

  ngOnInit(): void {
    this.loadRoles();
    this.authService.getRoles().subscribe(roles => {
      this.allRoles = roles;

      // Obtener roles actuales del usuario
      this.authService.getRolesOfUser(this.data.user.id).subscribe(userRoles => {
        const currentRoleIds = userRoles.data.role.map((r: Role) => r.id);
        this.rolesForm.patchValue({
          roles: currentRoleIds
        });
        this.isLoading = false;
      });
    });
  }

  ngAfterViewInit(): void {
    // Soluciona el error de ExpressionChanged
    Promise.resolve().then(() => {
      this.cdRef.detectChanges();
    });
  }

  loadRoles(): void {
    this.isLoading = true;

    forkJoin([
      this.authService.getRoles(),
      this.authService.getRolesOfUser(this.data.user.id)
    ]).subscribe({
      next: ([allRoles, userRoles]) => {
        this.allRoles = allRoles;
        const currentRoleIds = userRoles.data.role.map((r: Role) => r.id);
        this.rolesForm.patchValue({
          roles: currentRoleIds
        }, { emitEvent: false }); // <-- Importante

        this.isLoading = false;
        this.cdRef.detectChanges(); // <-- Notificar cambios
      },
      error: (err) => {
        console.error('Error loading roles:', err);
        this.isLoading = false;
      }
    });
  }

  onSave(): void {
    const selectedRoleIds = this.rolesForm.value.roles;

    if (!selectedRoleIds?.length) {
      alert('Seleccione al menos un rol');
      return;
    }

    this.isLoading = true;

    // 1. Actualización optimista local
    const updatedUser = {
      ...this.data.user,
      role: this.allRoles.filter(role => selectedRoleIds.includes(role.id)),
      modules: this.getModulesForRoles(selectedRoleIds)
    };

    // 2. Enviar al backend
    this.authService.assignRolesToUser(this.data.user.id, selectedRoleIds).subscribe({
      next: (success) => {
        if (success) {
          this.dialogRef.close(updatedUser);
        } else {
          // Revertir cambios locales si falla
          alert('Error al guardar en servidor. Cambios no persistentes.');
        }
      },
      error: (err) => {
        console.error('Error:', err);
        alert('Error de conexión');
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

private getModulesForRoles(roleIds: number[]): any[] {
  return this.allRoles
    .filter(role => roleIds.includes(role.id))
    .flatMap(role => role.modules || [])
    .filter((module, index, self) =>
      index === self.findIndex(m => m.id === module.id)
    );
}

  loadUsers(): void {
    // Si necesitas acceder al listado de usuarios desde el servicio
    this.roleService.getAllUsers().subscribe(users => {
      // Aquí puedes actualizar datos locales si es necesario
      console.log('Usuarios actualizados:', users);
    });
}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onSelectionChange(event: MatSelectionListChange) {
    const selectedValues = event.source.selectedOptions.selected.map(o => o.value);
    this.rolesForm.get('roles')?.setValue(selectedValues);
  }

  handleSelectionChange(event: MatSelectionListChange): void {
    const selectedValues = event.source.selectedOptions.selected.map(option => option.value);
    this.rolesForm.get('roles')?.setValue(selectedValues);
  }
}
