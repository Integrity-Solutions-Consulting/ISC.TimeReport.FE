import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { EmployeeService } from '../../../employees/services/employee.service';
import { ClientService } from '../../../clients/services/client.service';
import { debounceTime, distinctUntilChanged, Subject, switchMap, catchError, of, EMPTY, forkJoin, finalize } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProjectService } from '../../../projects/services/project.service';
import { HttpParams } from '@angular/common/http';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ActivityService } from '../../services/activity.service';

@Component({
  selector: 'app-report-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule
  ],
  templateUrl: './report-dialog.component.html',
  styleUrls: ['./report-dialog.component.scss']
})
export class ReportDialogComponent implements OnInit {
  payloadForm!: FormGroup;
  employees: any[] = [];
  clients: any[] = [];
  filteredClients: any[] = [];
  filteredEmployees: any[] = [];

  years: number[] = [];
  months = [
    { value: 1, name: 'Enero' },
    { value: 2, name: 'Febrero' },
    { value: 3, name: 'Marzo' },
    { value: 4, name: 'Abril' },
    { value: 5, name: 'Mayo' },
    { value: 6, name: 'Junio' },
    { value: 7, name: 'Julio' },
    { value: 8, name: 'Agosto' },
    { value: 9, name: 'Septiembre' },
    { value: 10, name: 'Octubre' },
    { value: 11, name: 'Noviembre' },
    { value: 12, name: 'Diciembre' }
  ];

  employeeSearch$ = new Subject<string>();
  clientSearch$ = new Subject<string>();
  loadingEmployees = false;
  loadingClients = false;
  generatingReport = false;

