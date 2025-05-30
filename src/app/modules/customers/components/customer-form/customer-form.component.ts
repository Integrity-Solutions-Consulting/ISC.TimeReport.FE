import { Customer } from './../../interfaces/customer.interface';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CustomButtonComponent } from '../../../../shared/components/custom-button/custom-button.component';
import { merge } from 'rxjs';
import { CustomContainerComponent } from '../../../../shared/components/custom-container/custom-container.component';
import { CustomerService } from '../../services/customer.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { CustomInputLabelComponent } from '../../../../shared/components/custom-input-label/custom-input-label.component';

@Component({
  selector: 'customer-form',
  standalone: true,
  templateUrl: './customer-form.component.html',
  styleUrl: './customer-form.component.scss',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    CustomButtonComponent,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatCardModule,
    CustomInputLabelComponent
  ]
})
export class CustomerFormComponent {
  formGroup: FormGroup;

  identificationTypes = [
    { id: '1', name: 'Cédula' },
    { id: '2', name: 'RUC' },
    { id: '3', name: 'Pasaporte' }
  ];

  identificationNumberErrorMessage = '';

  private customerService = inject(CustomerService);

  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  constructor(private fb: FormBuilder) {
    this.formGroup = this.fb.group({
      identificationType: ['', Validators.required],
      identificationNumber: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
      commercialName: ['', Validators.required],
      companyName: ['', Validators.required],
      cellPhoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]],
      email: ['', [Validators.required, Validators.email]]
    });

    console.log(this.fb)
    console.log(this.formGroup)

    this.formGroup.get('identificationType')?.valueChanges.subscribe(value => {
      const identificationNumberControl = this.formGroup.get('identificationNumber');

      if (value === 1) { // Cédula
        identificationNumberControl?.setValidators([
          Validators.required,
          Validators.pattern(/^[0-9]{10}$/)
        ]);
      } else if (value === 2) { // RUC
        identificationNumberControl?.setValidators([
          Validators.required,
          Validators.pattern(/^[0-9]{13}$/)
        ]);
      } else { // Pasaporte
        identificationNumberControl?.setValidators([
          Validators.required,
          Validators.pattern(/^[a-zA-Z0-9]{6,20}$/)
        ]);
      }

      identificationNumberControl?.updateValueAndValidity();
      console.log(this.formGroup)
    });
  }

  onSubmit() {
    console.log(this.formGroup)
    if (this.formGroup.valid) {
      this.isSubmitting.set(true);
      this.errorMessage.set(null);
      this.successMessage.set(null);

      const formData = this.formGroup.value;

      console.log('Formulario enviado:', formData);
      console.log('Datos a enviar:', JSON.stringify(formData, null, 2));

      this.customerService.createCustomer(formData).subscribe({
        next: (response) => {
          this.isSubmitting.set(false);
          this.successMessage.set('Cliente creado exitosamente');
          this.formGroup.reset();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err.message || 'Error al crear cliente');
        }
      });
      } else {
        this.formGroup.markAllAsTouched();
    }
  }

  updateIdentificationNumberErrorMessage() {
    const control = this.formGroup.get('identificationNumber');

    if (control?.hasError('required')) {
      this.identificationNumberErrorMessage = 'Este campo es requerido';
    } else if (control?.hasError('pattern')) {
      this.identificationNumberErrorMessage = this.getIdentificationNumberErrorMessage();
    } else {
      this.identificationNumberErrorMessage = '';
    }
  }

  getIdentificationNumberErrorMessage(): string {
    const identificationType = this.formGroup.get('identificationType')?.value;

    if (!identificationType) return 'Seleccione primero un tipo de identificación';

    switch(identificationType) {
      case 1: // Cédula
        return 'La cédula debe tener 10 dígitos';
      case 2: // RUC
        return 'El RUC debe tener 13 dígitos';
      case 3: // Pasaporte
        return 'El pasaporte debe tener entre 6 y 20 caracteres alfanuméricos';
      default:
        return 'Número de identificación inválido';
    }
  }
}
