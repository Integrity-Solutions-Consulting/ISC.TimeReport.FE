import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ProjectionViewComponent } from '../../components/projection-view/projection-view.component';

@Component({
  selector: 'app-projection-page',
  standalone: true,
  imports: [
    MatCardModule,
    ProjectionViewComponent
  ],
  templateUrl: './projection.page.html',
  styleUrl: './projection.page.scss'
})
export class ProjectionPage {

}
