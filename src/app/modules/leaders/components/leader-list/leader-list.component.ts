import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { LeadersService } from './../../services/leaders.service';
import { Component, inject, Injectable, OnInit, ViewChild } from '@angular/core';
import { Leader, LeaderWithIDandPerson, LeaderWithPerson} from '../../interfaces/leader.interface';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { LeaderModalComponent } from '../leader-modal/leader-modal.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { Subject } from 'rxjs';
import { ProjectService } from '../../../projects/services/project.service';
import { Project } from '../../../projects/interfaces/project.interface';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';

@Injectable()
export class LeaderPaginatorIntl implements MatPaginatorIntl {
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
  selector: 'leader-list',
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
    MatTooltipModule
  ],
  providers: [
    {provide: MatPaginatorIntl, useClass: LeaderPaginatorIntl}
  ],
  templateUrl: './leader-list.component.html',
  styleUrl: './leader-list.component.scss'
})
export class LeaderListComponent implements OnInit{

  private leaderService = inject(LeadersService);
  private projectService = inject(ProjectService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  leaders: Leader[] = [];
  projects: Project[] = [];

  dataSource: MatTableDataSource<Leader> = new MatTableDataSource<Leader>();

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  displayedColumns: string[] = ['idtype', 'idnumber', 'leadertype', 'status', 'names', 'surnames', 'project', 'options'];

  selection = new SelectionModel<any>(true, []);

  ngOnInit(): void {
    this.loadLeaders();
    this.loadProjects();
  }

  readonly identificationTypesMap: {[key: number]: string} = {
    1: 'Cédula',
    2: 'RUC',
    3: 'Pasaporte',
  };

  getProjectName(projectID: number): string {
    const project = this.projects.find(p => p.id === projectID);
    return project ? project.name : 'Proyecto no encontrado';
  }

  loadLeaders(): void {
    this.leaderService.getLeaders().subscribe({
      next: (response) => {
        if (response?.items) {
          this.dataSource = new MatTableDataSource<Leader>(response.items);
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        } else {
          console.error('La respuesta del API no tiene la estructura esperada:', response);
          this.dataSource = new MatTableDataSource<Leader>([]); // Tabla vacía como fallback
        }
      },
      error: (err) => {
        console.error('Error al cargar proyectos:', err);
        this.dataSource = new MatTableDataSource<Leader>([]); // Tabla vacía en caso de error
      }
    });
  }

  loadProjects(): void {
    this.projectService.getProjects().subscribe({
      next: (response) => {
        this.projects = response.items;
      },
      error: (error) => {
        console.error('Error loading projects:', error);
      }
    });
  }

  openCreateDialog(): void {
      const dialogRef = this.dialog.open(LeaderModalComponent, {
        width: '600px',
        disableClose: true,
        data: { customer: null }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          if (result.type === 'withPerson') {
            this.leaderService.createLeaderWithPerson(result.data).subscribe({
              next: () => {
                this.snackBar.open("Líder creado con éxito", "Cerrar", {duration: 5000});
                this.loadLeaders();
              },
              error: (err) => {
                this.snackBar.open("Error al crear líder: " + err.message, "Cerrar", {duration: 5000});
              }
            });
          } else if (result.type === 'withPersonID') {
            this.leaderService.createLeaderWithPersonID(result.data).subscribe({
              next: () => {
                this.snackBar.open("Líder creado con éxito", "Cerrar", {duration: 5000});
                this.loadLeaders();
              },
              error: (err) => {
                this.snackBar.open("Error al crear líder: " + err.message, "Cerrar", {duration: 5000});
              }
            });
          }
        }
      });
    }

  openEditDialog(leader: Leader): void {
    const dialogRef = this.dialog.open(LeaderModalComponent, {
      width: '800px',
      disableClose: true,
      data: {
        leader: leader,
        isEdit: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.snackBar.open('Líder actualizado con éxito', 'Cerrar', { duration: 5000 });
        this.loadLeaders(); // Recargar la lista
      }
    });
  }

  getIdentificationTypeName(idtype: number): string {
    return this.identificationTypesMap[idtype] || 'Desconocido';
  }

  getLeaderTypeName(leadertype: boolean): string {
    return leadertype ? 'Integrity' : 'Externo';
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.leaders.length;
    return numSelected === numRows;
  }

  toggleAll() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.selection.select(...this.leaders);
  }

  toggleLeaderStatus(leader: LeaderWithIDandPerson): void {
    const confirmationMessage = leader.status
      ? '¿Estás seguro de que deseas desactivar este líder?'
      : '¿Estás seguro de que deseas activar este líder?';

    if (confirm(confirmationMessage)) {
      if (leader.status) {
        // Lógica para desactivar
        this.leaderService.inactivateLeader(leader.id, {
          personID: leader.person.id,
          projectID: leader.projectID,
          leadershipType: leader.leadershipType,
          startDate: leader.startDate,
          endDate: leader.endDate,
          responsibilities: leader.responsibilities,
          status: true
        }).subscribe({
          next: () => {
            this.snackBar.open('Líder desactivado con éxito', 'Cerrar', { duration: 3000 });
            this.loadLeaders(); // Recargar la lista
          },
          error: (err) => {
            this.snackBar.open('Error al desactivar líder', 'Cerrar', { duration: 3000 });
          }
        });
      } else {
        // Lógica para activar
        this.leaderService.activateLeader(leader.id, {
          personID: leader.person.id,
          projectID: leader.projectID,
          leadershipType: leader.leadershipType,
          startDate: leader.startDate,
          endDate: leader.endDate,
          responsibilities: leader.responsibilities,
          status: true
        }).subscribe({
          next: () => {
            this.snackBar.open('Líder activado con éxito', 'Cerrar', { duration: 3000 });
            this.loadLeaders(); // Recargar la lista
          },
          error: (err) => {
            this.snackBar.open('Error al activar líder', 'Cerrar', { duration: 3000 });
          }
        });
      }
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

}
