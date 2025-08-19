import { Component } from '@angular/core';
import { Client } from '../../interfaces/client.interface';
import { ClientListComponent } from '../../components/client-list/client-list.component';
import { MatCardModule } from '@angular/material/card';
import { LoadingComponent } from '../../../auth/components/login-loading/login-loading.component';
import { Subscription } from 'rxjs';
import { ClientService } from '../../services/client.service';

@Component({
  selector: 'list-customers',
  standalone: true,
  imports:[
    ClientListComponent,
    LoadingComponent,
    MatCardModule
  ],
  templateUrl: './list-clients.page.html',
  styleUrl: './list-clients.page.scss'
})
export class ListClientsPage {

  isLoading = false;
  private loadingSubscription: Subscription;

  constructor(private clientService: ClientService) {
    // Suscribirse a los cambios de estado de carga
    this.loadingSubscription = this.clientService.loadingState$.subscribe(
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
