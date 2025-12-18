import { Routes } from '@angular/router';
import { ListProjectPage } from './pages/list-project/list-project.page';
import { InfoProjectPage } from './pages/info-project/info-project.page';
import { ProjectionPage } from './pages/projection/projection.page';

export const projectsRoutes: Routes = [
  {
    path: 'projection/:projectId',
    component: ProjectionPage,
  },


  {
    path: '',
    component: ListProjectPage,
  },


  {
    path: ':id',
    component: InfoProjectPage,
  }

];
