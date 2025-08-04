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
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { ProjectService } from '../../../projects/services/project.service';
import { Project } from '../../../projects/interfaces/project.interface';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

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
    MatTooltipModule,
    ReactiveFormsModule
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

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  leaders: Leader[] = [];
  projects: Project[] = [];

  selection = new SelectionModel<any>(true, []);

  dataSource: MatTableDataSource<Leader> = new MatTableDataSource<Leader>();

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  searchControl = new FormControl('');

  displayedColumns: string[] = ['idtype', 'idnumber', 'leadertype', 'names', 'surnames', 'project', 'status', 'options'];

  totalItems: number = 0;
  pageSize: number = 10;
  currentPage: number = 0;
  currentSearch: string = '';
  lastSearch: string = '';

  ngOnInit(): void {
    this.loadLeaders(this.currentPage + 1, this.pageSize, this.currentSearch);
    this.searchControl.valueChanges.pipe(
          debounceTime(300),
          distinctUntilChanged()
        ).subscribe(value => {
          this.currentSearch = value || ''; // Update the search string
          this.currentPage = 0;             // Reset internal 0-based page index to 0
          this.paginator.firstPage();       // Reset MatPaginator to first page (pageIndex becomes 0)
          // Calls loadEmployees, passing (0 + 1) = 1 as the page number for the backend
          this.loadLeaders(1, this.pageSize, this.currentSearch);
        });
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

  loadLeaders(pageNumber: number = 1, pageSize: number = 10, search: string = ''): void {
    this.leaderService.getLeaders(pageNumber, pageSize, search).subscribe({
      next: (response) => {
        if (response?.items) {
          this.dataSource.data = response.items; // Actualiza solo los datos
          this.totalItems = response.totalItems;
        }
      },
      error: (err) => {
        console.error('Error:', err);
        this.snackBar.open("Error al cargar líderes", "Cerrar", {duration: 5000});
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex + 1;
    this.loadLeaders(this.currentPage, this.pageSize, this.currentSearch);
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
        width: '800px',
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
        leader: {
          ...leader,
          personType: leader.person.personType,
          endDate: leader.endDate ? new Date(leader.endDate) : null
        },
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

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: { message: confirmationMessage }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) { // If user clicked 'Sí'
        if (leader.status) {
          // Logic to deactivate
          this.leaderService.inactivateLeader(leader.id, {
            personID: leader.person.id,
            projectID: leader.projectID,
            leadershipType: leader.leadershipType,
            startDate: leader.startDate,
            endDate: leader.endDate,
            responsibilities: leader.responsibilities,
            status: false // Set status to false for inactivation
          }).subscribe({
            next: () => {
              this.snackBar.open('Líder desactivado con éxito', 'Cerrar', { duration: 3000 });
              this.loadLeaders(); // Reload the list
            },
            error: (err) => {
              this.snackBar.open('Error al desactivar líder', 'Cerrar', { duration: 3000 });
              console.error('Error al desactivar líder:', err); // Log the actual error
            }
          });
        } else {
          // Logic to activate
          this.leaderService.activateLeader(leader.id, {
            personID: leader.person.id,
            projectID: leader.projectID,
            leadershipType: leader.leadershipType,
            startDate: leader.startDate,
            endDate: leader.endDate,
            responsibilities: leader.responsibilities,
            status: true // Set status to true for activation
          }).subscribe({
            next: () => {
              this.snackBar.open('Líder activado con éxito', 'Cerrar', { duration: 3000 });
              this.loadLeaders(); // Reload the list
            },
            error: (err) => {
              this.snackBar.open('Error al activar líder', 'Cerrar', { duration: 3000 });
              console.error('Error al activar líder:', err); // Log the actual error
            }
          });
        }
      } else {
        // User cancelled the action
        this.snackBar.open('Acción cancelada', 'Cerrar', { duration: 2000 });
      }
    });
  }

  /*applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }*/

  viewLeaderDetails(projectId: number): void {
    this.router.navigate([projectId], { relativeTo: this.route });
  }
}
