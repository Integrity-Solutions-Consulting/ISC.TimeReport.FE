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
import Fuse, { IFuseOptions } from 'fuse.js';

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
  ) {
    // Configurar el sortingDataAccessor para ordenamiento personalizado
    this.dataSource.sortingDataAccessor = (item: any, property: string) => {
      switch (property) {
        case 'idnumber':
          return item.person.identificationNumber?.toLowerCase() || '';
        case 'names':
          return `${item.person.firstName} ${item.person.lastName}`.toLowerCase();
        case 'leadertype':
          return this.getLeaderTypeName(item.leadershipType).toLowerCase();
        case 'contact':
          return item.person.email?.toLowerCase() || '';
        case 'status':
          return item.status ? 'activo' : 'inactivo';
        default:
          return item[property];
      }
    };
  }

  allLeaders: Leader[] = []; // Almacenar todos los líderes
  displayedLeaders: Leader[] = []; // Líderes para mostrar en la página actual
  projects: any[] = [];

  private fuse!: Fuse<Leader>;

  private isFuseInitialized: boolean = false;

  private fuseOptions: IFuseOptions<Leader> = {
      keys: [
          'person.firstName',
          'person.lastName',
          'person.identificationNumber',
          'person.email',
          'leadershipType', // true/false/number se puede buscar como string
          'status' // true/false se puede buscar como string
      ],
      threshold: 0.3, // Permite "fuzzy matching"
      ignoreLocation: true,
      minMatchCharLength: 2,
  };

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
          this.applyFilter(); // ⬅️ Llama al método de filtro Fuse.js
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
      // En lugar de obtener todos los líderes de golpe (que puede ser ineficiente),
      // mantenemos la estructura de carga y luego inicializamos Fuse.js
      this.leaderService.getAllLeaders().subscribe({
          next: (response) => {
              if (response?.items) {
                  this.allLeaders = this.removeDuplicateLeaders(response.items);
                  this.totalItems = this.allLeaders.length;

                  if (!this.isFuseInitialized) {
                      this.fuse = new Fuse(this.allLeaders, this.fuseOptions);
                      this.isFuseInitialized = true;
                  } else {
                      // Si los datos cambian (e.g., después de un CRUD), actualiza la colección de Fuse
                      this.fuse.setCollection(this.allLeaders);
                  }

                  this.applyFilter(); // Aplicar filtro inicial (mostrar la primera página)

                  // Configurar el sort después de cargar los datos
                  setTimeout(() => {
                      if (this.sort) {
                          this.dataSource.sort = this.sort;
                      }
                  });
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
        // ... (La implementación existente es correcta y no se toca)
        const uniqueLeadersMap = new Map<number, Leader>();

        leaders.forEach(leader => {
            if (!uniqueLeadersMap.has(leader.person.id)) {
                uniqueLeadersMap.set(leader.person.id, leader);
            }
        });

        return Array.from(uniqueLeadersMap.values());
    }

  // Aplicar filtro localmente con soporte para caracteres especiales/*
    applyFilter(): void {
        let filteredData: Leader[] = [];
        const searchTerm = this.currentSearch.trim();

        if (!this.isFuseInitialized || !this.allLeaders.length) {
             // Si aún no se cargan o inicializan, solo mostramos lo que haya.
            filteredData = this.allLeaders;
        } else if (!searchTerm) {
            // Si no hay término de búsqueda, usamos todos los líderes cargados.
            filteredData = this.allLeaders;
        } else {
            // Usar Fuse.js para la búsqueda "fuzzy"
            // El resultado de search() es un array de objetos { item: Leader, score: number, ... }
            const searchResults = this.fuse.search(searchTerm);

            // Mapear los resultados para obtener solo el objeto Leader
            filteredData = searchResults.map(result => result.item);
        }

        this.totalItems = filteredData.length;

        // Actualizar paginación con los resultados de Fuse.js o con todos los líderes
        this.updateDisplayedLeaders(filteredData);
    }

  // Actualizar líderes mostrados según paginación
    updateDisplayedLeaders(data: Leader[]): void {
        // Asegurar que la página actual no esté fuera de límites después de filtrar
        const maxPageIndex = Math.max(0, Math.ceil(this.totalItems / this.pageSize) - 1);
        this.currentPage = Math.min(this.currentPage, maxPageIndex);

        const startIndex = this.currentPage * this.pageSize;
        const endIndex = startIndex + this.pageSize;

        this.displayedLeaders = data.slice(startIndex, endIndex);
        this.dataSource.data = this.displayedLeaders;

        // Sincronizar el paginador manualmente con los nuevos datos
        if (this.paginator) {
            this.paginator.length = this.totalItems;
            this.paginator.pageIndex = this.currentPage;
        }
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

  getIdentificationTypeName(idtype: number | null | undefined): string {
    if (idtype === null || idtype === undefined) {
      return 'Desconocido';
    }
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
        leaderId: leader?.id // Pre-seleccionar la persona si existe
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open("Asignaciones actualizadas", "Cerrar", {duration: 5000});
        this.loadAllLeaders(); // Recargar todos los líderes
      }
    });
  }

  ngAfterViewInit() {
    // Configurar el sort si existe
    if (this.sort) {
            this.dataSource.sort = this.sort;
        }

    // Sincronizar el paginador si existe
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
}
