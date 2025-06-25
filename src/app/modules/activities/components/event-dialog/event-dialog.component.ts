import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

@Component({
  selector: 'app-event-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatDividerModule,
    FormsModule
  ],
  templateUrl: '../event-dialog/event-dialog.component.html',
  styleUrl: '../event-dialog/event-dialog.component.scss'
})
export class EventDialogComponent {
  availableColors = [
    { name: 'Azul', value: '#4285F4' },
    { name: 'Rojo', value: '#EA4335' },
    { name: 'Amarillo', value: '#FBBC05' },
    { name: 'Verde', value: '#34A853' },
    { name: 'Morado', value: '#9C27B0' },
    { name: 'Naranja', value: '#FF9800' }
  ];

  event: any = {
    activityType: 'Desarrollo',
    project: 'ISC-FS-2025',
    details: '',
    activityDate: new Date(),
    fullDay: 'full',
    hours: 4,
    color: '#4285F4'
  };

  constructor(
    public dialogRef: MatDialogRef<EventDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data.event) {
      this.event = { ...this.event, ...data.event };
      // Si no tiene color asignado, usar el primero de la lista
      if (!this.event.color) {
        this.event.color = this.availableColors[0].value;
      }
    }
  }

  isFormValid(): boolean {
    return !!this.event.activityType &&
           !!this.event.project &&
           !!this.event.details &&
           !!this.event.activityDate &&
           (this.event.fullDay === 'full' || (this.event.hours && this.event.hours >= 1 && this.event.hours <= 8));
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
