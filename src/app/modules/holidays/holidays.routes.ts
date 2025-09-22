import { Routes } from "@angular/router";
import { ListHolidaysPage } from "./pages/list-holidays/list-holidays.page";
import { HolidayViewComponent } from "./components/holiday-view/holiday-view.component";
//import { LeaderDetailsComponent } from "./components/leader-details/leader-details.component";

export const HolidaysRoutes: Routes = [
  {
    path: '',
    component: ListHolidaysPage
  },
  {
    path: ':id',
    component: HolidayViewComponent
  },
];
