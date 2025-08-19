// project-assignments.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { ProjectService } from '../../../projects/services/project.service'; // Ajusta la ruta a tu servicio
import { ProjectDetail, EmployeePersonInfo } from '../../interfaces/assignment.interface'; // Ajusta la ruta a tus interfaces
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';

// Interfaz para la data que se mostrará en la tabla
export interface AssignmentDisplayData {
  projectName: string;
  projectCode: string;
  employeeName: string;
  employeeCode: string;
  identificationNumber: string;
  assignmentStatus: boolean;
}

@Component({
  selector: 'assignments-list',
  standalone: true,
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatTableModule,
    ReactiveFormsModule
  ],
  templateUrl: './assigments-list.component.html',
  styleUrls: ['./assigments-list.component.scss']
})
export class AssigmentsListComponent implements OnInit {
  displayedColumns: string[] = ['projectName', 'projectCode', 'employeeName', 'employeeCode', 'identificationNumber', 'assignmentStatus'];
  dataSource = new MatTableDataSource<AssignmentDisplayData>();

  searchControl = new FormControl('');

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private projectService: ProjectService) { }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }


  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}
