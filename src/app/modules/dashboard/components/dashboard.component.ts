import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BrowserModule } from '@angular/platform-browser';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { Color, ScaleType, NgxChartsModule, LegendPosition } from '@swimlane/ngx-charts';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { HttpClient } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, map, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface ActividadResponse {
  tipoActividad: string;
  totalHoras: number;
}

interface RecursoResponse {
  clientName: string;
  totalRecursos: number;
  porcentaje: number
}

interface ResumenGeneralResponse {
  totalProyectosActivos: number;
  totalClientes: number;
  totalEmpleados: number;
  proyectosPlanificacion: number;
  proyectosAprobados: number;
  proyectosEnProgreso: number;
  proyectosEnEspera: number;
  proyectosCancelados: number;
  proyectosCompletos: number;
  proyectosAplazados: number;
}

interface Proyecto {
  proyecto: string;
  cliente: string;
  lider_Tecnico: string;
  fecha_Inicio: string;
  fecha_Finalizacion: string;
  colaboradores: string;
}

export const MY_FORMATS = {
  parse: {
    dateInput: 'YYYY-MM-DD',
  },
  display: {
    dateInput: 'YYYY-MM-DD',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatDatepickerModule,
    MatGridListModule,
    MatToolbarModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSortModule,
    MatMenuModule,
    NgxChartsModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE],
    },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})

export class DashboardComponent implements OnInit{

  urlBase: string = environment.URL_BASE;

  dateControl = new FormControl<Date>(new Date());
  chartData: any[] = [];
  circleData: any[] = [];

  displayedColumns: string[] = ['proyecto', 'cliente', 'lider_Tecnico', 'fecha_Inicio', 'fecha_Finalizacion', 'colaboradores'];
  dataSource = new MatTableDataSource<Proyecto>();
  loading = true;
  filterControl = new FormControl();
  tipoFiltroControl = new FormControl('proyecto');

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  categorias = [
    'Desarrollo',
    'Reuniones',
    'Análisis',
    'Testing',
    'Documentación',
    'Soporte',
    'Capacitación'
  ];

  colorScheme: Color = {
    name: 'customColors', // A unique name for your scheme
    selectable: true,     // Whether the colors are selectable (usually true)
    group: ScaleType.Ordinal, // Or ScaleType.Linear, depending on your chart type and data
    domain: ['var(--itg-primary)', 'var(--itg-primary-dark)', 'var(--itg-primary-bg)', 'var(--itg-secondary)', 'var(--itg-secondary-dark)', 'var(--itg-secondary-bg)', 'var(--itg-text-muted)'] // Your array of hex color strings
  };

  gradient: boolean = true;
  showLegend: boolean = true;
  showLabels: boolean = true;
  isDoughnut: boolean = true;
  legendPosition: LegendPosition = LegendPosition.Right;
  tooltipDisabled: boolean = false;

  view: number[] = [700, 400];

  data3: any[] = [];

  cardColor: string = "var(--itg-bg)";

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadDataForDate(new Date());
    this.loadResourcesData();
    this.loadDataForTable();
    this.loadGeneralSummary();
    this.dateControl.valueChanges.subscribe((date: Date | null) => {
      if (date) {
        this.loadDataForDate(date);
      } else {
        console.warn('Fecha es null o undefined');
        // Opcional: Puedes cargar datos con una fecha por defecto
        this.loadDataForDate(new Date());
      }
    });
    this.filterControl.valueChanges
      .pipe(
        debounceTime(300), // Esperar 300ms después de cada tecla
        distinctUntilChanged(), // Solo si el valor cambió
        switchMap(value => this.fetchData(this.tipoFiltroControl.value, value))
      )
      .subscribe({
        next: (data) => this.updateTable(data),
        error: (err) => this.handleError(err)
      });

