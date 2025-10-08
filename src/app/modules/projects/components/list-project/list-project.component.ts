import { ProjectService } from './../../services/project.service';
import { Component, inject, Injectable, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogActions, MatDialogClose, MatDialogContent } from '@angular/material/dialog';
import { ApiResponse, Project, ProjectWithID } from '../../interfaces/project.interface';
import { SelectionModel } from '@angular/cdk/collections';
import { ProjectModalComponent } from '../project-modal/project-modal.component';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';

import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { ActivatedRoute, Router } from '@angular/router';
import { AssignmentDialogComponent } from '../assignment-dialog/assignment-dialog.component';
import { MatMenuModule } from '@angular/material/menu';

@Injectable()
export class ProjectPaginatorIntl implements MatPaginatorIntl {
  changes = new Subject<void>();

  firstPageLabel = `Primera Página`;
  itemsPerPageLabel = `Registros por Página:`;
  lastPageLabel = `Última Página`;

  nextPageLabel = 'Página Siguiente ';
  previousPageLabel = 'Página Anterior';

  getRangeLabel(page: number, pageSize: number, length: number): string {
    if (length === 0) {
      return `Página 1 de 1`;
    }
    const amountPages = Math.ceil(length / pageSize);
    return `Página ${page + 1} de ${amountPages}`;
  }
}

interface ProjectWithIndex extends Project {
  [key: string]: any; // Esto permite el acceso indexado con strings
}

@Component({
  selector: 'list-project',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatCheckboxModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatSortModule,
    MatPaginatorModule,
    MatTooltipModule,
    ReactiveFormsModule
  ],
  providers: [
    {
      provide: MatPaginatorIntl,
      useClass: ProjectPaginatorIntl
    }
  ],
  templateUrl: './list-project.component.html',
  styleUrl: './list-project.component.scss'
})
export class ListProjectComponent implements OnInit{

    private projectService = inject(ProjectService);
    private snackBar = inject(MatSnackBar);
    private dialog = inject(MatDialog)

    projects: ProjectWithID[] = [];

    loading = false;

    dataSource: MatTableDataSource<Project> = new MatTableDataSource<Project>([]);

    @ViewChild(MatSort) sort!: MatSort;
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    searchControl = new FormControl('');
    currentSearchTerm: string = '';

    selection = new SelectionModel<any>(true, []);

    displayedColumns: string[] = ['code', 'name', 'description', 'startDate', 'endDate', 'leader', 'options'];

    readonly projectCodesMap: {[key: string]: string} = {
    '1': 'Planificación',
    '2': 'Aprobado',
    '3': 'En Progreso',
    '4': 'En Espera',
    '5': 'Cancelado',
    '6': 'Completado',
    '7': 'Aplazado'
    }

    totalItems: number = 0;
    pageSize: number = 10;
    currentPage: number = 0;
    currentSearch: string = '';

    constructor(
      private router: Router,
      private route: ActivatedRoute,
    ) {
      this.dataSource = new MatTableDataSource();
      this.dataSource.sortingDataAccessor = (item: ProjectWithIndex, property: string) => {
        switch (property) {
          case 'startDate':
          case 'endDate':
            return new Date(item[property]).getTime();
          default:
            return item[property];
        }
      };
    }

    ngOnInit(): void {
      this.setupSearchControl();
      this.loadProjects();
    }

