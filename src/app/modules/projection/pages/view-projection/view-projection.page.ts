import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ProjectionViewComponent } from '../../../projection/components/projection-view/projection-view.component';
import { ActivatedRoute } from '@angular/router';
import { ProjectService } from '../../../projects/services/project.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-projection-page',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    ProjectionViewComponent
  ],
  templateUrl: './view-projection.page.html',
  styleUrl: './view-projection.page.scss'
})
export class ViewProjectionPage implements OnInit {
  projectId: number = 0;
  projectName: string = '';

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService
  ) {}

  ngOnInit() {
    this.loadProjectFromRoute();
  }

  loadProjectFromRoute() {
    this.route.params.subscribe(params => {
      const projectIdFromParams = params['projectId'];
      this.projectId = this.safeConvertToNumber(projectIdFromParams);

      if (this.projectId > 0) {
        this.loadProjectName();
      }
    });
  }

  private safeConvertToNumber(value: any): number {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const numberValue = Number(value);
      return isNaN(numberValue) ? 0 : numberValue;
    }
    return 0;
  }

  loadProjectName() {
    this.projectService.getProjectById(this.projectId).subscribe({
      next: (project) => {
        if (project && project.name) {
          this.projectName = project.name;
        } else if (project && project.data && project.data.name) {
          this.projectName = project.data.name;
        } else {
          this.projectName = `Proyecto ${this.projectId}`;
        }
      },
      error: (error) => {
        console.error('Error al cargar nombre del proyecto:', error);
        this.projectName = `Proyecto ${this.projectId}`;
      }
    });
  }
}
