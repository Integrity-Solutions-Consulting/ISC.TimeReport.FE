import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../interfaces/auth.interface';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'LoginPage',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginPage implements OnInit {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  loginForm!: FormGroup;

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      Username: ['', [Validators.required]],
      Password: ['', [Validators.required]]
    });
  }

  login(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched(); 
      return;
    }

    const credentials: LoginRequest = this.loginForm.value;

    this.authService.login(credentials).subscribe({
      next: (response) => {
        localStorage.setItem('token', response.data.token);
        console.log('Login exitoso:', response);
      },
      error: (err) => {
        console.error('Error en login:', err);
      }
    });
  }
}
