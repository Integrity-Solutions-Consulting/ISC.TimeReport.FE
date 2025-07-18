import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { EmployeeService } from '../../../employees/services/employee.service';
import { ClientService } from '../../../clients/services/client.service';
import { debounceTime, distinctUntilChanged, Subject, switchMap, catchError, of, EMPTY } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProjectService } from '../../../projects/services/project.service';
import { HttpParams } from '@angular/common/http';
import { ApiResponse } from '../../../projects/interfaces/project.interface';

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
    MatProgressSpinnerModule
  ],
  templateUrl: './report-dialog.component.html',
  styleUrl: './report-dialog.component.scss'
})
export class ReportDialogComponent implements OnInit {
  payloadForm!: FormGroup;
  employees: any[] = [];
  clients: any[] = [];
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
    this.setupEmployeeSearch();
    this.setupClientSearch();
    this.loadInitialEmployees();
    this.loadInitialClients();

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
            return of({ items: [], totalItems: 0 });
          })
        );
      })
    ).subscribe(response => {
      this.employees = response.items;
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
            return of({ items: [], totalItems: 0 });
          })
        );
      })
    ).subscribe(response => {
      this.clients = response.items;
      this.hasMoreClients = response.totalItems > this.pageSize;
      this.loadingClients = false;
    });
  }

  loadInitialEmployees(): void {
    this.loadingEmployees = true;
    this.employeeService.getEmployees(this.employeePage, this.pageSize).subscribe(
      response => {
        this.employees = response.items;
        this.hasMoreEmployees = response.totalItems > this.employees.length;
        this.loadingEmployees = false;
      },
      error => {
        console.error('Error loading employees', error);
        this.loadingEmployees = false;
      }
    );
  }

  loadInitialClients(): void {
    this.loadingClients = true;
    this.clientService.getClients(this.clientPage, this.pageSize).subscribe(
      response => {
        this.clients = response.items;
        this.hasMoreClients = response.totalItems > this.clients.length;
        this.loadingClients = false;
      },
      error => {
        console.error('Error loading clients', error);
        this.loadingClients = false;
      }
    );
  }

  loadMoreEmployees(): void {
    if (!this.hasMoreEmployees || this.loadingEmployees) return;

    this.employeePage++;
    this.loadingEmployees = true;

    const search = this.payloadForm.get('employeeName')?.value || '';

    this.employeeService.getEmployees(this.employeePage, this.pageSize, search).subscribe(
      response => {
        this.employees = [...this.employees, ...response.items];
        this.hasMoreEmployees = response.totalItems > this.employees.length;
        this.loadingEmployees = false;
      },
      error => {
        console.error('Error loading more employees', error);
        this.loadingEmployees = false;
      }
    );
  }

  loadMoreClients(): void {
    if (!this.hasMoreClients || this.loadingClients) return;

    this.clientPage++;
    this.loadingClients = true;

    const search = this.payloadForm.get('clientName')?.value || '';

    this.clientService.getClients(this.clientPage, this.pageSize, search).subscribe(
      response => {
        this.clients = [...this.clients, ...response.items];
        this.hasMoreClients = response.totalItems > this.clients.length;
        this.loadingClients = false;
      },
      error => {
        console.error('Error loading more clients', error);
        this.loadingClients = false;
      }
    );
  }

  handleEmployeeInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.onEmployeeSearchChange(inputElement.value);
  }

  handleClientInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.onClientSearchChange(inputElement.value);
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
      employeeName: `${employee.firstName} ${employee.lastName}`
    });
    this.clearClientSelection();
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

    if (clientId) {
      this.generateExcelReport(employeeId, clientId, year, month, fullMonth);
    } else {
      this.findClientAndGenerateReport(employeeId, year, month, fullMonth);
    }
  }

  private findClientAndGenerateReport(employeeId: number, year: number, month: number, fullMonth: boolean): void {
    this.projectService.getProjectsForTables(1, 100).pipe(
      switchMap((response: ApiResponse) => {
        const employeeProjects = response.items.filter(project =>
          project.assignedEmployees?.includes(employeeId)
        );

        if (employeeProjects.length === 0) {
          this.generatingReport = false;
          this.snackBar.open('El empleado no tiene proyectos asignados', 'Cerrar', {
            duration: 5000
          });
          return EMPTY; // Usamos EMPTY en lugar of(null) para completar el observable sin emitir valores
        }

        const clientId = employeeProjects[0].clientID;
        const params = new HttpParams()
          .set('employeeId', employeeId.toString())
          .set('clientId', clientId.toString())
          .set('year', year.toString())
          .set('month', month.toString())
          .set('fullMonth', fullMonth.toString());

        return this.projectService.downloadExcelReport(params);
      }),
      catchError(error => {
        this.generatingReport = false;
        this.snackBar.open(error.message || 'Error al generar el reporte', 'Cerrar', {
          duration: 5000
        });
        return EMPTY;
      })
    ).subscribe({
      next: (blob: Blob) => {
        this.downloadFile(blob, `Reporte_${year}-${month}.xlsx`);
        this.generatingReport = false;
      },
      error: () => {
        this.generatingReport = false;
      }
    });
  }

  private generateExcelReport(
    employeeId: number,
    clientId: number,
    year: number,
    month: number,
    fullMonth: boolean
  ): void {
    const params = new HttpParams()
      .set('employeeId', employeeId.toString())
      .set('clientId', clientId.toString())
      .set('year', year.toString())
      .set('month', month.toString())
      .set('fullMonth', fullMonth.toString());

    this.projectService.downloadExcelReport(params).subscribe({
      next: (blob) => {
        this.generatingReport = false;
        this.downloadFile(blob, `Reporte_${year}-${month}.xlsx`);
        this.dialogRef.close();
      },
      error: (error) => {
        this.generatingReport = false;
        this.snackBar.open('Error al generar el reporte', 'Cerrar', {
          duration: 5000
        });
      }
    });
  }

  private downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
