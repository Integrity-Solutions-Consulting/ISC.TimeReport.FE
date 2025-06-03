import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CustomButtonComponent } from '../../../../shared/components/custom-button/custom-button.component';
import { Leader, Person } from '../../interfaces/leader.interface';
import { LeadersService } from '../../services/leaders.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Component({
  selector: 'leader-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCardModule,
    MatInputModule,
    CustomButtonComponent,
  ],
  templateUrl: './leader-form.component.html',
  styleUrl: './leader-form.component.scss'
})
export class LeaderFormComponent {

  formGroup: FormGroup;

  identificationNumberErrorMessage = '';

  identificationTypes = [
    { id: '1', name: 'Cédula' },
    { id: '2', name: 'RUC' },
    { id: '3', name: 'Pasaporte' }
  ];

  leaderTypes = [
    { id: '1', name: 'Integrity' },
    { id: '2', name: 'Externo' }
  ];

  genders = [
    { id: 'M', name: 'Masculino' },
    { id: 'F', name: 'Femenino' }
  ];

  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  private leaderService = inject(LeadersService);

  constructor(private fb: FormBuilder,
  ) {
      this.formGroup = this.fb.group({
        identificationType: ['', Validators.required],
        identificationNumber: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
        names: ['', Validators.required],
        surnames: ['', Validators.required],
        gender: [''],
        cellPhoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]],
        position: [''],
        personalEmail: ['', Validators.email],
        corporateEmail: ['', [Validators.required, Validators.email]],
        homeAddress: [''],
        leaderType: ['', Validators.required],
        projectCode: ['', Validators.required],
        customerCode: ['', Validators.required]
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

    onSubmit() {
      console.log(this.formGroup)
      if (this.formGroup.valid) {
        this.isSubmitting.set(true);
        this.errorMessage.set(null);
        this.successMessage.set(null);

        const formData = this.formGroup.value;

        console.log('Formulario enviado:', formData);
        console.log('Datos a enviar:', JSON.stringify(formData, null, 2));

        this.leaderService.createLeader(formData).subscribe({
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

}
