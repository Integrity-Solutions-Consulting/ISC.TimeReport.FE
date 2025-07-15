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
import { AuthService } from '../../../auth/services/auth.service';
import { Role } from '../../../auth/interfaces/auth.interface';

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

  dataSource: MatTableDataSource<User> = new MatTableDataSource<User>([]);
  allRoles: Role[] = [];

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  displayedColumns: string[] = ['names', 'username', 'status', 'roles', 'options'];

  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  loadUsers(): void {
    this.roleService.getAllUsers().subscribe({
      next: (usersWithFullName: UserWithFullName[]) => {  // Recibe directamente el array
        this.dataSource.data = usersWithFullName;
      },
      error: (err) => {
        console.error('Error fetching users:', err);
      }
    });
  }

  loadRoles(): void {
    this.authService.getRoles().subscribe(roles => {
      this.allRoles = roles;
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openRolesDialog(user: UserWithFullName): void {
    const dialogRef = this.dialog.open(UserRolesDialogComponent, {
      data: { user }
    });

    dialogRef.afterClosed().subscribe((updatedUser?: UserWithFullName) => {
      if (updatedUser) {
        // Actualizar manualmente la lista
        const index = this.dataSource.data.findIndex(u => u.id === updatedUser.id);
        if (index !== -1) {
          this.dataSource.data[index] = updatedUser;
          this.dataSource._updateChangeSubscription();
        }

        // Forzar recarga después de 1 segundo (simula persistencia)
        setTimeout(() => this.loadUsers(), 1000);
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

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadRoles(); // Recargar lista de roles
      }
    });
  }
}
