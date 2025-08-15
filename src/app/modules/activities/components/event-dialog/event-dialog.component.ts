import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter, DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { Project, ProjectWithID } from '../../../projects/interfaces/project.interface';
import { ProjectService } from '../../../projects/services/project.service';
import { MatButtonModule } from '@angular/material/button';
import { ActivityService } from '../../services/activity.service';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter, MomentDateModule } from '@angular/material-moment-adapter';

export const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'dd/MM/yyyy',
    monthYearLabel: 'MMMM yyyy',
    dateA11yLabel: 'dd/MM/yyyy',
    monthYearA11yLabel: 'MMMM yyyy'
  },
};

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
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
        {
          provide: DateAdapter,
          useClass: MomentDateAdapter,
          deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
        },
        { provide: MAT_DATE_FORMATS, useValue: {
          parse: {
            dateInput: 'DD/MM/YYYY',
          },
          display: {
            dateInput: 'DD/MM/YYYY',
            monthYearLabel: 'MMMM YYYY',
            dateA11yLabel: 'LL',
            monthYearA11yLabel: 'MMMM YYYY'
          },
        }}
  ],
  templateUrl: '../event-dialog/event-dialog.component.html',
  styleUrl: '../event-dialog/event-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventDialogComponent implements OnInit{

  projects: ProjectWithID[] = [];

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
    projectID: null,
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

  currentEmployeeId: number | null = null;

  constructor(
    private projectService: ProjectService,
    private activityService: ActivityService,
    public dialogRef: MatDialogRef<EventDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data.event) {
      this.event = { ...this.event, ...data.event };
    }

    this.event.projectId = this.event.projectId || null;

    // Si data.projects y data.activityTypes existen, úsalos
    if (data.projects) {
      this.projects = data.projects;
    }
    if (data.activityTypes) {
      this.activityTypes = data.activityTypes.map((type: any) => ({ id: type.id, value: this.getActivityTypeName(type.id) }));
    }

    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    this.currentEmployeeId = userData.data?.employeeID || null;

  }

  ngOnInit(): void {
    // Cargar proyectos si no se pasaron al diálogo (aunque ya se pasan desde el padre)
    if (this.data.projects) {
      this.projects = this.data.projects;
    } else {
      // Si no, cargamos según el rol
      this.loadProjectsBasedOnRole();
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

  private loadProjectsBasedOnRole(): void {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const isAdmin = userData?.data?.roles?.some((role: any) =>
      role.id === 1 && role.roleName === "Administrador"
    );

    if (isAdmin) {
      this.projectService.getAllProjects().subscribe(projects => {
        this.projects = projects;
      });
    } else if (this.currentEmployeeId) {
      this.projectService.getProjectsByEmployee(this.currentEmployeeId, {
        PageNumber: 1,
        PageSize: 100,
        search: ''
      }).subscribe(response => {
        this.projects = response.items || [];
      });
    }
  }

  onProjectChange(projectId: number | null): void {
    if (projectId) {
      const selectedProject = this.projects.find(p => p.id === projectId);
      if (selectedProject && selectedProject.code) {
        this.event.requirementCode = selectedProject.code;
      } else {
        this.event.requirementCode = '';
      }
    } else {
      this.event.requirementCode = '';
    }
  }

  preparePayload(): any {

    console.log('Valores actuales:', {
      isFullDay: this.isFullDay,
      eventHours: this.event.hours,
      activityTypeID: this.event.activityTypeID,
      projectID: this.event.projectID,
      selectedProject: this.projects.find(p => p.id === this.event.projectID)
    });

    const payload = {
      id: this.data.isEdit ? this.event.id : undefined,
      projectID: Number(this.event.projectID),
      activityTypeID: this.event.activityTypeID,
      hoursQuantity: this.isFullDay ? 8 : Number(this.event.hours || 4),
      activityDate: this.event.activityDate,
      activityDescription: this.event.activityDescription,
      requirementCode: this.event.requirementCode,
      notes: this.event.details || '',
      fullDay: this.isFullDay // Esto se usa solo internamente en el diálogo
    };
    console.log(payload);
    return payload;
  }

  validateHours(): void {
    if (!this.isFullDay) {
      // Asegurar que sea un número válido entre 1 y 8
      const hours = Number(this.event.hours);
      this.event.hours = isNaN(hours) ? 4 : Math.max(1, Math.min(8, hours));
    }
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
    // Validación básica de campos requeridos
    if (!this.event.activityTypeID ||
        !this.event.projectID ||
        !this.event.activityDescription ||
        !this.event.activityDate) {
      return false;
    }

    // Validación de horas si no es día completo
    if (!this.isFullDay) {
      const hours = Number(this.event.hours);
      if (isNaN(hours) || hours < 1 || hours > 8) {
        return false;
      }
    }

    // Validación de horas máximas por día (solo para nuevas actividades)
    if (!this.data.isEdit) {
      let currentHoursForDay = 0;
      const selectedDate = this.formatDate(this.event.activityDate);

      if (this.data.currentCalendarEvents) {
        this.data.currentCalendarEvents.forEach((event: any) => {
          const eventStartDate = this.formatDate(event.start);
          if (eventStartDate === selectedDate) {
            currentHoursForDay += event.extendedProps?.hoursQuantity || 0;
          }
        });
      }

      const proposedHours = this.isFullDay ? 8 : Number(this.event.hours);
      if ((currentHoursForDay + proposedHours) > 8) {
        return false;
      }
    }

    return true;
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
