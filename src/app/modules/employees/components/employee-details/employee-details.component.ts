import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
import { CommonModule, DatePipe } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'employee-details',
  standalone: true,
  templateUrl: './employee-details.component.html',
  styleUrls: ['./employee-details.component.scss'],
  providers: [DatePipe],
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ]
})
export class EmployeeDetailsComponent implements OnInit {
  employee: any;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private employeeService: EmployeeService,
    private datePipe: DatePipe,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadEmployeeDetails(+id);
    }
  }

  loadEmployeeDetails(id: number): void {
    this.isLoading = true;

    this.employeeService.getEmployeeId(id).subscribe({
      next: (response) => {
        console.log('Respuesta recibida:', response);

        // Maneja tanto la respuesta directa como la estructura {data: {}}
        this.employee = response.data || response;

        if (!this.employee) {
          console.error('La respuesta no contiene datos válidos');
          this.snackBar.open('Datos del empleado no disponibles', 'Cerrar', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar empleado:', err);
        this.snackBar.open('Error al cargar datos del empleado', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
      }
    });
  }

  formatDate(date: string): string {
    return this.datePipe.transform(date, 'dd/MM/yyyy') || '';
  }

  goBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }
}
