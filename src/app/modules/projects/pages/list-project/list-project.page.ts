import { Component } from '@angular/core';
import { ListProjectComponent } from "../../components/list-project/list-project.component";
import { MatCardModule } from '@angular/material/card';
import { LoadingComponent } from '../../../auth/components/login-loading/login-loading.component';
import { Subscription } from 'rxjs';
import { ProjectService } from '../../services/project.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-list-project',
  standalone: true,
  imports: [
    CommonModule,
    ListProjectComponent,
    MatCardModule,
    LoadingComponent
  ],
  templateUrl: './list-project.page.html',
  styleUrl: './list-project.page.scss'
})
export class ListProjectPage {
  isLoading = false;
  private loadingSubscription: Subscription;

  constructor(private projectService: ProjectService) {
    // Suscribirse a los cambios de estado de carga
    this.loadingSubscription = this.projectService.loadingState$.subscribe(
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
