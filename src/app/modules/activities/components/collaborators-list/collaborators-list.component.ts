import { SelectionModel } from '@angular/cdk/collections';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { catchError, forkJoin, of, tap } from 'rxjs';
import { ClientDetail, LeaderDetail, ProjectDetail } from '../../interfaces/activity.interface';
import { environment } from '../../../../../environments/environment';

interface Collaborator {
  nombre: string;
  cedula: string;
  proyecto: string;
  cliente: string;
  lider: string;
  horas: number;
  estado: string;
}

@Component({
  selector: 'collaborators-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatTableModule,
    ReactiveFormsModule
  ],
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './collaborators-list.component.html',
  styleUrl: './collaborators-list.component.scss'
})
export class CollaboratorsListComponent implements OnInit{

  private http = inject(HttpClient);
  urlBase: string = environment.URL_BASE;

  readonly range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });

  displayedColumns: string[] = ['select', 'colaborador', 'proyecto', 'cliente', 'lider', 'horas', 'estado', 'actions'];
  dataSource: MatTableDataSource<Collaborator> = new MatTableDataSource<Collaborator>([]);
  selection = new SelectionModel<Collaborator>(true, []);
  searchControl = new FormControl('');
  totalItems = 0;
  pageSize = 10;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    this.loadData();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onPageChange(event: any) {
    // Handle pagination changes
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.dataSource.data.forEach(row => this.selection.select(row));
  }

  loadData() {
    this.http.get<any[]>(`${this.urlBase}/api/TimeReport/recursos-pendientes`).pipe(
      catchError(error => {
        console.error('Error loading employees:', error);
        return of([]);
      })
    ).subscribe(employees => {
      if (!employees || employees.length === 0) {
        this.dataSource.data = [];
        return;
      }

      const requests = employees.map(emp => {
        // Usamos 'any' temporalmente para depuración
        const projectRequest = this.http.get<any>(
          `${this.urlBase}/api/Project/GetProjectDetailByID/${emp.employeeID}`
        ).pipe(
          catchError(error => {
            console.error('Error project:', error);
            return of(null);
          })
        );

        const clientRequest = this.http.get<any>(
          `${this.urlBase}/api/Client/GetClientByID/${emp.employeeID}`
        ).pipe(
          catchError(error => {
            console.error('Error client:', error);
            return of(null);
          })
        );

        const leaderRequest = this.http.get<any>(
          `${this.urlBase}/api/Leader/GetLeaderByID/${emp.employeeID}`
        ).pipe(
          catchError(error => {
            console.error('Error leader:', error);
            return of(null);
          })
        );

        return forkJoin({
          employee: of(emp),
          project: projectRequest,
          client: clientRequest,
          leader: leaderRequest
        }).pipe(
          tap(result => console.log('Resultado completo:', result))
        );
      });

      forkJoin(requests).subscribe({
        next: (results) => {

          const collaborators: Collaborator[] = results.map(result => {
            const emp = result.employee;

            // Manejo seguro de los datos
            const projectData = result.project?.data || result.project;
            const clientData = result.client?.data || result.client;
            const leaderData = result.leader?.data || result.leader;

            return {
              employeeID: emp.employeeID,
              nombre: emp.nombreCompletoEmpleado,
              cedula: emp.employeeID.toString(),
              proyecto: projectData?.name || 'No asignado',
              cliente: clientData?.tradeName || clientData?.legalName || 'No asignado',
              lider: leaderData?.person ?
                `${leaderData.person.firstName} ${leaderData.person.lastName}` : 'No asignado',
              horas: emp.horasRegistradasMes,
              estado: emp.horasRegistradasMes >= 80 ? 'Completo' : 'Pendiente'
            };
          });

          this.dataSource.data = collaborators;
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
          this.totalItems = collaborators.length;
        },
        error: (err) => {
          console.error('Error loading details:', err);
          this.dataSource.data = [];
        }
      });
    });
  }
}
