import { Component, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../modules/auth/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatToolbarModule, MatIconModule, MatButtonModule, MatMenuModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  @Output() toggleMenu = new EventEmitter<void>();
  username = 'Usuario'; // Luego puedes pasar esto desde un servicio

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.username = this.authService.getUsername();
    this.authService.username$.subscribe(name => {
      console.log('Nombre recibido:', name);
      this.username = name;
    });
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/auth/login']);
  }

  navigateToChangePassword(): void {
    this.router.navigate(['/auth/change-password']); // Asegúrate de que 'change-password' sea la ruta configurada para tu componente
  }
}
