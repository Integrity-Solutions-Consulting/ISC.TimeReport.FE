import { CommonModule } from '@angular/common';
import { Component, inject, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Employee } from '../../interfaces/employee.interface';
import { EmployeeService } from '../../services/employee.service';
import { SelectionModel } from '@angular/cdk/collections';

@Component({
  selector: 'employee-list',
  standalone: true,
  imports: [
    MatCardModule,
    MatTableModule,
    MatProgressSpinnerModule,
    CommonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSortModule,
    MatPaginatorModule
  ],
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.scss'
})
export class EmployeeListComponent {

  private employeeService = inject(EmployeeService);

  employees: Employee[] = [];

  displayedColumns: string[] = ['select', 'idtype', 'idnumber', 'firstname', 'lastname', 'email', 'position', 'options'];

  selection = new SelectionModel<any>(true, []);

  dataSource: MatTableDataSource<Employee> = new MatTableDataSource<Employee>();

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  readonly identificationTypesMap: {[key: number]: string} = {
    1: 'Cédula',
    2: 'RUC',
    3: 'Pasaporte',
  };

  readonly positionsMap: {[key: number]: string} = {
    1: '	Gerente General',
    2: '	Asistente General',
    3: '	Jefa Administrativa',
    4: '	Asistente Administrativa',
    5: '	Asistente Contable',
    6: '	Pasante Contable',
    7: '	Coordinadora de Talento Humano',
    8: '	Asistente de Talento Humano',
    9: '	Gerente de Proyecto y Producto',
    10: '	Líder Software',
    11: '	Tester QA',
    12: '	Desarrollador Fullstack',
    13: '	Desarrollador Fullstack/Senior',
    14: '	Desarrollador Fullstack/Semi Senior',
    15: '	Desarrollador Cobol',
    16: '	Arquitectura',
    17: '	Analista QA',
    18: '	Ingeniero de Soluciones',
    19: '	Ingeniero de Procesos',
    20: '	Asistente Administrativo',
    21: '	Ingeniero de Seguridad de la Información',
    22: '	Ingeniero DBA',
    23: '	Arquitecto de Cyber Seguridad',
    24: '	Analista en Middleware',
    25: '	Desarrollador PHP',
    26: '	Pasante QA',
    27: '	Pasante de DevOps',
    28: '	Pasante de Desarrollo',
    29: '	Pasante DBA',
    30: '	Pasante Contable',
    31: '	Líder de Seguridad e Informática',
    32: '	Ingeniero en Soporte Técnico Semi Senior',
    33: '	Analista de Auditoria y Seguridad e Informática/Junior',
    34: '	Pasante de Soporte Técnico/Auditoria',
    35: '	Ingeniero de Procesos Senior',
    36: '	Ingeniero de Procesos Junior',
    37: '	Gerente Comercial',
    38: '	Asistente de Marketing',
    39: '	Ejecutivo Comercial',
    40: '	Asistente Comercial',
  };

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
      this.employeeService.getEmployees().subscribe({
        next: (response: Employee[]) => {
          this.employees = response;
          this.dataSource.data = this.employees;
        },
        error: (err) => {
          console.error('Error al cargar clientes:', err);
        }
      });
    }

    isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.employees.length;
    return numSelected === numRows;
  }

  toggleAll() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.selection.select(...this.employees);
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  getIdentificationTypeName(idtype: number): string {
    return this.identificationTypesMap[idtype] || 'Desconocido';
  }

  getPositionName(position: number): string {
    return this.positionsMap[position] || 'Desconocido';
  }
}
