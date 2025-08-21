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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { Project, ProjectWithID } from '../../../projects/interfaces/project.interface';
import { ProjectService } from '../../../projects/services/project.service';
import { MatButtonModule } from '@angular/material/button';
import { ActivityService } from '../../services/activity.service';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter, MomentDateModule } from '@angular/material-moment-adapter';
import { TextFieldModule } from '@angular/cdk/text-field';
import { ActivityType } from '../../interfaces/activity.interface';

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
    FormsModule,
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
export class EventDialogComponent implements OnInit {

  projects: ProjectWithID[] = [];
  isFullDay = true;
  activityTypes: ActivityType[] = [];
  availableColors: { name: string; value: string }[] = [];

  event: any = {
    activityTypeID: 1,
    projectID: null,
    details: '',
    activityDescription: '',
    activityDate: new Date(),
    hours: 8,
    requirementCode: ''
  };

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

    if (data.activityTypes) {
      this.activityTypes = data.activityTypes;
    }

    if (data.projects) {
      this.projects = data.projects;
    }

    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    this.currentEmployeeId = userData.data?.employeeID || null;
  }

  ngOnInit(): void {
    this.loadActivityTypes();

    if (this.data.projects) {
      this.projects = this.data.projects;
    } else {
      this.loadProjectsBasedOnRole();
    }

    if (this.data.isEdit) {
      this.isFullDay = this.event.hours === 8;
      this.event.activityDate = new Date(this.event.activityDate);

      if (this.data.event.activityDescription) {
        this.event.activityDescription = this.data.event.activityDescription;
      }
    } else {
      this.isFullDay = true;
      this.event.hours = 8;
    }
    this.onDurationChange();
  }

  private loadActivityTypes(): void {
    if (this.activityTypes.length === 0) {
      this.activityService.getActivityTypes().subscribe({
        next: (types: ActivityType[]) => {
          this.activityTypes = types;
          this.availableColors = types.map((type: ActivityType) => ({
            name: type.name,
            value: type.colorCode
          }));
        },
        error: (err: any) => {
          console.error('Error al cargar tipos de actividad', err);
          this.setDefaultActivityTypes();
        }
      });
    }
  }

  private setDefaultActivityTypes(): void {
    this.activityTypes = [
      { id: 1, name: 'Desarrollo', description: 'Programación y desarrollo de software', colorCode: '#2E8B57' },
      { id: 2, name: 'Reunión', description: 'Reuniones con clientes y equipo', colorCode: '#4169E1' },
      { id: 3, name: 'Análisis', description: 'Análisis de requerimientos y diseño', colorCode: '#FF6347' },
      { id: 4, name: 'Testing', description: 'Pruebas y control de calidad', colorCode: '#9370DB' },
      { id: 5, name: 'Documentación', description: 'Creación de documentación', colorCode: '#DAA520' },
      { id: 6, name: 'Soporte', description: 'Soporte técnico y mantenimiento', colorCode: '#DC143C' },
      { id: 7, name: 'Capacitación', description: 'Entrenamiento y capacitación', colorCode: '#008B8B' },
      { id: 1002, name: 'Auditoria', description: 'Auditoria Informática', colorCode: '#518B00' }
    ];

    this.availableColors = this.activityTypes.map((type: ActivityType) => ({
      name: type.name,
      value: type.colorCode
    }));
  }

  onDurationChange(): void {
    if (this.isFullDay) {
      this.event.hours = 8;
    } else if (typeof this.event.hours !== 'number' || isNaN(this.event.hours) || this.event.hours < 1 || this.event.hours > 8) {
      this.event.hours = 4;
    }
  }

  loadProjects(): void {
    this.projectService.getProjects().subscribe((projects: any) => {
      this.projects = projects.items;
    });
  }

  private loadProjectsBasedOnRole(): void {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const isAdmin = userData?.data?.roles?.some((role: any) =>
      role.id === 1 && role.roleName === "Administrador"
    );

    if (isAdmin) {
      this.projectService.getAllProjects().subscribe((projects: ProjectWithID[]) => {
        this.projects = projects;
      });
    } else if (this.currentEmployeeId) {
      this.projectService.getProjectsByEmployee(this.currentEmployeeId, {
        PageNumber: 1,
        PageSize: 100,
        search: ''
      }).subscribe((response: any) => {
        this.projects = response.items || [];
      });
    }
  }

  onProjectChange(projectId: number | null): void {
    if (projectId) {
      const selectedProject = this.projects.find((p: ProjectWithID) => p.id === projectId);
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
      selectedProject: this.projects.find((p: ProjectWithID) => p.id === this.event.projectID)
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
      fullDay: this.isFullDay
    };
    console.log(payload);
    return payload;
  }

  validateHours(): void {
    if (!this.isFullDay) {
      const hours = Number(this.event.hours);
      this.event.hours = isNaN(hours) ? 4 : Math.max(1, Math.min(8, hours));
    }
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
    if (!this.event.activityTypeID ||
        !this.event.projectID ||
        !this.event.activityDescription ||
        !this.event.activityDate) {
      return false;
    }

    if (!this.isFullDay) {
      const hours = Number(this.event.hours);
      if (isNaN(hours) || hours < 1 || hours > 8) {
        return false;
      }
    }

    if (this.event.activityDescription.length > 200) {
      return false;
    }

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
