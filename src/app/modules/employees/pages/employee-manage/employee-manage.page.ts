import { Component, ViewChild } from '@angular/core';
import { EmployeeFormComponent } from '../../components/employee-form/employee-form.component';
import { PersonFormComponent } from '../../../persons/components/person-form/person-form.component';
import { CustomButtonComponent } from '../../../../shared/components/custom-button/custom-button.component';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { EmployeeService } from '../../services/employee.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'employee-manage',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    EmployeeFormComponent,
    PersonFormComponent,
    CustomButtonComponent
  ],
  templateUrl: './employee-manage.page.html',
  styleUrl: './employee-manage.page.scss'
})
export class EmployeeManagePage {
  constructor(private employeeService: EmployeeService) {}

  @ViewChild(PersonFormComponent) personFormComponent!: PersonFormComponent;
  @ViewChild(EmployeeFormComponent) employeeFormComponent!: EmployeeFormComponent;

  onSubmit() {
    if (this.personFormComponent.personForm.valid &&
        this.employeeFormComponent.employeeForm.valid) {

      const employeeData = {
        ...this.personFormComponent.personForm.value,
        ...this.employeeFormComponent.employeeForm.value
      };

      this.saveToLocalStorage(employeeData);

      console.log('Datos a enviar al servicio:', employeeData);

      this.employeeService.createEmployee(employeeData).subscribe({
        next: (response) => {
          console.log('Empleado creado', response);
        },
        error: (error) => {
          console.error('Error al crear empleado', error);
        }
      });
    }
  }

  private saveToLocalStorage(data: any): void {
    // Convertir a string (Local Storage solo guarda strings)
    const dataString = JSON.stringify(data);

    // Guardar bajo una clave específica (ej: 'employeeFormData')
    localStorage.setItem('employeeFormData', dataString);

    console.log('Datos guardados en Local Storage:', data);
  }
}
