import { MatMenuModule } from '@angular/material/menu';
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
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CreateDialogComponent } from '../create-dialog/create-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';

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
    MatMenuModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    ReactiveFormsModule
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

  searchControl = new FormControl('');

  constructor(
    private holidayService: HolidaysService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute
  ) {}

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
        // Corregir el manejo de fechas para evitar problemas de zona horaria
        const holidays = response.data.map((holiday: any) => ({
          ...holiday,
          // Crear la fecha correctamente para evitar desfases
          holidayDate: this.createLocalDate(holiday.holidayDate)
        }));

        this.dataSource.data = holidays;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar los feriados:', error);
        this.isLoading = false;
        this.showSnackBar('Error al cargar los feriados', 'error');
      }
    });
  }

  // Método para crear fechas locales sin problemas de zona horaria
  private createLocalDate(dateString: string): Date {
    if (!dateString) return new Date();

    // Dividir la fecha YYYY-MM-DD
    const [year, month, day] = dateString.split('-').map(Number);

    // Crear fecha en zona horaria local
    return new Date(year, month - 1, day);
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openAddHolidayDialog(): void {
    const dialogRef = this.dialog.open(CreateDialogComponent, {
      width: '500px',
      data: {} // Datos vacíos para crear nuevo
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createHoliday(result);
      }
    });
  }

  openEditHolidayDialog(holiday: Holiday): void {
    const dialogRef = this.dialog.open(CreateDialogComponent, {
      width: '500px',
      data: {
        holiday: holiday,
        isEdit: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (result.isEdit) {
          this.updateHoliday(result.holidayId, result.holidayData);
        } else {
          this.createHoliday(result.holidayData);
        }
      }
    });
  }

  onViewHoliday(holidayId: number): void {
    this.router.navigate([holidayId], {relativeTo: this.route});
  }

  onToggleStatus(holiday: Holiday): void {
    const action = holiday.status ? 'inactivar' : 'activar';
    const actionText = holiday.status ? 'Inactivar' : 'Activar';

    if (confirm(`¿Está seguro de ${action} el feriado "${holiday.holidayName}"?`)) {
      this.isLoading = true;

      const serviceCall = holiday.status
        ? this.holidayService.inactivateHoliday(holiday.id.toString())
        : this.holidayService.activateHoliday(holiday.id.toString());

      serviceCall.subscribe({
        next: (response) => {
          this.showSnackBar(`Feriado ${action}do correctamente`, 'success');
          this.loadHolidays(); // Recargar la lista
        },
        error: (error) => {
          console.error(`Error al ${action} el feriado:`, error);
          this.showSnackBar(`Error al ${action} el feriado`, 'error');
          this.isLoading = false;
        }
      });
    }
  }

  onDeleteHoliday(holiday: Holiday): void {
    // Si quieres mantener la funcionalidad de eliminar, puedes implementarla aquí
    // o reemplazarla por la de inactivar
    this.showSnackBar('Use la opción "Inactivar" para deshabilitar el feriado', 'info');
  }

  createHoliday(holidayData: any): void {
    this.holidayService.createHoliday(holidayData).subscribe({
      next: (response) => {
        console.log('Feriado creado exitosamente:', response);
        this.loadHolidays(); // Recargar la lista
      },
      error: (error) => {
        console.error('Error al crear el feriado:', error);
        // Aquí puedes agregar notificaciones o manejo de errores
      }
    });
  }

  updateHoliday(holidayId: string, holidayData: any): void {
    this.holidayService.updateHoliday(holidayId, holidayData).subscribe({
      next: (response) => {
        console.log('Feriado actualizado exitosamente:', response);
        this.loadHolidays();
        this.showSnackBar('Feriado actualizado exitosamente', 'success');
      },
      error: (error) => {
        console.error('Error al actualizar el feriado:', error);
        this.showSnackBar('Error al actualizar el feriado', 'error');
      }
    });
  }

  onEditHoliday(holiday: Holiday): void {
    this.openEditHolidayDialog(holiday);
  }

  private showSnackBar(message: string, type: 'success' | 'error' | 'info'): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: [`snackbar-${type}`]
    });
  }
}
