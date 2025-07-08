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
import { ActivityService } from '../../services/activity.service';

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
    { id: 1, value: 'Desarrollo' },
    { id: 2, value: 'Reunión' },
    { id: 3, value: 'Análisis' },
    { id: 4, value: 'Testing' }, 
    { id: 5, value: 'Documentación' },
    { id: 6, value: 'Soporte' },
    { id: 7, value: 'Capacitación' },
  ];

  event: any = {
    activityType: 'Desarrollo',
    projectId: null,
    details: '',
    activityDescription: '',
    activityDate: new Date(),
    hours: 8,
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
    private activityService: ActivityService,
    public dialogRef: MatDialogRef<EventDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data.event) {
      this.event = { ...this.event, ...data.event };
    }

    // Si data.projects y data.activityTypes existen, úsalos
    if (data.projects) {
      this.projects = data.projects;
    }
    if (data.activityTypes) {
      this.activityTypes = data.activityTypes.map((type: any) => ({ id: type.id, value: this.getActivityTypeName(type.id) }));
    }
  }

  ngOnInit(): void {
    // Cargar proyectos si no se pasaron al diálogo (aunque ya se pasan desde el padre)
    if (!this.projects.length) {
      // Esto solo se ejecutaría si no se pasan desde el componente padre
      // Para este caso, ya los estamos pasando, así que esta carga extra no es necesaria
      // this.loadProjects();
    }

    if (this.data.isEdit) {
      // Al editar, inicializa isFullDay basado en hoursQuantity
      this.isFullDay = this.event.hours === 8;
      // Asegurarse de que activityDate sea un objeto Date
      this.event.activityDate = new Date(this.event.activityDate);

      // Si el campo activityDescription está en extendedProps en el calendario, asignarlo.
      // Si no, `event.title` del calendario podría contener la descripción y el proyecto.
      // Aquí estamos asumiendo que `activityDescription` viene directamente de `extendedProps`.
      if (this.data.event.activityDescription) {
        this.event.activityDescription = this.data.event.activityDescription;
      }
    } else {
      // Para nuevas actividades, establecer la duración por defecto
      this.isFullDay = true; // Por defecto es día completo
      this.event.hours = 8;
    }
    this.onDurationChange(); // Asegura que las horas se configuren al inicio
  }

  onDurationChange(): void {
    if (this.isFullDay) {
      this.event.hours = 8; // Día completo = 8 horas
    } else if (typeof this.event.hours !== 'number' || isNaN(this.event.hours) || this.event.hours < 1 || this.event.hours > 8) {
      this.event.hours = 4; // Por defecto a 4 horas para "Medio Día"
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
      activityTypeID: this.event.activityTypeID,
      hoursQuantity: this.isFullDay ? 8 : this.event.hours,
      activityDate: this.formatDate(this.event.activityDate),
      activityDescription: this.event.activityDescription,
      notes: this.event.details,
      fullDay: this.isFullDay // Esto se usa solo internamente en el diálogo
    };
    console.log(payload);
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

  private getActivityTypeName(activityTypeId: number): string {
    const activityTypesMap: { [key: number]: string } = {
      1: 'Desarrollo',
      2: 'Reunión',
      3: 'Análisis',
      4: 'Testing',
      5: 'Documentación',
      6: 'Soporte',
      7: 'Capacitación'
    };
    return activityTypesMap[activityTypeId] || 'Desconocido';
  }

  private formatDate(dateInput: any): string {
    if (!dateInput) {
      return new Date().toISOString().split('T')[0];
    }
    if (dateInput instanceof Date) {
      return dateInput.toISOString().split('T')[0];
    }
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      return dateInput;
    }
    const date = new Date(dateInput);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    console.warn('Formato de fecha no reconocido en formatDate (dialog):', dateInput);
    return new Date().toISOString().split('T')[0];
  }

  isFormValid(): boolean {
    const basicValid = !!this.event.activityTypeID &&
      !!this.event.projectId &&
      !!this.event.activityDescription &&
      !!this.event.activityDate;

    if (!basicValid) return false;

    if (!this.isFullDay) {
      // Validar si las horas son válidas (entre 1 y 8)
      const hoursValid = this.event.hours !== undefined &&
        this.event.hours !== null &&
        this.event.hours >= 1 &&
        this.event.hours <= 8;

      if (!hoursValid) return false;
    }

    let currentHoursForDay = 0;
    const selectedDate = this.formatDate(this.event.activityDate);

    if (this.data.currentCalendarEvents) {
      this.data.currentCalendarEvents.forEach((event: any) => {
        const eventStartDate = this.formatDate(event.start);
        // Si el evento no es el que estamos editando y es del mismo día
        if (eventStartDate === selectedDate && (this.data.isEdit ? event.id !== this.event.id : true)) {
          currentHoursForDay += event.extendedProps?.hoursQuantity || 0;
        }
      });
    }

    const proposedHours = this.isFullDay ? 8 : this.event.hours;
    if ((currentHoursForDay + proposedHours) > 8) {
      return false; // Excede el máximo de 8 horas
    }

    return true;
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
