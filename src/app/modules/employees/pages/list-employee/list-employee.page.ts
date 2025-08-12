import { Component } from '@angular/core';
import { EmployeeListComponent } from '../../components/employee-list/employee-list.component';
import { MatCardModule } from '@angular/material/card';
import { LoadingComponent } from '../../../auth/components/login-loading/login-loading.component';
import { Subscription } from 'rxjs';
import { EmployeeService } from '../../services/employee.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-list-employee',
  standalone: true,
  imports: [
    CommonModule,
    EmployeeListComponent,
    MatCardModule,
    LoadingComponent
  ],
  templateUrl: './list-employee.page.html',
  styleUrl: './list-employee.page.scss'
})
export class ListEmployeePage {
  isLoading = false;
  private loadingSubscription: Subscription;

  constructor(private employeeService: EmployeeService) {
    // Suscribirse a los cambios de estado de carga
    this.loadingSubscription = this.employeeService.loadingState$.subscribe(
      (isLoading) => {
        this.isLoading = isLoading;
      }
    );
  }

  ngOnDestroy() {
    // Limpiar la suscripción al destruir el componente
    if (this.loadingSubscription) {
      this.loadingSubscription.unsubscribe();
    }
  }
}
