import { Routes } from '@angular/router';

import { ProjectDatesPage } from './project-dates/project-dates.page';
import { ProjectHoursPage } from './project-hours/project-hours.page';

export const REPORTES_ROUTES: Routes = [
  {
    path: '',
    children: [
      { path: 'hours', component: ProjectHoursPage },
      { path: 'date', component: ProjectDatesPage }
    ]
  }
];

export default REPORTES_ROUTES;
