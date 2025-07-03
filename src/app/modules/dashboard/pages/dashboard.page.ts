import { Component } from '@angular/core';
import { DashboardComponent } from "../components/dashboard.component";

@Component({
  selector: 'dashboard-page',
  standalone: true,
  imports: [DashboardComponent],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss'
})
export class DashboardPage {

}
