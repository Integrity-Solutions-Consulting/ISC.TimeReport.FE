import { Routes } from '@angular/router';
import { CalendarPage } from './pages/calendar/calendar.page';
import { ListCollabPage } from './pages/list-collab/list-collab.page';

export const activitiesRoutes: Routes = [
    {
        path: '',
        component: CalendarPage,
    },
    {
      path: 'tracking',
      component: ListCollabPage
    }
];
