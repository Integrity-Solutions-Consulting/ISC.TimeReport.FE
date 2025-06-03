import { Routes } from "@angular/router";
import { ManageLeadersPage } from "./pages/manage-leaders/manage-leaders.page";
import { ListLeadersPage } from "./pages/list-leaders/list-leaders.page";

export const LeaderRoutes: Routes = [
  {
    path: '',
    component: ListLeadersPage
  },
  {
    path: 'manage',
    component: ManageLeadersPage,
  }
];
