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
import { Project, ProjectWithID } from '../../../projects/interfaces/project.interface';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { AssignmentLeaderDialogComponent } from '../leader-assignment/leader-assignment.component';

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
    MatMenuModule,
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

  allLeaders: Leader[] = []; // Almacenar todos los líderes
  displayedLeaders: Leader[] = []; // Líderes para mostrar en la página actual
  projects: any[] = [];

  selection = new SelectionModel<any>(true, []);

  // Mantener el dataSource como Leader[] en lugar de UniqueLeader[]
  dataSource: MatTableDataSource<Leader> = new MatTableDataSource<Leader>();

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  searchControl = new FormControl('');

  displayedColumns: string[] = ['idnumber', 'leadertype', 'names', 'status', 'contact', 'options'];

  totalItems: number = 0;
  pageSize: number = 10;
  currentPage: number = 0;
  currentSearch: string = '';

  ngOnInit(): void {
    // Cargar todos los líderes (9999) pero mantener paginación visual
    this.loadAllLeaders();

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      this.currentSearch = value || '';
      this.currentPage = 0;
      if (this.paginator) {
        this.paginator.firstPage();
      }
      this.applyFilter(); // Aplicar filtro localmente
    });

    this.loadProjects();
  }

  readonly identificationTypesMap: {[key: number]: string} = {
    1: 'Cédula',
    2: 'Pasaporte',
    3: 'RUC',
  };

  getProjectName(projectID: number): string {
    const project = this.projects.find(p => p.id === projectID);
    return project ? project.name : 'Proyecto no encontrado';
  }

  // Cargar todos los líderes
  loadAllLeaders(): void {
    this.leaderService.getAllLeaders().subscribe({
      next: (response) => {
        if (response?.items) {
          // Eliminar duplicados antes de almacenar
          this.allLeaders = this.removeDuplicateLeaders(response.items);
          this.totalItems = this.allLeaders.length;
          this.applyFilter(); // Aplicar filtro inicial
        }
      },
      error: (err) => {
        console.error('Error:', err);
        this.snackBar.open("Error al cargar líderes", "Cerrar", {duration: 5000});
      }
    });
  }

  // Eliminar duplicados por ID de persona
  private removeDuplicateLeaders(leaders: Leader[]): Leader[] {
    const uniqueLeadersMap = new Map<number, Leader>();

    leaders.forEach(leader => {
      // Usar el ID de la persona como clave para evitar duplicados
      if (!uniqueLeadersMap.has(leader.person.id)) {
        uniqueLeadersMap.set(leader.person.id, leader);
      }
    });

    return Array.from(uniqueLeadersMap.values());
  }

  // Aplicar filtro localmente
  applyFilter(): void {
    let filteredData = this.allLeaders;

    // Aplicar filtro de búsqueda
    if (this.currentSearch) {
      const searchLower = this.currentSearch.toLowerCase();
      filteredData = this.allLeaders.filter(leader =>
        leader.person.firstName.toLowerCase().includes(searchLower) ||
        leader.person.lastName.toLowerCase().includes(searchLower) ||
        leader.person.identificationNumber.includes(this.currentSearch)
      );
    }

    this.totalItems = filteredData.length;

    // Actualizar paginación
    this.updateDisplayedLeaders(filteredData);
  }

  // Actualizar líderes mostrados según paginación
  updateDisplayedLeaders(data: Leader[]): void {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedLeaders = data.slice(startIndex, endIndex);
    this.dataSource.data = this.displayedLeaders;
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
    this.applyFilter(); // Reaplicar filtro con nueva paginación
  }

  private loadProjects() {
    // Usamos valores grandes para pageSize para obtener todos los proyectos
    this.projectService.getProjectsForTables(1, 1000).subscribe({
      next: (response) => {
        this.projects = response.items || []
      },
      error: (error) => {
        console.error('Error loading projects:', error);
        this.projects = [];
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
                this.loadAllLeaders(); // Recargar todos los líderes
              },
              error: (err) => {
                this.snackBar.open("Error al crear líder: " + err.message, "Cerrar", {duration: 5000});
              }
            });
          } else if (result.type === 'withPersonID') {
            this.leaderService.createLeaderWithPersonID(result.data).subscribe({
              next: () => {
                this.snackBar.open("Líder creado con éxito", "Cerrar", {duration: 5000});
                this.loadAllLeaders(); // Recargar todos los líderes
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
        this.loadAllLeaders(); // Recargar todos los líderes
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
    const numRows = this.allLeaders.length;
    return numSelected === numRows;
  }

  toggleAll() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.selection.select(...this.allLeaders);
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
              this.loadAllLeaders(); // Recargar todos los líderes
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
              this.loadAllLeaders(); // Recargar todos los líderes
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

  viewLeaderDetails(projectId: number): void {
    this.router.navigate([projectId], { relativeTo: this.route });
  }

  openAssignDialog(leader?: any): void {
    const dialogRef = this.dialog.open(AssignmentLeaderDialogComponent, {
      width: '1200px',
      maxHeight: '80vh',
      data: {
        leader: leader, // Opcional: pasar el líder si se hace clic en una fila específica
        leaderId: leader.id // Pre-seleccionar la persona si existe
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open("Asignaciones actualizadas", "Cerrar", {duration: 5000});
        this.loadAllLeaders(); // Recargar todos los líderes
      }
    });
  }
}
