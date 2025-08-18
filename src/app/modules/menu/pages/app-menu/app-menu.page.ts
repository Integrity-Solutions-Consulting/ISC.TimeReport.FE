import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from '../../../../layout/footer/footer.component';
import { HeaderComponent } from '../../../../layout/header/header.component';
import { MenuComponent } from '../../../../layout/menu/menu.component';
import { CommonModule } from '@angular/common';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { AuthService } from '../../../auth/services/auth.service';
import { LoadingComponent } from '../../../auth/components/login-loading/login-loading.component';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    RouterOutlet,
    MenuComponent,
    FooterComponent,
    HeaderComponent,
    CommonModule,
    MatSidenavModule,
    LoadingComponent
  ],
  templateUrl: './app-menu.page.html',
  styleUrl: './app-menu.page.scss'
})
export class AppMenuPage implements OnInit{

  @ViewChild('sidenav') sidenav!: MatSidenav;
  isMobile = false;
  isLoading = false;
  menuOpen = true;
  mobileHeaderHeight = 56; // Altura típica de header móvil

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.checkScreenWidth();
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenWidth();
  }

  private checkScreenWidth() {
    this.isMobile = window.innerWidth < 768;
    if (!this.isMobile) {
      this.menuOpen = true;
    }
  }
}

