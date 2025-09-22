import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { HolidaysListComponent } from '../../components/holidays-list/holidays-list.component';
import { LoadingComponent } from "../../../auth/components/login-loading/login-loading.component";

@Component({
  selector: 'app-list-holidays',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    HolidaysListComponent,
    LoadingComponent
],
  templateUrl: './list-holidays.page.html',
  styleUrl: './list-holidays.page.scss'
})
export class ListHolidaysPage {
  isLoading = false;
}
