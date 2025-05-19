import { Component, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { merge } from 'rxjs';

@Component({
  selector: 'customer-form',
  standalone: true,
  templateUrl: './customer-form.component.html',
  styleUrl: './customer-form.component.scss',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatLabel,
    MatCardModule,
    MatInputModule,
  ]
})
export class CustomerFormComponent {
  readonly email = new FormControl('', [Validators.required, Validators.email]);

   errorMessage = signal('');

   constructor() {
    merge(this.email.statusChanges, this.email.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updateErrorMessage());
  }

  updateErrorMessage() {
    if (this.email.hasError('required')) {
      this.errorMessage.set('Debes ingresar un valor.');
    } else if (this.email.hasError('email')) {
      this.errorMessage.set('No es un correo válido.');
    } else {
      this.errorMessage.set('');
    }
  }
}
