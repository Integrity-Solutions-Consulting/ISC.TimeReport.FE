import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'menu',
  standalone: true,
  imports:[
    RouterLink
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent {
  public options:string[] = ['/menu/customers/manage', '/menu/customers', '/menu/leaders', '/menu/leaders/manage'];
}
