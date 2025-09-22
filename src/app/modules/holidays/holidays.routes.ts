import { Routes } from "@angular/router";
import { ListHolidaysPage } from "./pages/list-holidays/list-holidays.page";
//import { LeaderDetailsComponent } from "./components/leader-details/leader-details.component";

export const HolidaysRoutes: Routes = [
  {
    path: '',
    component: ListHolidaysPage
  },
  /*{
    path: ':id',
    component: LeaderDetailsComponent
  },*/
];
