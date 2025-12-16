import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ReportDatesTableComponent } from '../../../components/report-dates-table/report-dates-table.component';
import { MatCardModule } from '@angular/material/card';
@Component({
  selector: 'project-dates-page',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, ReportDatesTableComponent,MatCardModule],
  templateUrl: './project-dates.page.html',
  styleUrls: ['./project-dates.page.scss'],
})
export class ProjectDatesPage {

}
