import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../interfaces/auth.interface';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LoadingComponent } from '../../components/login-loading/login-loading.component';
import { AlertaComponent } from '../../components/alerta/alerta.component';

import { jwtDecode } from 'jwt-decode';


@Component({
  selector: 'LoginPage',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    LoadingComponent,
    AlertaComponent
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginPage implements OnInit {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  mensajeError: string = '';
  mostrarError: boolean = false;

  formInvalid = false;
  isLoading = false;

  loginForm!: FormGroup;

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      Password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  login(): void {
    if (this.loginForm.invalid) {
      this.mensajeError = 'El Email o la contraseña son Incorrectos.';
      this.mostrarError = true;
      setTimeout(() => {
        this.mostrarError = false;
      }, 4000);
      this.loginForm.markAllAsTouched();
      return;
    }

    const credentials: LoginRequest = this.loginForm.value;

    this.authService.login(credentials).subscribe({
      next: (response) => {
        const token = response.data.token;
        localStorage.setItem('token', token);

        // ✅ PASO 4: Decodificar token para obtener roles
        const decodedToken: any = jwtDecode(token);
        const roles = decodedToken?.roles || []; // Ajusta el campo según tu backend

        localStorage.setItem('roles', JSON.stringify(roles));

        // ✅ PASO 5: Llamar al backend para obtener los menús del usuario
        this.authService.getMenusByRoles(roles).subscribe({
          next: (menus) => {
            localStorage.setItem('menus', JSON.stringify(menus));
            this.loginForm.reset();
            this.router.navigate(['/menu']);
          },
          error: (err) => {
            this.mensajeError = 'Error al obtener los menús disponibles.';
            this.mostrarError = true;
            setTimeout(() => {
              this.mostrarError = false;
            }, 4000);
          }
        });
      },
      error: (err) => {
        if (err.status === 401) {
          this.mensajeError = 'Usuario o contraseña incorrectos.';
        } else if (err.status === 404) {
          this.mensajeError = 'El usuario no existe.';
        } else {
          this.mensajeError = 'Ocurrió un error inesperado. Intenta de nuevo.';
        }
        this.loginForm.reset();
        this.mostrarError = true;
        setTimeout(() => {
          this.mostrarError = false;
        }, 4000);
      }
    });
  }
}
