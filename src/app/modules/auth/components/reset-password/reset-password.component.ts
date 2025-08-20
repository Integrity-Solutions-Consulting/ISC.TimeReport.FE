import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar'; // Reemplazamos MatDialog con MatSnackBar

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm!: FormGroup;
  token: string | null = null;
  isLoading: boolean = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar // Inyectamos SnackBar en lugar de Dialog
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');

    if (!this.token) {
      this.showSnackBar('Token de recuperación no encontrado. Por favor, solicita un nuevo enlace.', 'error');
      return;
    }

    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordsMatchValidator });
  }

  passwordsMatchValidator(form: FormGroup) {
    const password = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    return password === confirmPassword
      ? null
      : { mismatch: true };
  }

  async resetPassword(): Promise<void> {
    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const { newPassword, confirmPassword } = this.resetPasswordForm.value;

    try {
      await this.authService.resetPassword(this.token!, newPassword, confirmPassword).toPromise();

      // Mostrar mensaje de éxito con SnackBar
      this.showSnackBar('Tu contraseña ha sido restablecida exitosamente. Ahora puedes iniciar sesión.', 'success');

      // Redirigir después de un breve tiempo
      setTimeout(() => {
        this.router.navigate(['/auth/login']);
      }, 3000);

    } catch (error: any) {
      // Mostrar mensaje de error con SnackBar
      const errorMessage = error.error?.message || 'Tu contraseña ha sido restablecida exitosamente. Ahora puedes iniciar sesión.';
      this.showSnackBar(errorMessage, 'error');
    } finally {
      this.isLoading = false;
    }
  }

  // Método para mostrar SnackBar con estilos personalizados
  private showSnackBar(message: string, type: 'success' | 'error' | 'warning'): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 10000,
      panelClass: [`snackbar-${type}`],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }
}
