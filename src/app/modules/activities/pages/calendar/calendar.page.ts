import { Component } from '@angular/core';
import { DailyActivitiesComponent } from '../../components/daily-activities/daily-activities.component';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    DailyActivitiesComponent
  ],
  templateUrl: './calendar.page.html',
  styleUrl: './calendar.page.scss'
})
export class CalendarPage {

}
