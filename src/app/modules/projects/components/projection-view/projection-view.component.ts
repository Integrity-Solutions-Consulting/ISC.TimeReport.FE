// projection-view.component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

interface Period {
  value: string;
  viewValue: string;
}

interface ResourceRow {
  tipoRecurso: string;
  nombreRecurso: string;
  costoPorHora: number;
  cantidadRecursos: number;
  tiempoTotal: number;
  costoRecurso: number;
  porcentajeParticipacion: number;
  [key: string]: any; // For dynamic period columns
}

@Component({
  selector: 'projection-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule
  ],
  templateUrl: './projection-view.component.html',
  styleUrl: './projection-view.component.scss'
})
export class ProjectionViewComponent {
  periods: Period[] = [
    {value: 'meses', viewValue: 'Meses'},
    {value: 'semanas', viewValue: 'Semanas'},
  ];

  selectedPeriod: string = 'meses';
  periodQuantity: number = 6;
  showTable: boolean = false;
  dynamicColumns: string[] = [];
  displayedColumns: string[] = [];

  dataSource: ResourceRow[] = [
    this.createEmptyRow()
  ];

  totalTiempo: number = 0;
  totalCosto: number = 0;

  applyConfiguration() {
    if (!this.periodQuantity || this.periodQuantity < 1) {
      return;
    }

    // Generate dynamic columns
    this.dynamicColumns = [];
    for (let i = 1; i <= this.periodQuantity; i++) {
      this.dynamicColumns.push(`periodo${i}`);
    }

    // Set displayed columns
    this.displayedColumns = [
      'tipoRecurso',
      'nombreRecurso',
      'costoPorHora',
      'cantidadRecursos',
      ...this.dynamicColumns,
      'tiempoTotal',
      'costoRecurso',
      'porcentajeParticipacion',
      'acciones'
    ];

    // Initialize dynamic columns in existing rows
    this.dataSource.forEach(row => {
      this.dynamicColumns.forEach(col => {
        if (!row[col]) {
          row[col] = 0;
        }
      });
    });

    this.showTable = true;
    this.calculateTotals();
  }

  getColumnHeader(index: number): string {
    const prefix = this.selectedPeriod === 'meses' ? 'Mes' : 'Semana';
    return `${prefix} ${index + 1}`;
  }

  createEmptyRow(): ResourceRow {
    const row: ResourceRow = {
      tipoRecurso: '',
      nombreRecurso: '',
      costoPorHora: 0,
      cantidadRecursos: 1,
      tiempoTotal: 0,
      costoRecurso: 0,
      porcentajeParticipacion: 0
    };

    // Initialize dynamic columns
    this.dynamicColumns.forEach(col => {
      row[col] = 0;
    });

    return row;
  }

  addRow() {
    this.dataSource.push(this.createEmptyRow());
    this.dataSource = [...this.dataSource]; // Refresh data source
  }

  removeRow(index: number) {
    if (this.dataSource.length > 1) {
      this.dataSource.splice(index, 1);
      this.dataSource = [...this.dataSource]; // Refresh data source
      this.calculateTotals();
    }
  }

  onResourceTypeChange(index: number) {
    // You can add specific logic when resource type changes
    this.calculateTotals();
  }

  calculateTotals() {
    let totalTiempo = 0;
    let totalCosto = 0;

    // Calculate row totals
    this.dataSource.forEach(row => {
      // Sum hours from dynamic columns
      let tiempoRow = 0;
      this.dynamicColumns.forEach(col => {
        tiempoRow += Number(row[col]) || 0;
      });

      row.tiempoTotal = tiempoRow;
      row.costoRecurso = tiempoRow * (row.costoPorHora || 0) * (row.cantidadRecursos || 1);

      totalTiempo += row.tiempoTotal;
      totalCosto += row.costoRecurso;
    });

    // Calculate percentages
    this.dataSource.forEach(row => {
      row.porcentajeParticipacion = totalTiempo > 0 ? (row.tiempoTotal / totalTiempo) * 100 : 0;
    });

    this.totalTiempo = totalTiempo;
    this.totalCosto = totalCosto;
  }
}
