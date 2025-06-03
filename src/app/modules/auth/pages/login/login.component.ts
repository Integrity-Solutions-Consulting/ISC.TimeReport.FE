import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../interfaces/auth.interface';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LoadingComponent } from '../../components/login-loading/login-loading.component';
import { AlertaComponent } from '../../components/alerta/alerta.component';

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
      email: ['', [Validators.required]],
      Password: ['', [Validators.required]]
    });
  }

  login(): void {
    if (this.loginForm.invalid) {
      this.mensajeError = 'El Email o la contraseña son Incorrectos.';
      this.mostrarError = true;
      setTimeout(() => this.mostrarError = false, 4000);
      this.loginForm.markAllAsTouched();
      return;
    }

    const credentials: LoginRequest = this.loginForm.value;

    this.authService.login(credentials).subscribe({
      next: (response) => {
        const { token, roles, menus } = response.data;

        localStorage.setItem('token', token);
        localStorage.setItem('roles', JSON.stringify(roles));
        localStorage.setItem('menus', JSON.stringify(menus));

        this.loginForm.reset();
        this.router.navigate(['/menu']);
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
        setTimeout(() => this.mostrarError = false, 4000);
      }
    });
  }
}
