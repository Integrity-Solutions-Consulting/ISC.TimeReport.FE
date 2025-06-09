import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'menu-timereport',
  standalone: true,
  imports: [
    RouterLink,
    CommonModule,
    RouterModule
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent implements OnInit {

  public options: { nombreMenu: string; rutaMenu: string }[] = [];

  ngOnInit(): void {
    const rawMenus = localStorage.getItem('menus');
    console.log('Raw from localStorage:', rawMenus);

    const parsedMenus = rawMenus ? JSON.parse(rawMenus) : [];

    this.options = parsedMenus.map((item: any) => {
      const ruta = item.rutaMenu.startsWith('/menu/')
        ? item.rutaMenu
        : `/menu/${item.rutaMenu.replace(/^\/+/, '')}`; // quita '/' inicial si hay y le agrega '/menu/'

      return {
        nombreMenu: item.nombreMenu,
        rutaMenu: ruta
      };
    });

    console.log('Opciones cargadas:', this.options);
  }
}
