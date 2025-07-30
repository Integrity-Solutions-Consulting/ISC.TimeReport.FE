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

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule
  ],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss'
})
export class ChangePasswordComponent implements OnInit{

  passwordChangeForm!: FormGroup;
  private urlBase: string = environment.URL_BASE;

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
      return { 'mismatch': true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.passwordChangeForm.valid) {
      const { oldPassword, newPassword, confirmPassword } = this.passwordChangeForm.value;
      const token = localStorage.getItem('token'); // Asume que el token se guarda en localStorage tras el login

      if (!token) {
        this.snackBar.open('No hay sesión activa. Por favor, inicie sesión.', 'Cerrar', { duration: 3000 });
        this.authService.logout();
        this.router.navigate(['/auth/login']); // Redirigir al login si no hay token
        return;
      }

      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      const body = { oldPassword, newPassword, confirmPassword };

      this.http.put(`${this.urlBase}/api/users/ChangePassword`, body, { headers }).subscribe({
        next: (response: any) => {
          this.snackBar.open('Contraseña cambiada exitosamente!', 'Cerrar', {
            duration: 3000,
          });
          this.passwordChangeForm.reset(); // Limpiar el formulario
          this.router.navigate(['auth/login']); // O a donde desees redirigir después del cambio
        },
        error: (error) => {
          console.error('Error al cambiar la contraseña:', error);
          let errorMessage = 'Hubo un error al cambiar la contraseña.';
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          }
          this.snackBar.open(errorMessage, 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          if (error.status === 401 || error.status === 403) {
            this.authService.logout();
            this.router.navigate(['/auth/login']);
          }
        }
      });
    }
  }
}
