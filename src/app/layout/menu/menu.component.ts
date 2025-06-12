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

  public options: { moduleName: string; modulePath: string }[] = [];

  ngOnInit(): void {
    const rawMenus = localStorage.getItem('modules');
    console.log('Raw from localStorage:', rawMenus);

    const parsedMenus = rawMenus ? JSON.parse(rawMenus) : [];

    this.options = parsedMenus.map((item: any) => {
      const ruta = item.modulePath.startsWith('/menu/')
        ? item.rutaMenu
        : `/menu/${item.modulePath.replace(/^\/+/, '')}`; // quita '/' inicial si hay y le agrega '/menu/'

      return {
        moduleName: item.moduleName,
        modulePath: ruta
      };
    });

    console.log('Opciones cargadas:', this.options);
  }
}