    // Reaccionar a cambios en el tipo de filtro
    this.tipoFiltroControl.valueChanges
      .subscribe(() => {
        this.filterControl.setValue(''); // Resetear filtro
        this.loadInitialData();
      });
  }

  loadInitialData(): void {
    this.loading = true;
    this.fetchData(this.tipoFiltroControl.value, '').subscribe({
      next: (data) => this.updateTable(data),
      error: (err) => this.handleError(err)
    });
  }

  fetchData(tipoFiltro: string | null, valor: string | null) {
    this.loading = true;

    // Asegurar valores no nulos con valores por defecto
    const params = {
      tipoFiltro: tipoFiltro ?? 'proyecto',  // Si es null, usa 'proyecto'
      valor: valor ?? ''                     // Si es null, usa string vacío
    };

    return this.http.get<Proyecto[]>(`${this.urlBase}/api/Dashboard/resumen-proyectos`, { params });
  }

  updateTable(data: Proyecto[]): void {
    this.dataSource.data = data;
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.loading = false;
  }

  handleError(err: any): void {
    console.error('Error:', err);
    this.loading = false;
    // Opcional: Mostrar mensaje de error al usuario
  }

  loadGeneralSummary(): void {
    this.http.get<ResumenGeneralResponse>(`${this.urlBase}/api/Dashboard/resumen-general`)
      .subscribe({
        next: (response) => {
          this.data3 = [
            { name: 'Proyectos Activos', value: response.totalProyectosActivos },
            { name: 'Clientes', value: response.totalClientes },
            { name: 'Empleados', value: response.totalEmpleados },
            { name: 'En Planificación', value: response.proyectosPlanificacion },
            { name: 'Aprobados', value: response.proyectosAprobados },
            { name: 'En Progreso', value: response.proyectosEnProgreso },
            { name: 'En Espera', value: response.proyectosEnEspera },
            { name: 'Cancelados', value: response.proyectosCancelados },
            { name: 'Completados', value: response.proyectosCompletos },
            { name: 'Aplazados', value: response.proyectosAplazados }
          ];
        },
        error: (err) => {
          console.error('Error al cargar el resumen general:', err);
          // Opcional: Puedes inicializar data3 con valores por defecto en caso de error
          this.data3 = [
            { name: 'Proyectos Activos', value: 0 },
            { name: 'Clientes', value: 0 },
            // ... otros valores por defecto
          ];
        }
      });
  }

  loadResourcesData(): void {
    this.http.get<RecursoResponse[]>(`${this.urlBase}/api/Dashboard/recursos-por-cliente`)
      .subscribe({
        next: (data) => {
          // Transformar los datos al formato que necesita ngx-charts
          this.circleData = data.map(item => ({
            name: item.clientName,
            value: item.porcentaje,
          }));
        },
        error: (err) => {
          console.error('Error al cargar recursos por cliente:', err);
        }
      });
  }

  customTooltipText({ data }: { data: any }): string {
    return `
      abd
    `;
  }

  loadDataForCards(): void {
    this.http.get
  }

  loadDataForTable(): void {
    this.loading = true;
    const tipoFiltro = this.tipoFiltroControl.value || 'proyecto';;
    const valor = this.filterControl.value || '';

    this.http.get<Proyecto[]>(`${this.urlBase}/api/Dashboard/resumen-proyectos`, {
      params: { tipoFiltro, valor }
    }).subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading data:', err);
        this.loading = false;
      }
    });
  }

  loadDataForDate(date: Date | string | null): void {
    const formattedDate = this.formatDate(date);
    console.log('Fecha formateada:', formattedDate);

    // Especificamos el tipo de respuesta esperada
    this.http.get<ActividadResponse[]>(`${this.urlBase}/api/Dashboard/horas-por-actividad?fecha=${formattedDate}`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    )
      .pipe(
        map((response: ActividadResponse[]) => this.processData(response))
      )
      .subscribe((data: any[]) => {
        this.chartData = data;
      });
  }

  applyFilter(): void {
    this.loadDataForTable();
  }

  changeFilterType(): void {
    this.filterControl.setValue(''); // Resetear filtro al cambiar tipo
    this.loadDataForTable();
  }

  private processData(response: any[]): any[] {
    // Inicializamos todas las categorías con 0 horas
    const processedData = this.categorias.map(cat => ({
      name: cat,
      value: 0
    }));

    // Actualizamos los valores con los datos del servidor
    response.forEach(item => {
      // Normalizamos el nombre de la actividad para hacer coincidir con nuestras categorías
      const normalizedName = this.normalizeActivityName(item.tipoActividad);
      const foundCategory = processedData.find(cat => cat.name === normalizedName);

      if (foundCategory) {
        foundCategory.value = item.totalHoras;
      }
    });

    return processedData;
  }

  private normalizeActivityName(activityName: string): string {
    // Mapeamos nombres del API a nuestras categorías
    const mapping: {[key: string]: string} = {
      'Reunión': 'Reuniones',
      // Puedes añadir más mapeos aquí si es necesario
    };

    return mapping[activityName] || activityName;
  }

  private formatDate(dateInput: Date | string | null): string {
    if (!dateInput) return this.formatDate(new Date());

    // Extraer directamente YYYY-MM-DD si es un string ISO
    if (typeof dateInput === 'string' && dateInput.includes('T')) {
      const datePart = dateInput.split('T')[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        return datePart;
      }
    }

    // Resto de la lógica para otros formatos...
    const date = new Date(dateInput);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

}
