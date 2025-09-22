import { Component, OnInit, ViewChild } from '@angular/core';
import { MatFormField, MatFormFieldModule, MatLabel } from "@angular/material/form-field";
import { MatIcon, MatIconModule } from "@angular/material/icon";
import { Holiday } from '../../interfaces/holiday.interface';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { HolidaysService } from '../../services/holidays.service';
import { MatProgressSpinner, MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'holidays-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './holidays-list.component.html',
  styleUrl: './holidays-list.component.scss'
})
export class HolidaysListComponent implements OnInit {
  displayedColumns: string[] = ['holidayType', 'holidayName', 'holidayDate', 'actions'];
  dataSource = new MatTableDataSource<Holiday>();
  isLoading = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private holidayService: HolidaysService) {}

  ngOnInit() {
    this.loadHolidays();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadHolidays() {
    this.isLoading = true;
    this.holidayService.getAllHolidays().subscribe({
      next: (response) => {
        // Mapear las fechas string a objetos Date
        const holidays = response.data.map((holiday: any) => ({
          ...holiday,
          holidayDate: new Date(holiday.holidayDate)
        }));

        this.dataSource.data = holidays;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar los feriados:', error);
        this.isLoading = false;
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}
