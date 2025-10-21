// projection-hour.component.ts
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ProjectionGroup } from '../../interfaces/projection.interface';
import { environment } from '../../../../../environments/environment';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'projection-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatExpansionModule,
    MatChipsModule,
    MatIconModule,
    MatTableModule

  ],
  templateUrl: './projection-list.component.html',
  styleUrls: ['./projection-list.component.scss']
})
export class ProjectionListComponent implements OnInit {
  projectionGroups: ProjectionGroup[] = [];
  displayedColumns: string[] = [
    'resourceTypeName',
    'resource_name',
    'projection_name',
    'hourly_cost',
    'resource_quantity',
    'total_time',
    'resource_cost',
    'participation_percentage',
    'period_quantity'
  ];

  urlBase: string = environment.URL_BASE;

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.loadProjections();
  }

  loadProjections() {
    this.http.get<any[]>(`${this.urlBase}/api/ProjectionHour/get-all`).subscribe({
      next: (data) => {
        this.projectionGroups = this.transformData(data);
      },
      error: (error) => {
        console.error('Error loading projections:', error);
      }
    });
  }

  private transformData(data: any[]): ProjectionGroup[] {
    const groups: ProjectionGroup[] = [];

    data.forEach(groupArray => {
      if (groupArray && groupArray.length > 0) {
        const firstItem = groupArray[0];
        const group: ProjectionGroup = {
          groupId: firstItem.groupProjection,
          projections: groupArray,
          totalResources: this.calculateTotalResources(groupArray),
          totalCost: this.calculateTotalCost(groupArray),
          resourceTypesCount: groupArray.length
        };
        groups.push(group);
      }
    });

    return groups;
  }

  private calculateTotalResources(projections: any[]): number {
    return projections.reduce((sum, proj) => sum + proj.resource_quantity, 0);
  }

  private calculateTotalCost(projections: any[]): number {
    return projections.reduce((sum, proj) => sum + proj.resource_cost, 0);
  }

  // Método para obtener el nombre del proyecto del grupo
  getGroupProjectName(group: ProjectionGroup): string {
    return group.projections[0]?.projection_name || 'Sin nombre';
  }

  // Método para obtener información resumen del grupo
  getGroupSummary(group: ProjectionGroup): string {
    const totalResources = group.projections.reduce((sum, proj) => sum + proj.resource_quantity, 0);
    const totalCost = group.projections.reduce((sum, proj) => sum + proj.resource_cost, 0);

    return `${group.projections.length} recursos - ${totalResources} unidades - Costo total: $${totalCost}`;
  }

  verifyInformation(groupProjection: string | number): void {
    // Navegar a la ruta con el parámetro groupProjection
    // this.router.navigate(['projections', groupProjection]);
    // O si estás en una ruta relativa:
    this.router.navigate([groupProjection], { relativeTo: this.route });
  }

  createNewProjection(): void {
    // Navegar a una nueva proyección con ID 0 o 'new'
    this.router.navigate(['new'], { relativeTo: this.route });
    // O si prefieres una ruta absoluta:
    // this.router.navigate(['/projections/new']);
  }
}
