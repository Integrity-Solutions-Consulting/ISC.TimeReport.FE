import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { Project } from '../../../projects/interfaces/project.interface';
import { ProjectService } from '../../../projects/services/project.service';
import { MatButtonModule } from '@angular/material/button';

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
    MatSlideToggleModule,
    MatDividerModule,
    FormsModule
  ],
  providers: [
    provideNativeDateAdapter()
  ],
  templateUrl: '../event-dialog/event-dialog.component.html',
  styleUrl: '../event-dialog/event-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventDialogComponent implements OnInit{

  projects: Project[] = [];

  isFullDay = true;

  activityTypes = [
    { id: 1, value: 'Desarrollo'},
    { id: 2, value: 'Reunión'},
    { id: 3, value: 'Análisis'},
    { id: 4, value: 'Testing'},
    { id: 5, value: 'Documentación'},
    { id: 6, value: 'Soporte'},
    { id: 7, value: 'Capacitación'},
  ]

  event: any = {
    activityType: 'Desarrollo',
    projectId: null,
    details: '',
    activityDate: new Date(),
    hours: 4,
    fullDay: 'full'
  };

  availableColors = [
    { name: 'Azul', value: '#4285F4' },
    { name: 'Rojo', value: '#EA4335' },
    { name: 'Amarillo', value: '#FBBC05' },
    { name: 'Verde', value: '#34A853' },
    { name: 'Morado', value: '#9C27B0' },
    { name: 'Naranja', value: '#FF9800' }
  ];

  constructor(
    private projectService: ProjectService,
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

  ngOnInit(): void {
    this.loadProjects();
    if (this.data.event) {
      this.event = { ...this.event, ...this.data.event };
      this.isFullDay = this.event.fullDay === 'full';
    }
    if (this.data.isEdit) {
      this.isFullDay = this.data.event.fullDay;
      this.event = {
        ...this.data.event,
        hours: this.data.event.hoursQuantity || 4 // Mapeo correcto al inicializar
      };
    }
  }

  onDurationChange(): void {
    if (this.isFullDay) {
      this.event.hours = 8; // Establece valor por defecto para día completo
    } else {
      this.event.hours = this.event.hours || 4; // Valor por defecto para medio día
    }
  }

  loadProjects(): void {
    this.projectService.getProjects().subscribe(projects => {
      this.projects = projects.items;
    });
  }

  preparePayload(): any {
      const payload = {
        id: this.data.isEdit ? this.event.id : undefined,
        projectId: this.event.projectId,
        activityTypeID: this.event.activityTypeID || this.getActivityTypeId(this.event.activityTypeID),
        hoursQuantity: this.isFullDay ? 8 : this.event.hours,
        activityDate: this.formatDate(this.event.activityDate),
        activityDescription: this.event.activityDescription,
        details: this.event.details,
        fullDay: this.isFullDay ? 'full' : 'half'
      };

      return payload;
  }

  private getActivityTypeId(activityType: string): number {
    const activityTypes: {[key: string]: number} = {
      'Desarrollo': 1,
      'Reunión': 2,
      'Análisis': 3,
      'Revisión': 4,
      'Documentación': 5,
      'Soporte': 6,
      'Capacitación': 7
    };
    return activityTypes[activityType] || 1; // Si no existe, devuelve 1 (Desarrollo) por defecto
  }

  private formatDate(dateInput: any): string {
      // Si es undefined o null, usa la fecha actual
      if (!dateInput) {
          dateInput = new Date();
      }

      // Si ya es un objeto Date
      if (dateInput instanceof Date) {
          return dateInput.toISOString().split('T')[0];
      }

      // Si es un string en formato ISO (YYYY-MM-DD)
      if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
          return dateInput;
      }

      // Intenta convertir a Date
      const date = new Date(dateInput);
      if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
      }

      // Fallback a fecha actual
      console.warn('Formato de fecha no reconocido:', dateInput);
      return new Date().toISOString().split('T')[0];
  }

  isFormValid(): boolean {
    const basicValid = !!this.event.activityTypeID &&
                    !!this.event.projectId &&
                    !!this.event.activityDescription &&
                    !!this.event.activityDate;

    if (this.isFullDay) {
      return basicValid;
    } else {
      return basicValid &&
            (this.event.hours !== undefined &&
            this.event.hours !== null &&
            this.event.hours >= 1 &&
            this.event.hours <= 8);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
