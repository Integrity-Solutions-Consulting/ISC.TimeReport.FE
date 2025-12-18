import { Routes } from '@angular/router';
import { ProjectHoursPage } from './pages/project-hours/project-hours.page';
import { ProjectDatesPage } from './pages/project-dates/project-dates.page';



export const REPORTES_ROUTES: Routes = [
  {
    path: '',
    children: [
      { path: 'hours', component: ProjectHoursPage },
      { path: 'dates', component: ProjectDatesPage }
    ]
  }
];

export default REPORTES_ROUTES;
