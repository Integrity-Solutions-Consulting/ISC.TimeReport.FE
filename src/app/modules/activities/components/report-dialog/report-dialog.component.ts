import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { EmployeeService } from '../../../employees/services/employee.service';
import { ClientService } from '../../../clients/services/client.service';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

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
    ReactiveFormsModule
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

    // Para manejar búsqueda con debounce
  employeeSearch$ = new Subject<string>();
  clientSearch$ = new Subject<string>();
  loadingEmployees = false;
  loadingClients = false;

  // Paginación
  employeePage = 1;
  clientPage = 1;
  pageSize = 10;
  hasMoreEmployees = true;
  hasMoreClients = true;

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private clientService: ClientService,
    public dialogRef: MatDialogRef<ReportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    // Inicializar años (ejemplo: desde 2020 hasta 2030)
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 2; year <= currentYear + 3; year++) {
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
      employeeID: [''],
      clientID: [''],
      year: [new Date().getFullYear()],
      month: [new Date().getMonth() + 1],
      isFullMonth: [true]
    });
  }

  setupEmployeeSearch(): void {
    this.employeeSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(search => {
        this.loadingEmployees = true;
        return this.employeeService.getEmployees(1, this.pageSize, search);
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
        return this.clientService.getClients(1, this.pageSize, search);
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

  onEmployeeSearchChange(search: string): void {
    this.employeePage = 1;
    this.employeeSearch$.next(search);
  }

  onClientSearchChange(search: string): void {
    this.clientPage = 1;
    this.clientSearch$.next(search);
  }

  handleEmployeeInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.onEmployeeSearchChange(inputElement.value);
  }

  handleClientInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.onEmployeeSearchChange(inputElement.value);
  }

  selectEmployee(employee: any): void {
    this.payloadForm.patchValue({
      employeeID: employee.id,
      employeeName: employee.name // Asumiendo que el objeto employee tiene una propiedad name
    });
  }

  selectClient(client: any): void {
    this.payloadForm.patchValue({
      clientID: client.id,
      clientName: client.name // Asumiendo que el objeto client tiene una propiedad name
    });
  }

  onSubmit(): void {
    if (this.payloadForm.valid) {
      this.dialogRef.close(this.payloadForm.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
