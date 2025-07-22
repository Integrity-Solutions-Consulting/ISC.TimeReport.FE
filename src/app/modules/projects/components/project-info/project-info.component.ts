import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatError } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { ClientService } from '../../../clients/services/client.service';
import { Client } from '../../../clients/interfaces/client.interface';
import { Project } from '../../interfaces/project.interface';
import { switchMap } from 'rxjs';

@Component({
  selector: 'project-info',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatListModule,
    MatDividerModule,
    MatChipsModule,
    MatButtonModule,
    MatProgressSpinner,
    MatIconModule
  ],
  providers: [DatePipe],
  templateUrl: './project-info.component.html',
  styleUrl: './project-info.component.scss'
})
export class ProjectInfoComponent implements OnInit{

  project: Project | null = null; // Usando la interfaz Project
  client: Client | null = null;   // Usando la interfaz Client
  isLoading = true;
  error: string | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private clientService: ClientService,
    private datePipe: DatePipe
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProjectDetails(+id);
    }
  }

  loadProjectDetails(id: number): void {
    this.projectService.getProjectById(id).pipe(
      switchMap(projectData => {
        this.project = projectData;
        return this.clientService.getClientByID(projectData.clientID);
      })
    ).subscribe({
      next: (clientData) => {
        this.client = clientData; // Almacenamos todo el objeto cliente
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading data', err);
        this.isLoading = false;
      }
    });
  }

  formatDate(date: string): string {
    return this.datePipe.transform(date, 'dd/MM/yyyy') || '';
  }

  goBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

}
