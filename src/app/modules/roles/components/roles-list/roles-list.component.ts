import { AfterViewInit, Component, inject, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { User, UserWithFullName } from '../../interfaces/role.interface';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RoleService } from '../../services/role.service';
import { CommonModule } from '@angular/common';
import { UserRolesDialogComponent } from '../user-roles-dialog/user-roles-dialog.component';
import { RoleEditDialogComponent } from '../role-edit-dialog/role-edit-dialog.component';
import { RoleDialogComponent } from '../role-dialog/role-dialog.component';
import { AuthService } from '../../../auth/services/auth.service';
import { Role, Module } from '../../../auth/interfaces/auth.interface';

@Component({
  selector: 'roles-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule
  ],
  templateUrl: './roles-list.component.html',
  styleUrl: './roles-list.component.scss'
})
export class RolesListComponent implements OnInit, AfterViewInit {
  private roleService = inject(RoleService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);

  displayedColumns: string[] = ['roleName', 'description', 'modules', 'actions'];
  dataSource: MatTableDataSource<any> = new MatTableDataSource();
  allModules: Module[] = [];
  allRoles: Role[] = [];

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit(): void {
    this.loadRoles();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  loadRoles(): void {
    this.roleService.getRoles().subscribe(roles => {
      this.dataSource.data = roles;
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  formatModules(modules: any[]): string {
    return modules.map(m => m.moduleName).join(', ');
  }

  openEditRoleDialog(role: any): void {
    const dialogRef = this.dialog.open(RoleDialogComponent, {
      width: '800px',
      data: { role, modules: this.allModules }
    });

    dialogRef.afterClosed().subscribe(updatedRole => {
      if (updatedRole) {
        // Actualizamos directamente el datasource con el rol modificado
        const data = this.dataSource.data;
        const index = data.findIndex(r => r.id === role.id);
        if (index !== -1) {
          data[index] = updatedRole;
          this.dataSource.data = data;
        }
      }
    });
  }

  openNewRoleDialog(): void {
    const dialogRef = this.dialog.open(RoleEditDialogComponent, {
      width: '600px',
      data: { role: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadRoles(); // Recargar lista de roles
      }
    });
  }

  editRole(role: Role): void {
    const dialogRef = this.dialog.open(RoleEditDialogComponent, {
      width: '600px',
      data: { role }
    });

    dialogRef.afterClosed().subscribe(updatedRole => {
      if (updatedRole) {
        // Actualizamos directamente el datasource con el rol modificado
        const data = this.dataSource.data;
        const index = data.findIndex(r => r.id === role.id);
        if (index !== -1) {
          data[index] = updatedRole;
          this.dataSource.data = data;
        }
      }
    });
  }
}
