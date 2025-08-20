import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // Importamos el spinner

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule // Añadimos el spinner
  ],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss'
})
export class ChangePasswordComponent implements OnInit{

  passwordChangeForm!: FormGroup;
  private urlBase: string = environment.URL_BASE;
  isLoading: boolean = false; // Variable para controlar el estado de carga

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.passwordChangeForm = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  // Validador personalizado para confirmar que las contraseñas coinciden
  passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
      return { 'mismatch': true };
    } else {
      if (confirmPassword && confirmPassword.errors && confirmPassword.errors['mismatch']) {
        const errors = { ...confirmPassword.errors };
        delete errors['mismatch'];
        confirmPassword.setErrors(Object.keys(errors).length ? errors : null);
      }
    }
    return null;
  }

  onSubmit(): void {
    if (this.passwordChangeForm.valid) {
      this.isLoading = true; // Activamos el estado de carga

      const { oldPassword, newPassword, confirmPassword } = this.passwordChangeForm.value;
      const token = localStorage.getItem('token');

      if (!token) {
        this.showSnackBar('No hay sesión activa. Por favor, inicie sesión.', 'error');
        this.authService.logout();
        this.router.navigate(['/auth/login']);
        this.isLoading = false;
        return;
      }

      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      const body = { oldPassword, newPassword, confirmPassword };

      this.http.put(`${this.urlBase}/api/users/ChangePassword`, body, { headers }).subscribe({
        next: (response: any) => {
          this.showSnackBar('¡Contraseña cambiada exitosamente!', 'success');
          this.passwordChangeForm.reset();
          this.isLoading = false;

          // Redirigir después de un breve tiempo
          setTimeout(() => {
            this.router.navigate(['/dashboard']); // O a donde desees redirigir
          }, 2000);
        },
        error: (error) => {
          console.error('Error al cambiar la contraseña:', error);
          this.isLoading = false;

          let errorMessage = 'Hubo un error al cambiar la contraseña.';
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          } else if (error.status === 401) {
            errorMessage = 'La contraseña actual es incorrecta.';
          } else if (error.status === 400) {
            errorMessage = 'La nueva contraseña no cumple con los requisitos.';
          }

          this.showSnackBar(errorMessage, 'error');

          if (error.status === 401 || error.status === 403) {
            setTimeout(() => {
              this.authService.logout();
              this.router.navigate(['/auth/login']);
            }, 3000);
          }
        }
      });
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      this.passwordChangeForm.markAllAsTouched();
    }
  }

  // Método para mostrar SnackBar con estilos personalizados
  private showSnackBar(message: string, type: 'success' | 'error' | 'warning'): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: [`snackbar-${type}`],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }
}
