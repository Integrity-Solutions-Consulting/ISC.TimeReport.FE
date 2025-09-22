import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HolidaysService } from '../../services/holidays.service';
import { Holiday } from '../../interfaces/holiday.interface';
import { Location } from '@angular/common';

@Component({
  selector: 'app-holiday-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './holiday-view.component.html',
  styleUrls: ['./holiday-view.component.scss']
})
export class HolidayViewComponent implements OnInit {
  holiday: Holiday | null = null;
  isLoading = true;
  error: string | null = null;
  holidayId!: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private holidayService: HolidaysService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.holidayId = +params['id'];
      this.loadHoliday();
    });
  }

  loadHoliday(): void {
    this.isLoading = true;
    this.error = null;

    this.holidayService.getHolidayById(this.holidayId.toString()).subscribe({
      next: (response) => {
        this.holiday = response.data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar el feriado:', error);
        this.error = 'Error al cargar la información del feriado. Por favor, intenta nuevamente.';
        this.isLoading = false;
      }
    });
  }

  getHolidayTypeText(type: string): string {
    const typeMap: { [key: string]: string } = {
      'LOCAL': 'Local',
      'NACIONAL': 'Nacional',
      'RELIGIOSO': 'Religioso'
    };
    return typeMap[type] || type;
  }

  formatDisplayDate(dateString: string): string {
    if (!dateString) return '';

    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  }

  editHoliday(): void {
    if (this.holiday) {
      this.router.navigate(['/holidays', this.holiday.id, 'edit']);
    }
  }

  goBack(): void {
    this.location.back();
  }
}