  employeePage = 1;
  clientPage = 1;
  pageSize = 10;
  hasMoreEmployees = true;
  hasMoreClients = true;

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private clientService: ClientService,
    private projectService: ProjectService,
    private dailyActivityService: ActivityService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ReportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    // Inicializar años (desde 2020 hasta 2030)
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 3; year <= currentYear + 3; year++) {
      this.years.push(year);
    }
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadEmployees();

    if (this.data.start) {
      const selectedDate = new Date(this.data.start);
      this.payloadForm.patchValue({
        year: selectedDate.getFullYear(),
        month: selectedDate.getMonth() + 1
      });
    }
  }

  initializeForm(): void {
    this.payloadForm = this.fb.group({
      employeeName: [''],
      employeeID: ['', Validators.required],
      clientName: [''],
      clientID: [''],
      year: [new Date().getFullYear(), Validators.required],
      month: [new Date().getMonth() + 1, Validators.required],
      isFullMonth: [false]
    });

    // Cuando cambia el empleado, cargar sus clientes asociados
    this.payloadForm.get('employeeID')?.valueChanges.subscribe(employeeId => {
      if (employeeId) {
        this.loadClientsForEmployee(employeeId);
      } else {
        this.clearClientSelection();
      }
    });
  }

  loadEmployees(): void {
    this.loadingEmployees = true;
    this.employeeService.getEmployees(1, 100).pipe(
      finalize(() => this.loadingEmployees = false)
    ).subscribe({
      next: (response) => {
        // La API devuelve los items directamente, no dentro de data
        this.employees = response.items || [];
        console.log('Empleados cargados:', this.employees);
      },
      error: (error) => {
        console.error('Error al cargar empleados:', error);
        this.snackBar.open('Error al cargar empleados', 'Cerrar', {
          duration: 3000
        });
      }
    });
  }

  onEmployeeSelected(employeeId: number): void {
    this.loadClientsForEmployee(employeeId);
  }

  setupEmployeeSearch(): void {
    this.employeeSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(search => {
        this.loadingEmployees = true;
        return this.employeeService.getEmployees(1, this.pageSize, search).pipe(
          catchError(() => {
            this.loadingEmployees = false;
            return of({ items: [], totalItems: 0  });
          })
        );
      })
    ).subscribe(response => {
      this.employees = response.items;
      this.filteredEmployees = this.employees;
      this.hasMoreEmployees = response.totalItems > this.pageSize;
      this.loadingEmployees = false;
    });
  }

  setupClientSearch(): void {
    this.clientSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(search => {
        this.loadingClients = true;
        return this.clientService.getClients(1, this.pageSize, search).pipe(
          catchError(() => {
            this.loadingClients = false;
            return of({ items: [], totalItems: 0 } );
          })
        );
      })
    ).subscribe(response => {
      this.clients = response.items;
      this.filteredClients = this.clients;
      this.hasMoreClients = response.totalItems > this.pageSize;
      this.loadingClients = false;
    });
  }

  loadInitialEmployees(): void {
    this.loadingEmployees = true;
    this.employeeService.getEmployees(this.employeePage, this.pageSize).subscribe(
      response => {
        this.employees = response.items;
        this.filteredEmployees = this.employees;
        this.hasMoreEmployees = response.totalItems > this.employees.length;
        this.loadingEmployees = false;
      },
      error => {
        console.error('Error loading employees', error);
        this.loadingEmployees = false;
      }
    );
  }

  loadClientsForEmployee(employeeId: number): void {
    this.loadingClients = true;
    this.clients = [];
    this.payloadForm.get('clientID')?.reset();

    this.dailyActivityService.getActivities().pipe(
      switchMap((activitiesResponse: any) => {
        // La API devuelve los datos directamente en data (sin items)
        const activities = activitiesResponse.data || [];
        const employeeActivities = activities.filter(
          (activity: any) => activity.employeeID === employeeId
        );

        if (employeeActivities.length === 0) {
          return of([]);
        }

        const projectIds = [...new Set(employeeActivities.map((a: any) => a.projectID))];
        return this.projectService.getProjects().pipe(
          switchMap((projectsResponse: any) => {
            // Ajuste para la estructura de proyectos
            const projects = projectsResponse.items || [];
            const filteredProjects = projects.filter(
              (p: any) => projectIds.includes(p.id)
            );
            const clientIds = [...new Set(filteredProjects.map((p: any) => p.clientID))];

            if (clientIds.length === 0) {
              return of([]);
            }

            return this.clientService.getClients(1, 100).pipe(
              switchMap((clientsResponse: any) => {
                // Ajuste para la estructura de clientes
                const clients = clientsResponse.items || [];
                return of(clients.filter(
                  (c: any) => clientIds.includes(c.id))
                );
              })
            );
          })
        );
      }),
      catchError(error => {
        console.error('Error loading client data:', error);
        return of([]);
      })
    ).subscribe({
      next: (clients: any[]) => {
        this.clients = clients;
        this.loadingClients = false;

        if (clients.length === 0) {
          this.snackBar.open('El empleado no tiene clientes asociados', 'Cerrar', {
            duration: 3000
          });
        }
      },
      error: () => {
        this.loadingClients = false;
      }
    });
  }

  handleEmployeeInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const searchValue = inputElement.value.toLowerCase();
    this.filteredEmployees = this.employees.filter(employee =>
      `${employee.person.firstName} ${employee.person.lastName}`.toLowerCase().includes(searchValue) ||
      employee.employeeCode.toLowerCase().includes(searchValue)
    );

    if (searchValue) {
      this.onEmployeeSearchChange(searchValue);
    }
  }

  handleClientInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const searchValue = inputElement.value.toLowerCase();
    this.filteredClients = this.clients.filter(client =>
      (client.tradeName || client.legalName).toLowerCase().includes(searchValue)
    );

    if (searchValue) {
      this.onClientSearchChange(searchValue);
    }
  }

  onEmployeeSearchChange(search: string): void {
    this.employeePage = 1;
    this.employeeSearch$.next(search);
  }

  onClientSearchChange(search: string): void {
    this.clientPage = 1;
    this.clientSearch$.next(search);
  }

  selectEmployee(employee: any): void {
    this.payloadForm.patchValue({
      employeeID: employee.id,
      employeeName: `${employee.person.firstName} ${employee.person.lastName}`
    });
  }

  selectClient(client: any): void {
    this.payloadForm.patchValue({
      clientID: client.id,
      clientName: client.tradeName || client.legalName
    });
  }

  clearClientSelection(): void {
    this.payloadForm.patchValue({
      clientID: '',
      clientName: ''
    });
    this.clients = [];
    this.filteredClients = [];
  }

  onSubmit(): void {
    if (this.payloadForm.invalid) {
      this.snackBar.open('Por favor complete todos los campos requeridos', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    this.generatingReport = true;
    const formValue = this.payloadForm.value;
    const employeeId = formValue.employeeID;
    const clientId = formValue.clientID;
    const year = formValue.year;
    const month = formValue.month;
    const fullMonth = formValue.isFullMonth;

    // Construir el payload para el reporte
    const payload = {
      employeeId,
      clientId,
      year,
      month,
      isFullMonth: fullMonth
    };

    // Aquí llamarías al servicio que genera el reporte
    this.generateReport(payload);
  }

  private generateReport(payload: {
    employeeId: number,
    clientId: number,
    year: number,
    month: number,
    isFullMonth: boolean
  }): void {
    this.generatingReport = true;

    // Configura los parámetros para la API
    const params = new HttpParams()
      .set('employeeId', payload.employeeId.toString())
      .set('clientId', payload.clientId?.toString() || '') // clientId es opcional
      .set('year', payload.year.toString())
      .set('month', payload.month.toString())
      .set('fullMonth', payload.isFullMonth.toString());

    // Llama al servicio de reportes
    this.dailyActivityService.exportExcel(params).subscribe({
      next: (blob: Blob) => {
        this.downloadExcelFile(blob, payload);
        this.generatingReport = false;
        this.dialogRef.close();
      },
      error: (error) => {
        console.error('Error al generar reporte:', error);
        this.generatingReport = false;
        this.snackBar.open('Error al generar el reporte Excel', 'Cerrar', {
          duration: 5000
        });
      }
    });
  }

  private downloadExcelFile(blob: Blob, payload: any): void {
    // Crea un nombre de archivo descriptivo
    const fileName = `Reporte_${payload.employeeId}_${payload.year}_${payload.month}.xlsm`;

    // Crea un enlace temporal y simula el click
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();

    // Limpieza
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
