import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
  MatNativeDateModule,
} from '@angular/material/core';

import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { ExcelExporter } from '../../../../shared/exporters/excel-exporter';

import { CustomDateAdapter } from '../../../../shared/adapters/custom-date-adapter';
import { MY_DATE_FORMATS } from '../../../employees/components/employee-dialog/employee-dialog.component';
import { ProyectoDataResponse } from '../../interfaces/reports';
import { ReportsService } from '../../services/Reports.service';



@Component({
  selector: 'report-dates-table',
  standalone: true,
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'es-EC' },
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,

    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatAutocompleteModule,

    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './report-dates-table.component.html',
  styleUrls: ['./report-dates-table.component.scss'],
  //encapsulation: ViewEncapsulation.None,
})
export class ReportDatesTableComponent implements OnInit {
  // ===== FILTROS =====
  clientFilter = new FormControl<string | null>(null);
  leaderFilter = new FormControl<string | null>(null);
  profileFilter = new FormControl<string | null>(null);
  startDateFilter = new FormControl<Date | null>(null);
  endDateFilter = new FormControl<Date | null>(null);
  minEndDate: Date | null = null;
  maxStartDate: Date | null = null;

  clients: string[] = [];
  filteredClients: string[] = []; // AUTOCOMPLETE

  leaders: string[] = [];
  filteredLeaders: string[] = []; // AUTOCOMPLETE

  profiles: string[] = [];

  displayedColumns = [
    'client',
    'leader',
    'resource',
    'profile',
    'start',
    'end',
  ];
  loading = true;

  dataSource = new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;


  constructor(
    private reportService: ReportsService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadDataFromAPI();

    // ===== AUTOCOMPLETE CLIENTE =====
    this.clientFilter.valueChanges.subscribe((value) => {
      const search = (value || '').toLowerCase();

      this.filteredClients =
        search === 'todos' || search === ''
          ? this.clients
          : this.clients.filter((c) => c.toLowerCase().includes(search));

      this.applyFilters();
    });

    // ===== AUTOCOMPLETE LÍDER =====
    this.leaderFilter.valueChanges.subscribe((value) => {
      const search = (value || '').toLowerCase();

      this.filteredLeaders =
        search === 'todos' || search === ''
          ? this.leaders
          : this.leaders.filter((l) => l.toLowerCase().includes(search));

      this.applyFilters();
    });

    // ===== SELECT PERFIL =====
    this.profileFilter.valueChanges.subscribe(() => this.applyFilters());

    // ===== FECHAS =====
    this.startDateFilter.valueChanges.subscribe(() => {
      this.validateDates();
      this.applyFilters();
    });

    this.endDateFilter.valueChanges.subscribe(() => {
      this.validateDates();
      this.applyFilters();
    });
  }

  // ===== CARGAR DATA =====
  loadDataFromAPI() {
    this.reportService.getProjectResources().subscribe({
      next: (data: ProyectoDataResponse[]) => {
        const mapped = data.map((x) => ({
          client: x.clientName,
          leader: x.projectLeader,
          resource: x.resourceName,
          profile: x.position,
          start: new Date(x.startDate),
          end: new Date(x.endDate),
        }));

        this.dataSource.data = mapped;

        this.clients = [...new Set(mapped.map((x) => x.client))];
        this.leaders = [...new Set(mapped.map((x) => x.leader))];
        this.profiles = [...new Set(mapped.map((x) => x.profile))];

        this.filteredClients = this.clients;
        this.filteredLeaders = this.leaders;

        setTimeout(() => {
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;

          if (this.dataSource.paginator) {
            this.dataSource.paginator.firstPage();
          }

          const paginatorIntl = this.dataSource.paginator._intl;
          paginatorIntl.itemsPerPageLabel = 'Mostrar:';
          paginatorIntl.nextPageLabel = 'Siguiente';
          paginatorIntl.previousPageLabel = 'Anterior';
          paginatorIntl.firstPageLabel = 'Primera página';
          paginatorIntl.lastPageLabel = 'Última página';

          this.loading = false;
        });
      },
      error: (err) => console.error('Error cargando reporte:', err),
    });
  }

