import { Component, inject, Injectable, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Subject } from 'rxjs';
import { ProjectService } from '../../services/project.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ApiResponse, Project } from '../../interfaces/project.interface';
import { SelectionModel } from '@angular/cdk/collections';
import { ProjectModalComponent } from '../project-modal/project-modal.component';
import { CommonModule } from '@angular/common';

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
    MatPaginatorModule
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

    selection = new SelectionModel<any>(true, []);

    displayedColumns: string[] = ['projectStatus', 'code', 'name', 'description', 'startDate', 'endDate', 'options'];

    readonly projectCodesMap: {[key: string]: string} = {
    '1': 'Planificación',
    '2': 'Aprobado',
    '3': 'En Progreso',
    '4': 'En Espera',
    '5': 'Cancelado',
    '6': 'Completado',
    '7': 'Aplazado'
    }

    ngOnInit(): void {
      this.loadProjects();
    }

    loadProjects(): void {
      this.projectService.getProjects().subscribe({
        next: (response) => {
          if (response?.items) {
            this.dataSource = new MatTableDataSource<Project>(response.items);
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
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
        width: '500px',
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
      const dialogRef = this.dialog.open(ProjectModalComponent, {
        width: '500px',
        disableClose: true,
        data: { project }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.projectService.updateProject(project.projectId!, result);
        }
      });
    }

}
