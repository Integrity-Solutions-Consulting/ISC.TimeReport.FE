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
import { ChartData, ChartEvent, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

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
    NgxChartsModule,
    BaseChartDirective
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

  @ViewChild(BaseChartDirective) chart!: BaseChartDirective;

  public pieChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.raw || 0;
            const dataIndex = context.dataIndex;
            const percentage = this.resourcesData[dataIndex]?.porcentaje || 0;
            return `${label}: ${value} recursos (${percentage}%)`;
          }
        }
      }
    }
  };

  public barChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Tipo de Actividad'
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Horas'
        },
        ticks: {
          callback: function(value: any) {
            return value + 'h';
          }
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `Horas: ${context.raw}h`;
          }
        }
      }
    }
  };

  public barChartType: ChartType = 'bar';
  public barChartLabels: string[] = [];
  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [
        '#1c4d8c', '#173f6b', '#2685bf', '#29a7d9', '#0d0d0d', '#666666',
        '#56749b', '#597ca1', '#6ebdee', '#64d3ff', '#777777', '#a4a1a1'
      ],
      borderColor: [
        '#0f2d52', '#0e2845', '#1a6a9e', '#1e8bb5', '#000000', '#4d4d4d'
      ],
      borderWidth: 1,
      borderRadius: 4,
      hoverBackgroundColor: [
        '#56749bff', '#597ca1ff', '#6ebdeeff', '#64d3ffff', '#777777ff', '#a4a1a1ff'
      ]
    }]
  };

  public actividadesData: ActividadResponse[] = [];

  public pieChartType: ChartType = 'pie';
  public doughnutChartType: ChartType = 'doughnut';
  public pieChartLabels: string[] = [];

  public pieChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
        '#8ac6d1', '#ff6b6b', '#a5dee5', '#5fcf80', '#fdd85d', '#b83b5e', '#6a2c70'
      ],
      hoverBackgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
        '#8ac6d1', '#ff6b6b', '#a5dee5', '#5fcf80', '#fdd85d', '#b83b5e', '#6a2c70'
      ],
      borderWidth: 1
    }]
  };

  public resourcesData: RecursoResponse[] = [];

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
    this.loadActividadesData(new Date());
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

  loadActividadesData(date: Date | string | null): void {
    const formattedDate = this.formatDate(date);
    this.http.get<ActividadResponse[]>(`${this.urlBase}/api/Dashboard/horas-por-actividad?fecha=${formattedDate}`)
      .subscribe({
        next: (data) => {
          this.actividadesData = data;

          // Crear NUEVOS arrays para forzar la detección de cambios
          const newLabels = data.map(item => item.tipoActividad);
          const newData = data.map(item => item.totalHoras);

          // Crear un NUEVO objeto para barChartData
          this.barChartData = {
            labels: data.map(item => item.tipoActividad),
            datasets: [{
              data: data.map(item => item.totalHoras), // Spread operator para nuevo array
              backgroundColor: [
                '#1c4d8c', '#173f6b', '#2685bf', '#29a7d9', '#0d0d0d', '#666666',
                '#56749b', '#597ca1', '#6ebdee', '#64d3ff', '#777777', '#a4a1a1'
              ],
              borderColor: [
                '#0f2d52', '#0e2845', '#1a6a9e', '#1e8bb5', '#000000', '#4d4d4d'
              ],
              borderWidth: 1,
              borderRadius: 4,
              hoverBackgroundColor: [
                '#56749bff', '#597ca1ff', '#6ebdeeff', '#64d3ffff', '#777777ff', '#a4a1a1ff'
              ]
            }]
          };

          if (this.chart && this.chart.chart) {
            this.chart.chart.update();
          }
        },
        error: (err) => {
          console.error('Error al cargar horas por actividad:', err);
        }
      });
  }

  loadResourcesData(): void {
    this.http.get<RecursoResponse[]>(`${this.urlBase}/api/Dashboard/recursos-por-cliente`)
      .subscribe({
        next: (data) => {
          this.resourcesData = data;

          // Actualizar datos para ngx-charts
          this.circleData = data.map(item => ({
            name: item.clientName,
            value: item.porcentaje,
          }));

          // Actualizar datos para ng2-charts
          this.pieChartLabels = data.map(item => {
            // Acortar nombres largos para mejor visualización
            if (item.clientName.length > 20) {
              return item.clientName.substring(0, 20) + '...';
            }
            return item.clientName;
          });

          this.pieChartData = {
            labels: this.pieChartLabels,
            datasets: [{
              data: data.map(item => item.totalRecursos),
              backgroundColor: [
                '#1c4d8c', '#173f6b', '#2685bf', '#29a7d9', '#0d0d0d', '#666666'
              ],
              hoverBackgroundColor: [
                '#56749bff', '#597ca1ff', '#6ebdeeff', '#64d3ffff', '#777777ff', '#a4a1a1ff'
              ],
              borderWidth: 1
            }]
          };
        },
        error: (err) => {
          console.error('Error al cargar recursos por cliente:', err);
        }
      });
  }

  customTooltipText({ data }: { data: any }): string {
    return `
      ${data.name}: ${data.value}%
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

  public barChartClicked(event: any): void {
    if (event.active && event.active.length > 0) {
      const activeElement = event.active[0];
      const index = activeElement.index;
      const actividadData = this.actividadesData[index];

      if (actividadData) {
        console.log(`Actividad: ${actividadData.tipoActividad}, Horas: ${actividadData.totalHoras}h`);
        // Aquí puedes mostrar un modal o hacer alguna acción con los datos
      }
    }
  }

  public chartClicked({ event, active }: { event?: ChartEvent, active?: any[] }): void {
    if (active && active.length > 0) {
      const chartElement = active[0];
      const datasetIndex = chartElement.datasetIndex;
      const index = chartElement.index;

      const clientData = this.resourcesData[index];

      if (clientData) {
        console.log(`Cliente: ${clientData.clientName}, Recursos: ${clientData.totalRecursos}, Porcentaje: ${clientData.porcentaje}%`);
        // Aquí puedes mostrar un modal o hacer alguna acción con los datos
      }
    }
  }

  public chartHovered(event: any): void {
    // Lógica de hover - puedes dejarlo vacío si no necesitas funcionalidad
    // o implementar algo como:
    if (event.active && event.active.length > 0) {
      const activeElement = event.active[0];
      const index = activeElement.index;
      // console.log('Hover sobre:', this.resourcesData[index]?.clientName);
    }
  }
}
