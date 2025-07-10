import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog'; // Assuming you use Angular Material for dialogs
import { AuthService } from '../../services/auth.service'; // Adjust path to your auth service// Create this component
import { MessageDialogComponent } from '../message-dialog/message-dialog.component';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-recovery-password',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatDialogModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MessageDialogComponent,
    ReactiveFormsModule
  ],
  templateUrl: './recovery-password.component.html',
  styleUrl: './recovery-password.component.scss'
})
export class RecoveryPasswordComponent implements OnInit {
  forgotPasswordForm!: FormGroup;
  isLoading: boolean = false;
  mensajeError: string = '';
  mostrarError: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.forgotPasswordForm = this.fb.group({
      username: ['', [Validators.required, Validators.email]] // Example: @empresa.com for corporate email
    });
  }

  async sendRecoveryRequest(): Promise<void> {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.mostrarError = false;
    this.mensajeError = '';

    const username = this.forgotPasswordForm.get('username')?.value;

    try {
      await this.authService.requestPasswordRecovery(username).toPromise(); // Assuming authService has this method
      this.openGenericMessageDialog();
    } catch (error: any) {
      this.mensajeError = error.message || 'Ocurrió un error al procesar tu solicitud.';
      this.mostrarError = true;
    } finally {
      this.isLoading = false;
    }
  }

  openGenericMessageDialog(): void {
    this.dialog.open(MessageDialogComponent, {
      width: '600px',
      data: {
        title: 'Solicitud Enviada',
        message: 'Si tu correo está registrado, recibirás un enlace de recuperación en breve.'
      }
    });
  }
}
