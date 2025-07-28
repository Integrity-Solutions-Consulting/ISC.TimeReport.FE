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
import { Subject } from 'rxjs';
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

    projects: Project[] = [];

    loading = false;

    dataSource: MatTableDataSource<Project> = new MatTableDataSource<Project>([]);

    @ViewChild(MatSort) sort!: MatSort;
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    searchControl = new FormControl('');

    selection = new SelectionModel<any>(true, []);

    displayedColumns: string[] = ['code', 'name', 'description', 'startDate', 'endDate', 'options'];

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
      private route: ActivatedRoute
    ) {}

    ngOnInit(): void {
      this.loadProjects();
    }

    loadProjects(pageNumber: number = 1, pageSize: number = 10, search: string = ''): void {
      this.projectService.getProjectsForTables(pageNumber, pageSize, search).subscribe({
        next: (response) => {
          if (response?.items) {
              this.dataSource = new MatTableDataSource<Project>(response.items);
              this.totalItems = response.totalItems;
              this.pageSize = response.pageSize;
              this.currentPage = response.pageNumber - 1;

              if (this.paginator) {
                this.paginator.length = this.totalItems;
                this.paginator.pageSize = this.pageSize;
                this.paginator.pageIndex = this.currentPage;
              }
            } else {
            console.error('La respuesta del API no tiene la estructura esperada:', response);
            this.dataSource = new MatTableDataSource<Project>([]); // Tabla vacía como fallback
          }
        },
        error: (err) => {
          console.error('Error al cargar proyectos:', err);
          this.dataSource = new MatTableDataSource<Project>([]); // Tabla vacía en caso de error
        }
      });
    }

    onPageChange(event: PageEvent): void {
      this.pageSize = event.pageSize;
      this.currentPage = event.pageIndex + 1;
      // Pasa el valor de búsqueda actual al cargar los empleados
      this.loadProjects(this.currentPage, this.pageSize, this.currentSearch);
    }

    ngAfterViewInit(){
      if (this.paginator || this.sort){
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
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

    applyFilter(event: Event) {
      const filterValue = (event.target as HTMLInputElement).value;
      this.dataSource.filter = filterValue.trim().toLowerCase();

      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
      }
    }


    openCreateDialog(): void {
      const dialogRef = this.dialog.open(ProjectModalComponent, {
        width: '800px',
        disableClose: true,
        data: { project: null }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.projectService.createProject(result);
          this.snackBar.open("Proyecto creado con éxito", "Cerrar", {duration: 5000})
        } else {
          this.snackBar.open("Ocurrió un error", "Cerrar", {duration: 5000})
        }
      });
    }

    openEditDialog(project: Project): void {
      if (!project.id) {
        this.snackBar.open("No se puede editar: ID de proyecto no válido", "Cerrar", {duration: 5000});
        return;
      }

      const dialogRef = this.dialog.open(ProjectModalComponent, {
        width: '600px',
        data: { project: project } // Envía el proyecto completo
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.loadProjects(); // Recarga la lista después de la actualización
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

    openAssignDialog(project: ProjectWithID) {
      if (!project.id) {
        this.snackBar.open("No se puede asignar recursos: ID de proyecto no válido", "Cerrar", {duration: 5000});
        return;
      }

      const dialogRef = this.dialog.open(AssignmentDialogComponent, {
        width: '800px',
        data: { projectId: project.id }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.snackBar.open("Recursos asignados con éxito", "Cerrar", {duration: 5000});
        }
      });
    }
}
