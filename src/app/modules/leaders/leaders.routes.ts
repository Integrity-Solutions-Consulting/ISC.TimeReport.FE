import { Routes } from "@angular/router";
import { ListLeadersPage } from "./pages/list-leaders/list-leaders.page";
import { LeaderDetailsComponent } from "./components/leader-details/leader-details.component";

export const LeaderRoutes: Routes = [
  {
    path: '',
    component: ListLeadersPage
  },
  {
    path: ':id',
    component: LeaderDetailsComponent
  },
];
