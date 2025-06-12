import { Component, type OnInit, inject } from "@angular/core"
import { FormBuilder, type FormGroup, Validators, ReactiveFormsModule, FormsModule } from "@angular/forms"
import { AuthService } from "../../services/auth.service"
import type { LoginRequest } from "../../interfaces/auth.interface"
import { CommonModule } from "@angular/common"
import { Router } from "@angular/router"
import { LoadingComponent } from "../../components/login-loading/login-loading.component"
import { AlertaComponent } from "../../components/alerta/alerta.component"

@Component({
  selector: "LoginPage",
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule, LoadingComponent, AlertaComponent],
  templateUrl: "./login.component.html",
  styleUrl: "./login.component.scss",
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

  loginForm!: FormGroup

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ["", [Validators.required, Validators.email]],
      Password: ["", [Validators.required, Validators.minLength(6)]],
    })

    // Load remembered email if exists
    const rememberedEmail = localStorage.getItem("rememberedEmail")
    if (rememberedEmail) {
      this.loginForm.patchValue({ email: rememberedEmail })
      this.rememberMe = true
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword
  }

  login(): void {
    if (this.loginForm.invalid) {
      this.mensajeError = "Por favor, complete todos los campos correctamente."
      this.mostrarError = true
      setTimeout(() => (this.mostrarError = false), 4000)
      this.loginForm.markAllAsTouched()
      this.formInvalid = true
      return
    }

    this.formInvalid = false
    this.isLoading = true

    const credentials: LoginRequest = this.loginForm.value

    // Handle remember me functionality
    if (this.rememberMe) {
      localStorage.setItem("rememberedEmail", credentials.username)
    } else {
      localStorage.removeItem("rememberedEmail")
    }

    console.log(credentials)

    this.authService.login(credentials).subscribe({
      next: (response) => {
        const { token, roles, modules } = response.data

        localStorage.setItem("token", token)
        localStorage.setItem("roles", JSON.stringify(roles))
        localStorage.setItem("modules", JSON.stringify(modules))

        this.loginForm.reset()
        this.isLoading = false
        this.router.navigate(["/menu"])
      },
      error: (err) => {
        this.isLoading = false

        if (err.status === 401) {
          this.mensajeError = "Usuario o contraseña incorrectos."
        } else if (err.status === 404) {
          this.mensajeError = "El usuario no existe."
        } else {
          this.mensajeError = "Ocurrió un error inesperado. Intenta de nuevo."
        }

        this.loginForm.reset()

        // Restore email if remember me is checked
        if (this.rememberMe) {
          const rememberedEmail = localStorage.getItem("rememberedEmail")
          if (rememberedEmail) {
            this.loginForm.patchValue({ email: rememberedEmail })
          }
        }

        this.mostrarError = true
        setTimeout(() => (this.mostrarError = false), 4000)
      },
    })
  }
}
