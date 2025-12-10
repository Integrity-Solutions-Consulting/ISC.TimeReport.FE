import { Component, OnInit, ViewChild } from '@angular/core';
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

import { ExcelExporter } from '../../../../shared/exporters/excel-exporter';
import { ProjectService } from '../../services/project.service';
import { ProyectoHoursResponse } from '../../interfaces/project.interface';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'report-hours-table',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './report-hours-table.component.html',
  styleUrls: ['./report-hours-table.component.scss'],
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

    this.clientFilter.valueChanges.subscribe((value) => {
      const search = (value || '').toLowerCase();

      if (search === 'todos' || value === '') {
        this.filteredClients = this.clients;
      } else {
        this.filteredClients = this.clients.filter((c) =>
          c.toLowerCase().includes(search)
        );
      }

      this.applyFilters();
    });

    this.yearFilter.valueChanges.subscribe(() => this.applyFilters());
    this.monthFilter.valueChanges.subscribe(() => this.applyFilters());
  }

  private getMonthLabel(value: number): string {
    const map: Record<number, string> = {
      1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
      5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
      9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'
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
          resources: x.resourceCount,
          totalHours: x.totalHours,
        }));

        this.dataSource.data = mapped;

        this.clients = [...new Set(mapped.map((x) => x.client))];
        this.filteredClients = this.clients;

        this.years = [...new Set(mapped.map((x) => x.year))].sort((a, b) => b - a);

        const uniqueMonths = [...new Set(mapped.map((x) => x.month))].sort();
        this.months = uniqueMonths.map((m) => ({
          value: m,
          label: this.getMonthLabel(m),
        }));

        setTimeout(() => {
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
          this.loading = false;
        });
      }
    });
  }

  applyFilters() {
    const client = (this.clientFilter.value || '').toLowerCase();
    const year = this.yearFilter.value;
    const month = this.monthFilter.value;

    this.dataSource.filterPredicate = (row) => {
      const matchClient =
        client === 'todos' ||
        client === '' ||
        row.client.toLowerCase().includes(client);

      const matchYear = !year || row.year === year;
      const matchMonth = !month || row.month === month;

      return matchClient && matchYear && matchMonth;
    };

    this.dataSource.filter = Math.random().toString();
  }

  clearFilters() {
    this.clientFilter.setValue('', { emitEvent: true });
    this.yearFilter.setValue(null, { emitEvent: true });
    this.monthFilter.setValue(null, { emitEvent: true });

    this.dataSource.filter = '';
  }

  exportToExcel() {
    const rows =
      this.dataSource.filteredData.length > 0
        ? this.dataSource.filteredData
        : this.dataSource.data;

    ExcelExporter.export(
      'Reporte de Proyecto por Horas',
      [
        { header: 'Cliente', key: 'client', width: 25 },
        { header: 'Año', key: 'year', width: 10 },
        { header: 'Mes', key: 'month', width: 15 },
        { header: 'Recursos', key: 'resources', width: 15 },
        { header: 'Horas', key: 'totalHours', width: 10 },
      ],
      rows,
      'Reporte_Proyecto_Horas'
    );
  }
}
