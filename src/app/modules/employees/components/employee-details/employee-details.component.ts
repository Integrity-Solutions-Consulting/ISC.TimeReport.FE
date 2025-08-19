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
import { PersonService } from '../../services/person.service';

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
  identificationTypes: { id: number, name: string }[] = [];
  genders: { id: number, name: string }[] = [];
  nationalities: { id: number, name: string }[] = [];
  positions: { id: number, name: string }[] = [];
  departments: { id: number, name: string }[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private employeeService: EmployeeService,
    private personService: PersonService,
    private datePipe: DatePipe,
    private snackBar: MatSnackBar,

  ) { }

  ngOnInit(): void {
    this.loadCatalogs();
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

  loadCatalogs(): void {
    this.employeeService.getAllCatalogs().subscribe({
      next: (data) => {
        this.identificationTypes = data.identificationTypes;
        this.genders = data.genders;
        this.nationalities = data.nationalities;
        this.positions = data.positions;
        this.departments = data.departments;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los catálogos';
        this.isLoading = false;
        console.error('Error loading catalogs:', err);
      }
    });
  }

  formatDate(date: string): string {
    return this.datePipe.transform(date, 'dd/MM/yyyy') || '';
  }

  getGenderName(genderId: number): string {
    const gender = this.genders.find(g => g.id === genderId);
    return gender ? gender.name : 'Desconocido';
  }

  getNationalityName(nationalityId: number): string {
    const nationality = this.nationalities.find(n => n.id === nationalityId);
    return nationality ? nationality.name : 'Desconocido';
  }

  getPositionName(positionId: number): string {
    const position = this.positions.find(p => p.id === positionId);
    return position ? position.name : 'Desconocido';
  }

  getDepartmentName(departmentId: number): string {
    const department = this.departments.find(d => d.id === departmentId);
    return department ? department.name : 'Desconocido';
  }

  goBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }
}
