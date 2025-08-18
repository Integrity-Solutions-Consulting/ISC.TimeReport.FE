import { Component } from '@angular/core';
import { Leader } from '../../interfaces/leader.interface';
import { LeaderListComponent } from '../../components/leader-list/leader-list.component';
import { MatCardModule } from '@angular/material/card';
import { LoadingComponent } from '../../../auth/components/login-loading/login-loading.component';
import { Subscription } from 'rxjs';
import { LeadersService } from '../../services/leaders.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'list-leaders',
  standalone: true,
  imports: [
    LeaderListComponent,
    LoadingComponent,
    MatCardModule,
    CommonModule
  ],
  templateUrl: './list-leaders.page.html',
  styleUrl: './list-leaders.page.scss'
})
export class ListLeadersPage{
  isLoading = false;
  private loadingSubscription: Subscription;

  constructor(private leaderService: LeadersService) {
    // Suscribirse a los cambios de estado de carga
    this.loadingSubscription = this.leaderService.loadingState$.subscribe(
      (isLoading) => {
        this.isLoading = isLoading;
      }
    );
  }

  ngOnDestroy() {
    // Limpiar la suscripción al destruir el componente
    if (this.loadingSubscription) {
      this.loadingSubscription.unsubscribe();
    }
  }
}
