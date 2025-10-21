import { Routes } from "@angular/router";
import { ViewProjectionPage } from "./pages/view-projection/view-projection.page";
import { ListProjectionPage } from "./pages/list-projection/list-projection.page";

export const projectionRoutes: Routes = [
  {
    path: '',
    component: ListProjectionPage
  },
  {
    path: 'new',
    component: ViewProjectionPage
  },
  {
    path: ':groupProjection',
    component: ViewProjectionPage
  },
];
