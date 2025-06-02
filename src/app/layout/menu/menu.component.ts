import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'menu',
  standalone: true,
  imports:[
    RouterLink,
    CommonModule
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent {
  public staticOptions: string[] = ['/menu/customers/manage', '/menu/customers']; // menús fijos
  public dynamicOptions: string[] = []; // menús según rol
  public options: string[] = []; // combinación

  ngOnInit() {
    const menus = localStorage.getItem('menus');
    if (menus) {
      this.dynamicOptions = JSON.parse(menus);
    }

    // Unir ambos sin duplicados
    const set = new Set([...this.staticOptions, ...this.dynamicOptions]);
    this.options = Array.from(set);
  }
}

