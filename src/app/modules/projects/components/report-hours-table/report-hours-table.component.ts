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
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ExcelExporter } from '../../../../shared/exporters/excel-exporter';
import { ProjectService } from '../../services/project.service';
import { ProyectoHoursResponse } from '../../interfaces/project.interface';

@Component({
  selector: 'report-hours-table',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,

    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
  ],
  templateUrl: './report-hours-table.component.html',
  styleUrls: ['./report-hours-table.component.scss'],
  //encapsulation: ViewEncapsulation.None,
})
export class ReportHoursTableComponent implements OnInit {
  loading = true;

  clients: string[] = [];
  filteredClients: string[] = [];

  clientFilter = new FormControl('');
  yearFilter = new FormControl<number | null>(null);
  monthFilter = new FormControl<number | null>(null);

  years: number[] = [];
  months: { value: number; label: string }[] = [];

  displayedColumns = ['client', 'year', 'month', 'resources', 'totalHours'];
  dataSource = new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  constructor(private reportService: ProjectService) {}

  ngOnInit(): void {
    this.loadDataFromAPI();

    // FILTRO CLIENTE AUTOCOMPLETE
    this.clientFilter.valueChanges.subscribe((value) => {
      const search = (value || '').toLowerCase();

      this.filteredClients =
        search === '' || search === 'todos'
          ? this.clients
          : this.clients.filter((c) => c.toLowerCase().includes(search));

      this.applyFilters();
    });

    this.yearFilter.valueChanges.subscribe(() => this.applyFilters());
    this.monthFilter.valueChanges.subscribe(() => this.applyFilters());
  }

  private getMonthLabel(value: number): string {
    const map: Record<number, string> = {
      1: 'Enero',
      2: 'Febrero',
      3: 'Marzo',
      4: 'Abril',
      5: 'Mayo',
      6: 'Junio',
      7: 'Julio',
      8: 'Agosto',
      9: 'Septiembre',
      10: 'Octubre',
      11: 'Noviembre',
      12: 'Diciembre',
    };
    return map[value];
  }

  loadDataFromAPI() {
    this.reportService.getResourcesByClient().subscribe({
      next: (data: ProyectoHoursResponse[]) => {
        const mapped = data.map((x) => ({
          client: x.client,
          year: x.year,
          month: x.monthNumber,
          monthLabel: this.getMonthLabel(x.monthNumber),
          resources: x.resourceCount,
          totalHours: x.totalHours,
        }));

        this.dataSource.data = mapped;

        this.clients = [...new Set(mapped.map((x) => x.client))];
        this.filteredClients = this.clients;

        this.years = [...new Set(mapped.map((x) => x.year))].sort(
          (a, b) => b - a
        );

        const uniqueMonths = [...new Set(mapped.map((x) => x.month))].sort(
          (a, b) => a - b
        );

        this.months = uniqueMonths.map((m) => ({
          value: m,
          label: this.getMonthLabel(m),
        }));

        setTimeout(() => {
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
          const paginatorIntl = this.dataSource.paginator._intl;
          paginatorIntl.itemsPerPageLabel = 'Mostrar:';
          paginatorIntl.nextPageLabel = 'Siguiente';
          paginatorIntl.previousPageLabel = 'Anterior';
          paginatorIntl.firstPageLabel = 'Primera página';
          paginatorIntl.lastPageLabel = 'Última página';
          this.loading = false;
        });
      },
    });
  }

  applyFilters() {
    const client = this.clientFilter.value?.toLowerCase() || '';
    const year = this.yearFilter.value;
    const month = this.monthFilter.value;

    this.dataSource.filterPredicate = (row) =>
      (client === '' ||
        client === 'todos' ||
        row.client.toLowerCase().includes(client)) &&
      (!year || row.year === year) &&
      (!month || row.month === month);

    this.dataSource.filter = Math.random().toString();
  }
  clearFilters(): void {
    this.clientFilter.setValue('', { emitEvent: false });
    this.yearFilter.setValue(null, { emitEvent: false });
    this.monthFilter.setValue(null, { emitEvent: false });

    this.filteredClients = this.clients;
    this.dataSource.filter = '';
  }

  exportToExcel() {
    const rows =
      this.dataSource.filteredData.length > 0
        ? this.dataSource.filteredData
        : this.dataSource.data;

    ExcelExporter.export(
      'Reporte Proyecto por Horas',
      [
        { header: 'Cliente', key: 'client', width: 25 },
        { header: 'Año', key: 'year', width: 10 },
        { header: 'Mes', key: 'monthLabel', width: 15 },
        { header: 'Recursos', key: 'resources', width: 15 },
        { header: 'Horas', key: 'totalHours', width: 10 },
      ],
      rows,
      'Reporte_Proyecto_Horas'
    );
  }
}
