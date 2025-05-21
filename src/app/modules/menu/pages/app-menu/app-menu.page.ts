import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from '../../../../layout/footer/footer.component';
import { HeaderComponent } from '../../../../layout/header/header.component';
import { MenuComponent } from '../../../../layout/menu/menu.component';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    RouterOutlet,
    MenuComponent,
    FooterComponent,
    HeaderComponent
  ],
  templateUrl: './app-menu.page.html',
  styleUrl: './app-menu.page.scss'
})
export class AppMenuPage {

}

