// login.component.ts
import { Component, type OnInit, inject } from "@angular/core"
import { FormBuilder, type FormGroup, Validators, ReactiveFormsModule, FormsModule } from "@angular/forms"
import { AuthService } from "../../services/auth.service"
import type { LoginRequest } from "../../interfaces/auth.interface"
import { CommonModule } from "@angular/common"
import { Router, RouterModule } from "@angular/router"
import { LoadingComponent } from "../../components/login-loading/login-loading.component"
import { AlertaComponent } from "../../components/alerta/alerta.component"
import { trigger, transition, style, animate } from '@angular/animations';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: "LoginPage",
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    LoadingComponent,
    AlertaComponent,
    MatIconModule,
    MatButtonModule,
    RouterModule
  ],
  templateUrl: "./login.component.html",
  styleUrl: "./login.component.scss",
  animations: [
    trigger('slideAnimation', [
      transition('void => *', [
        style({ opacity: 0 }),
        animate('300ms', style({ opacity: 1 }))
      ]),
      transition('* => void', [
        animate('300ms', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class LoginPage implements OnInit {
  private fb = inject(FormBuilder)
  private authService = inject(AuthService)
  private router = inject(Router)

  mensajeError = ""
  mostrarError = false
  formInvalid = false
  isLoading = false
  showPassword = false
  rememberMe = false

  loginForm: FormGroup = this.fb.group({
    username: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required, Validators.minLength(6)]],
    rememberMe: [false]
  });

  // Propiedades para el carrusel
  carouselImages = [
    'assets/img/isc-01.jpeg',
    'assets/img/isc-02.jpeg',
    'assets/img/isc-03.jpeg'
  ];
  currentSlide = 0;
  private intervalId: any;

  ngOnInit(): void {
    /*this.loginForm = this.fb.group({
      username: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });*/

    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      this.loginForm.patchValue({
        username: rememberedEmail,
        rememberMe: true
      });
    }

    this.startAutoRotation();
  }

  ngOnDestroy(): void {
    this.stopAutoRotation();
  }

  startAutoRotation(): void {
    this.intervalId = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  stopAutoRotation(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.carouselImages.length;
  }

  prevSlide(): void {
    this.currentSlide = (this.currentSlide - 1 + this.carouselImages.length) % this.carouselImages.length;
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
    this.stopAutoRotation();
    this.startAutoRotation();
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword
  }

  login(): void {
    if (this.loginForm.invalid) {
      this.mensajeError = "Por favor, complete todos los campos correctamente.";
      this.mostrarError = true;
      setTimeout(() => (this.mostrarError = false), 4000);
      this.loginForm.markAllAsTouched();
      this.formInvalid = true;
      return;
    }

    this.formInvalid = false;
    this.isLoading = true;

    const credentials: LoginRequest = this.loginForm.value;

    this.authService.login(credentials).subscribe({
      next: (response) => {
        // Guardar email si el usuario lo marcó
        if (this.loginForm.value.rememberMe) {
          localStorage.setItem("rememberedEmail", credentials.username);
        } else {
          localStorage.removeItem("rememberedEmail");
        }

        // Redirigir según rol
        if (this.authService.isAdmin()) {
          this.router.navigate(["/menu"]);
        } else {
          this.router.navigate(["/menu/activities"]);
        }

        this.isLoading = false;
        this.loginForm.reset();
        this.authService.updateUsername();
      },
      error: (err) => {
        this.isLoading = false;

        if (err.status === 401) {
          this.mensajeError = "Usuario o contraseña incorrectos.";
        } else if (err.status === 404) {
          this.mensajeError = "El usuario no existe.";
        } else {
          this.mensajeError = "Ocurrió un error inesperado. Intenta de nuevo.";
        }

        this.mostrarError = true;
        setTimeout(() => (this.mostrarError = false), 4000);

        // Restaurar el email si estaba recordado
        const rememberedEmail = localStorage.getItem("rememberedEmail");
        this.loginForm.reset({
          username: rememberedEmail || "",
          password: "",
          rememberMe: !!rememberedEmail
        });
      },
    });
  }

}
