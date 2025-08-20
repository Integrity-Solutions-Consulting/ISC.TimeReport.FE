import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // Reemplazamos MatDialog con MatSnackBar
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-recovery-password',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    ReactiveFormsModule
  ],
  templateUrl: './recovery-password.component.html',
  styleUrl: './recovery-password.component.scss'
})
export class RecoveryPasswordComponent implements OnInit {
  forgotPasswordForm!: FormGroup;
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar, // Inyectamos el servicio SnackBar
    private router: Router
  ) {}

  ngOnInit(): void {
    this.forgotPasswordForm = this.fb.group({
      username: ['', [Validators.required, Validators.email]]
    });
  }

  async sendRecoveryRequest(): Promise<void> {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const username = this.forgotPasswordForm.get('username')?.value;

    try {
      await this.authService.requestPasswordRecovery(username).toPromise();

      // Mostrar mensaje de éxito con SnackBar
      this.showSnackBar('Si tu correo está registrado, recibirás un enlace de recuperación en breve.', 'success');

      // Opcional: redirigir después de un tiempo
      setTimeout(() => {
        this.router.navigate(['/auth/login']);
      }, 3000);

    } catch (error: any) {
      // Mostrar mensaje de error con SnackBar
      const errorMessage = error.message || 'Ocurrió un error al procesar tu solicitud.';
      this.showSnackBar(errorMessage, 'error');
    } finally {
      this.isLoading = false;
    }
  }

  // Método para mostrar el SnackBar con diferentes estilos según el tipo
  private showSnackBar(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000, // Duración de 5 segundos
      panelClass: [`snackbar-${type}`], // Clase CSS personalizada según el tipo
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }
}
