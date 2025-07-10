import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm!: FormGroup;
  token: string | null = null;
  isLoading: boolean = false;
  mensajeError: string = '';
  mostrarError: boolean = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');

    if (!this.token) {
      this.mensajeError = 'Token de recuperación no encontrado. Por favor, solicita un nuevo enlace.';
      this.mostrarError = true;
      // Optionally redirect to forgot-password page
      // this.router.navigate(['/forgot-password']);
      return;
    }

    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordsMatchValidator });
  }

  passwordsMatchValidator(form: FormGroup) {
    return form.get('newPassword')?.value === form.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  async resetPassword(): Promise<void> {
    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.mostrarError = false;
    this.mensajeError = '';

    const { newPassword, confirmPassword } = this.resetPasswordForm.value;

    try {
      await this.authService.resetPassword(this.token!, newPassword, confirmPassword).toPromise();
      alert('Tu contraseña ha sido restablecida exitosamente. Ahora puedes iniciar sesión.');
      this.router.navigate(['/login']); // Redirect to login page
    } catch (error: any) {
      this.mensajeError = error.error?.message || 'Error al restablecer la contraseña. El enlace puede haber expirado o ser inválido.';
      this.mostrarError = true;
    } finally {
      this.isLoading = false;
    }
  }

  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
}
