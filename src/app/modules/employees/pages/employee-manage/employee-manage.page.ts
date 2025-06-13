import { Component, ViewChild } from '@angular/core';
import { EmployeeFormComponent } from '../../components/employee-form/employee-form.component';
import { PersonFormComponent } from '../../../persons/components/person-form/person-form.component';
import { CustomButtonComponent } from '../../../../shared/components/custom-button/custom-button.component';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { EmployeeService } from '../../services/employee.service';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'employee-manage',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    EmployeeFormComponent,
    MatSnackBarModule
  ],
  templateUrl: './employee-manage.page.html',
  styleUrl: './employee-manage.page.scss'
})
export class EmployeeManagePage {

  @ViewChild('personForm') personForm!: PersonFormComponent;
  @ViewChild('employeeForm') employeeForm!: EmployeeFormComponent;

  constructor(
    private employeeService: EmployeeService,
    private snackBar: MatSnackBar
  ) {}

  onSubmit(): void {

    console.log('Formulario enviado');

    if (!this.personForm || !this.employeeForm) {
      console.error('Formularios no inicializados');
      return;
    }

    console.log('Estado de validación:');
    console.log('PersonForm válido:', this.personForm.valid);
    console.log('EmployeeForm válido:', this.employeeForm.valid);

    console.log('Datos de PersonForm:', this.personForm.value);
    console.log('Datos de EmployeeForm:', this.employeeForm.value);

    if (this.personForm.valid && this.employeeForm.valid) {
      const formData = {
        ...this.personForm.value,
        ...this.employeeForm.value,
        identificationTypeId: this.personForm.value.identificationType,
        genderID: this.personForm.value.gender,
        nationalityID: this.personForm.value.nationality
      };

      // Eliminar propiedades que no necesita el backend
      delete formData.identificationType;
      delete formData.gender;
      delete formData.nationality;

      console.log('Datos que se enviarán al servicio:', formData);

      console.log(formData)

      this.employeeService.createEmployee(formData).subscribe({
        next: () => {
          this.snackBar.open('Empleado creado con éxito', 'Cerrar', { duration: 3000 });
        },
        error: (err) => {
          console.error('Error:', err);
          this.snackBar.open('Error al crear empleado', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }
}
