import { Component } from '@angular/core';
import { ReportHoursTableComponent } from '../../../components/report-hours-table/report-hours-table.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from "@angular/material/card";

@Component({
  selector: 'project-hours-page',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    ReportHoursTableComponent,
    MatCardModule
],
  templateUrl: './project-hours.page.html',
  styleUrls: ['./project-hours.page.scss']
})
export class ProjectHoursPage {



}
