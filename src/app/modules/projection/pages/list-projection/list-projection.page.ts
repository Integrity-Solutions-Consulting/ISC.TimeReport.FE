import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ProjectionListComponent } from '../../components/projection-list/projection-list.component';

@Component({
  selector: 'app-list-projection',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    ProjectionListComponent
  ],
  templateUrl: './list-projection.page.html',
  styleUrl: './list-projection.page.scss'
})
export class ListProjectionPage {

}
