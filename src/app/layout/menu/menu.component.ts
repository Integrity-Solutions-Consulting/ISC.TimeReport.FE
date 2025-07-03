import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'menu-timereport',
  standalone: true,
  imports: [
    RouterLink,
    CommonModule,
    RouterModule,
    MatListModule,
    MatIconModule
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

    this.options = parsedMenus
      .filter((item: any) => item.modulePath)
      .map((item: any) => {
        const ruta = item.modulePath.startsWith('/menu/')
          ? item.modulePath
          : `/menu/${item.modulePath.replace(/^\/+/, '')}`;

        return {
          moduleName: item.moduleName || 'Unnamed Module',
          modulePath: ruta
        };
      });

    console.log('Opciones cargadas:', this.options);
  }
}
