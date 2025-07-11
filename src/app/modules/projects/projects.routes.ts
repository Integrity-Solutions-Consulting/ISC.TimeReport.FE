import { Routes } from '@angular/router';
import { ListProjectPage } from './pages/list-project/list-project.page';
import { InfoProjectPage } from './pages/info-project/info-project.page';

export const projectsRoutes: Routes = [
    {
      path: '',
      component: ListProjectPage
    },
    {
      path: ':id',
      component: InfoProjectPage
    }
]
