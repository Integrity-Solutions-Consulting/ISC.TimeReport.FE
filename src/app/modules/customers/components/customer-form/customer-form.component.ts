import { Component, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { merge } from 'rxjs';

@Component({
  selector: 'customer-form',
  standalone: true,
  templateUrl: './customer-form.component.html',
  styleUrl: './customer-form.component.scss',
  imports: [
    ReactiveFormsModule,
    CommonModule
  ]
})
export class CustomerFormComponent {
  customerForm: FormGroup;
  identificationTypes = [
    { id: 1, name: 'Cédula' },
    { id: 2, name: 'RUC' },
    { id: 3, name: 'Pasaporte' }
  ];

  constructor(private fb: FormBuilder) {
    this.customerForm = this.fb.group({
      identificationType: ['', Validators.required],
      identificationNumber: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
      commercialName: ['', Validators.required],
      businessName: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]],
      email: ['', [Validators.required, Validators.email]]
    });

    // Podemos agregar validaciones condicionales según el tipo de identificación
    this.customerForm.get('identificationType')?.valueChanges.subscribe(value => {
      const identificationNumberControl = this.customerForm.get('identificationNumber');

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
    });
  }

  onSubmit() {
    if (this.customerForm.valid) {
      console.log('Formulario enviado:', this.customerForm.value);
      // Aquí puedes enviar los datos a tu API
    } else {
      this.customerForm.markAllAsTouched();
    }
  }

  getIdentificationNumberErrorMessage(): string {
  const identificationType = this.customerForm.get('identificationType')?.value;

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