  // ===== FILTROS =====
  applyFilters() {
    const client = this.clientFilter.value?.toLowerCase() || '';
    const leader = this.leaderFilter.value?.toLowerCase() || '';
    const profile = this.profileFilter.value;
    const start = this.startDateFilter.value;
    const end = this.endDateFilter.value;

    this.dataSource.filterPredicate = (row) => {
      const matchClient =
        client === '' ||
        client === 'todos' ||
        row.client.toLowerCase().includes(client);

      const matchLeader =
        leader === '' ||
        leader === 'todos' ||
        row.leader.toLowerCase().includes(leader);

      const matchProfile = !profile || row.profile === profile;

      const matchStart = !start || row.start >= start;
      const matchEnd = !end || row.end <= end;

      return (
        matchClient && matchLeader && matchProfile && matchStart && matchEnd
      );
    };

    this.dataSource.filter = Math.random().toString();
    if (this.dataSource.filteredData.length === 0) {
      this.showMessage('No existen registros');
    }

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  startDateFilterFn = (date: Date | null): boolean => {
    if (!date) return false;

    // Si NO hay fecha fin → no bloquear nada
    if (!this.endDateFilter.value) {
      return true;
    }

    // Si hay fecha fin → inicio debe ser <= fin
    return date <= this.endDateFilter.value;
  };

  endDateFilterFn = (date: Date | null): boolean => {
    if (!date) return false;

    // ❗ Si NO hay fecha inicio → NO bloquear nada
    if (!this.startDateFilter.value) {
      return true;
    }

    // Si hay fecha inicio → fin debe ser >= inicio
    return date >= this.startDateFilter.value;
  };

  // ===== VALIDACIÓN DE FECHAS =====
  validateDates() {
    const start = this.startDateFilter.value;
    const end = this.endDateFilter.value;

    // Ajustar límites dinámicos en ambos sentidos
    this.minEndDate = start ? new Date(start) : null;
    this.maxStartDate = end ? new Date(end) : null;

    // Caso 1 → No hay fechas
    if (!start && !end) return;

    // Caso 2 → Solo FIN sin INICIO
    if (!start && end) {
      this.endDateFilter.setValue(null, { emitEvent: false });
      this.showMessage('Debes seleccionar primero la fecha de inicio.');
      return;
    }

    // Caso 3 → Solo INICIO (permitido)
    if (start && !end) return;

    // Caso 4 → Ambas fechas → validar rangos
    if (start && end && end < start) {
      this.endDateFilter.setValue(null, { emitEvent: false });
      this.showMessage(
        'La fecha fin debe ser mayor o igual a la fecha inicio.'
      );
      return;
    }

    if (start && end && start > end) {
      this.startDateFilter.setValue(null, { emitEvent: false });
      this.showMessage('La fecha inicio no puede ser mayor a la fecha fin.');
      return;
    }
  }

  showMessage(msg: string) {
    this.snackBar.open(msg, 'Cerrar', {
      duration: 2500,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['toast-warning'],
    });
  }

  // ===== LIMPIAR =====
  clearFilters(): void {
  this.clientFilter.setValue('', { emitEvent: false });
  this.leaderFilter.setValue('', { emitEvent: false });
  this.profileFilter.setValue(null, { emitEvent: false });
  this.startDateFilter.setValue(null, { emitEvent: false });
  this.endDateFilter.setValue(null, { emitEvent: false });

  this.filteredClients = this.clients;
  this.filteredLeaders = this.leaders;

  this.dataSource.filter = '';
}

  // ===== EXPORTAR =====
  exportToExcel() {
    const rows =
      this.dataSource.filteredData.length > 0
        ? this.dataSource.filteredData
        : this.dataSource.data;

    ExcelExporter.export(
      'Reporte Proyecto por Fechas',
      [
        { header: 'Cliente', key: 'client', width: 25 },
        { header: 'Líder', key: 'leader', width: 20 },
        { header: 'Recurso', key: 'resource', width: 25 },
        { header: 'Perfil', key: 'profile', width: 20 },
        { header: 'Fecha Inicio', key: 'start', width: 15 },
        { header: 'Fecha Fin', key: 'end', width: 15 },
      ],
      rows,
      'Reporte_Proyecto_Fechas'
    );
  }
}
