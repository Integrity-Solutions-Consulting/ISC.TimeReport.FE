import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  username = 'Usuario'; // Luego puedes pasar esto desde un servicio

  constructor(private router: Router) {}

  logout() {
    localStorage.clear(); // o localStorage.removeItem('token') si usas token
    this.router.navigate(['/auth/login']);
  }
}