    private setupSearchControl(): void {
      this.searchControl.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged()
      ).subscribe(searchTerm => {
        this.currentSearch = searchTerm || ''; // Usamos currentSearch que es la variable consistente
        this.currentPage = 0; // Resetear a la primera página
        this.loadProjects(1, this.pageSize, this.currentSearch);
      });
    }

    loadProjects(pageNumber: number = 1, pageSize: number = 10, search: string = ''): void {
      this.loading = true;
      this.currentSearch = search; // Mantenemos actualizado el término de búsqueda

      this.projectService.getProjectsForTables(pageNumber, pageSize, search).subscribe({
        next: (response) => {
          this.loading = false;
          if (response?.items) {
            this.dataSource.data = response.items;
            this.totalItems = response.totalItems;
            this.pageSize = response.pageSize;
            this.currentPage = response.pageNumber - 1;

            // Actualiza el paginador si existe
            if (this.paginator) {
              this.paginator.length = this.totalItems;
              this.paginator.pageSize = this.pageSize;
              this.paginator.pageIndex = this.currentPage;
            }
          }
        },
        error: (err) => {
          this.loading = false;
          console.error('Error al cargar proyectos:', err);
          this.snackBar.open('Error al cargar proyectos', 'Cerrar', {duration: 5000});
        }
      });
    }

    getLeaderName(project: any): string {
        if (project.lider && project.lider.length > 0) {
            const leader = project.lider[0];
            if (leader.getPersonResponse) {
                return `${leader.getPersonResponse.firstName} ${leader.getPersonResponse.lastName}`;
            }
        }
        return 'Sin asignar';
    }

    onPageChange(event: PageEvent): void {
      this.pageSize = event.pageSize;
      this.currentPage = event.pageIndex;
      this.loadProjects(this.currentPage + 1, this.pageSize, this.currentSearch);
    }

    ngAfterViewInit() {
      // Configura el sort si existe
      if (this.sort) {
        this.dataSource.sort = this.sort;
      }

      // Sincroniza el paginador si existe
      if (this.paginator) {
        this.paginator.page.subscribe((event) => {
          this.onPageChange(event);
        });

        // Configuración inicial del paginador
        this.paginator.length = this.totalItems;
        this.paginator.pageSize = this.pageSize;
        this.paginator.pageIndex = this.currentPage;
      }
    }

    getProjectStatusName(projectStatusId: number): string {
      return this.projectCodesMap[projectStatusId] || 'Desconocido';
    }

    isAllSelected() {
      const numSelected = this.selection.selected.length;
      const numRows = this.projects.length;
      return numSelected === numRows;
    }

    toggleAll() {
      if (this.isAllSelected()) {
        this.selection.clear();
        return;
      }

      this.selection.select(...this.projects);
    }

    openCreateDialog(): void {
        const dialogRef = this.dialog.open(ProjectModalComponent, {
            width: '800px',
            disableClose: true,
            data: { project: null }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                // Solo recarga los proyectos, el modal ya hizo la creación
                this.loadProjects(this.currentPage + 1, this.pageSize, this.currentSearch);
                this.snackBar.open("Proyecto creado con éxito", "Cerrar", {duration: 5000});
            }
        });
    }

    openEditDialog(project: ProjectWithID): void {
      if (!project.id) {
        this.snackBar.open("No se puede editar: ID de proyecto no válido", "Cerrar", {duration: 5000});
        return;
      }

      const dialogRef = this.dialog.open(ProjectModalComponent, {
        width: '800px', // Aumenté el ancho para acomodar mejor los campos
        data: { project: project } // Envía el proyecto completo
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.loadProjects(this.currentPage + 1, this.pageSize, this.currentSearch);
          this.snackBar.open("Proyecto actualizado con éxito", "Cerrar", {duration: 5000});
        }
      });
    }

    toggleProjectStatus(project: ProjectWithID): void {
      const confirmationMessage = project.status
        ? '¿Estás seguro de que deseas desactivar este proyecto?'
        : '¿Estás seguro de que deseas activar este proyecto?';

      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        width: '600px',
        data: { message: confirmationMessage }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          // User confirmed, proceed with status change
          if (project.status) {
            // Logic to deactivate
            this.projectService.inactivateProject(project.id, {
              clientID: project.clientID,
              projectStatusID: project.projectStatusID,
              code: project.code,
              name: project.name,
              description: project.description,
              startDate: project.startDate,
              endDate: project.endDate,
              budget: project.budget,
              status: false // Set status to false for inactivation
            }).subscribe({
              next: () => {
                this.snackBar.open('Proyecto desactivado con éxito', 'Cerrar', { duration: 3000 });
                this.loadProjects(); // Reload the list
              },
              error: (err) => {
                this.snackBar.open('Error al desactivar proyecto', 'Cerrar', { duration: 3000 });
                console.error('Error inactivating project:', err);
              }
            });
          } else {
            // Logic to activate
            this.projectService.activateProject(project.id, {
              clientID: project.clientID,
              projectStatusID: project.projectStatusID,
              code: project.code,
              name: project.name,
              description: project.description,
              startDate: project.startDate,
              endDate: project.endDate,
              budget: project.budget,
              status: true // Set status to true for activation
            }).subscribe({
              next: () => {
                this.snackBar.open('Proyecto activado con éxito', 'Cerrar', { duration: 3000 });
                this.loadProjects(); // Reload the list
              },
              error: (err) => {
                this.snackBar.open('Error al activar proyecto', 'Cerrar', { duration: 3000 });
                console.error('Error activating project:', err);
              }
            });
          }
        } else {
          // User cancelled the action
          this.snackBar.open('Acción cancelada', 'Cerrar', { duration: 2000 });
        }
      });
    }

    viewProjectDetails(projectId: number): void {
      this.router.navigate([projectId], { relativeTo: this.route });
    }

    projectionView(projectId: number): void {
      this.router.navigate(['projection', projectId], { relativeTo: this.route });
    }

    openAssignDialog(project: ProjectWithID) {
      if (!project.id) {
        this.snackBar.open("No se puede asignar recursos: ID de proyecto no válido", "Cerrar", {duration: 5000});
        console.log('Proyecto recibido:', project);
        return;
      }

      const dialogRef = this.dialog.open(AssignmentDialogComponent, {
        width: '1000px',
        data: {
          projectId: project.id,
          projectName: project.name // Pasamos el nombre del proyecto
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.snackBar.open("Recursos asignados con éxito", "Cerrar", {duration: 5000});
        }
      });
    }

  downloadProjects(): void {
    this.projectService.exportProjectsToExcel().subscribe({
      next: (blob: Blob) => {
        // Crear un enlace temporal para descargar el archivo
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `proyectos_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();

        // Limpiar
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        this.snackBar.open('Archivo descargado con éxito', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        console.error('Error al descargar proyectos:', err);
        this.snackBar.open('Error al descargar el archivo', 'Cerrar', { duration: 5000 });
      }
    });
  }

  downloadProjection(project: any): void {
    if (!project || !project.id) {
      console.error('Proyecto no válido');
      return;
    }

    console.log('Iniciando descarga de proyección para el proyecto:', project.id);

    this.projectService.exportProjectionToExcel(project.id).subscribe({
      next: (blob: Blob) => {
        // Crear un enlace temporal para descargar el archivo
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `proyeccion_${project.code}_${new Date().getTime()}.xlsx`;
        document.body.appendChild(a);
        a.click();

        // Limpiar
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        console.log('Descarga completada exitosamente');
      },
      error: (error) => {
        console.error('Error al descargar la proyección:', error);
        // Aquí puedes mostrar un mensaje de error al usuario
        alert('Error al descargar la proyección. Por favor, intente nuevamente.');
      }
    });
  }
}
