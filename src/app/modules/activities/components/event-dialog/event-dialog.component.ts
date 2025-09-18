import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
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
import { ActivityType, Holiday } from '../../interfaces/activity.interface';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-event-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatDividerModule,
    MatTooltipModule,
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
  activityTypes: ActivityType[] = [];
  availableColors: { name: string; value: string }[] = [];

  event: any = {
    activityTypeID: 1,
    projectID: null,
    details: '',
    activityDescription: '',
    activityDate: new Date(),
    hours: 4, // Valor por defecto cambiado a 4 horas
    requirementCode: ''
  };

    // Variables para recurrencia
  isRecurring: boolean = false;
  recurrenceStartDate: Date | null = null;
  recurrenceEndDate: Date | null = null;
  recurrenceDaysCount: number = 0;
  minRecurrenceDate: Date = new Date();
  holidays: Holiday[] = [];
  includeWeekends: boolean = false;
  includeHolidays: boolean = false;

  currentEmployeeId: number | null = null;

  constructor(
    private projectService: ProjectService,
    private activityService: ActivityService,
    public dialogRef: MatDialogRef<EventDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
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

    this.minRecurrenceDate = new Date();
  }

  ngOnInit(): void {
    this.loadActivityTypes();

    if (this.data.event) {
      this.event = {
        ...this.event,
        ...this.data.event,
        // Asegurar que hours tenga el valor correcto
        hours: this.data.event.hoursQuantity || this.data.event.hours || 4
      };
    }

    if (this.data.projects) {
      this.projects = this.data.projects;
      this.setDefaultProject();
    } else {
      this.loadProjectsBasedOnRole();
    }

    if (this.data.isEdit) {
      this.event.activityDate = new Date(this.event.activityDate);
      if (this.data.event.activityDescription) {
        this.event.activityDescription = this.data.event.activityDescription;
      }
      // Asegurar que no esté en modo recurrente cuando es edición
      this.isRecurring = false;
    } else {
      // Valor por defecto para nuevas actividades
      this.event.hours = 4;
      this.loadHolidays();
    }
  }

  private loadHolidays(): void {
    this.activityService.getAllHolidays().subscribe({
      next: (response) => {
        this.holidays = response.data || [];
        // Si estamos en modo recurrente, recalcular
        if (this.isRecurring) {
          this.calculateRecurrenceDays();
        }
      },
      error: (error) => {
        console.error('Error al cargar feriados:', error);
      }
    });
  }

  private setDefaultProject(): void {
    // Solo establecer proyecto por defecto si NO es edición y hay proyectos disponibles
    if (!this.data.isEdit && this.projects.length > 0) {
      // Si hay exactamente un proyecto, seleccionarlo automáticamente
      if (this.projects.length === 1) {
        this.event.projectID = this.projects[0].id;
        this.onProjectChange(this.event.projectID); // Para actualizar el código de requerimiento
      }
      // Si hay más de un proyecto, seleccionar el primero
      else if (this.projects.length > 1) {
        this.event.projectID = this.projects[0].id;
        this.onProjectChange(this.event.projectID);
      }
    }
  }

  onRecurringChange(): void {
    if (this.isRecurring) {
      // Establecer fechas por defecto para recurrencia
      this.recurrenceStartDate = new Date(this.event.activityDate);
      this.recurrenceEndDate = new Date(this.event.activityDate);
      this.recurrenceEndDate.setDate(this.recurrenceEndDate.getDate() + 6); // Una semana por defecto
      this.calculateRecurrenceDays();
    } else {
      this.recurrenceStartDate = null;
      this.recurrenceEndDate = null;
      this.recurrenceDaysCount = 0;
    }
  }

  onRecurrenceDatesChange(): void {
    if (this.recurrenceStartDate && this.recurrenceEndDate) {
      this.calculateRecurrenceDays();
    }
  }

  private getCurrentHoursExcludingSelf(): number {
    let totalHours = 0;
    const selectedDate = this.formatDate(this.event.activityDate);

    if (this.data.currentCalendarEvents) {
      this.data.currentCalendarEvents.forEach((event: any) => {
        const eventStartDate = this.formatDate(event.start);
        // Excluir la actividad actual que se está editando
        if (eventStartDate === selectedDate && event.id !== this.event.id) {
          totalHours += event.extendedProps?.hoursQuantity || 0;
        }
      });
    }

    return totalHours;
  }

  // Calcular cuántos días laborables hay en el rango
  private calculateRecurrenceDays(): void {
    if (!this.recurrenceStartDate || !this.recurrenceEndDate) {
      this.recurrenceDaysCount = 0;
      return;
    }

    let count = 0;
    const currentDate = new Date(this.recurrenceStartDate);
    const endDate = new Date(this.recurrenceEndDate);

    // Asegurarse de que endDate no sea anterior a startDate
    if (endDate < currentDate) {
      this.recurrenceDaysCount = 0;
      return;
    }

    while (currentDate <= endDate) {
      // Saltar fines de semana si no están incluidos
      if (this.includeWeekends || (!this.isWeekend(currentDate))) {
        // Saltar feriados si no están incluidos
        if (this.includeHolidays || (!this.isHoliday(currentDate))) {
          count++;
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    this.recurrenceDaysCount = count;
  }

  // Verificar si una fecha es feriado
  private isHoliday(date: Date): boolean {
    const dateString = date.toISOString().split('T')[0];
    return this.holidays.some(holiday => holiday.holidayDate === dateString);
  }

  // Verificar si una fecha es fin de semana
  private isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 es domingo, 6 es sábado
  }

  // Preparar el payload para actividades recurrentes
  prepareRecurrencePayload(): any[] {
    const payloads = [];

    if (!this.recurrenceStartDate || !this.recurrenceEndDate) {
      return [this.prepareSinglePayload()];
    }

    const currentDate = new Date(this.recurrenceStartDate);
    const endDate = new Date(this.recurrenceEndDate);

    while (currentDate <= endDate) {
      // Incluir según las opciones seleccionadas
      const includeDate = (this.includeWeekends || !this.isWeekend(currentDate)) &&
                        (this.includeHolidays || !this.isHoliday(currentDate));

      if (includeDate) {
        const payload = {
          projectID: Number(this.event.projectID),
          activityTypeID: this.event.activityTypeID,
          hoursQuantity: Number(this.event.hours || 4),
          activityDate: this.formatDate(new Date(currentDate)), // Usar formatDate
          activityDescription: this.event.activityDescription,
          requirementCode: this.event.requirementCode,
          notes: this.event.details || ''
        };
        payloads.push(payload);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return payloads;
  }

  // Preparar payload para una sola actividad
  prepareSinglePayload(): any {
    return {
      id: this.data.isEdit ? this.event.id : undefined,
      projectID: Number(this.event.projectID),
      activityTypeID: this.event.activityTypeID,
      hoursQuantity: Number(this.event.hours || 4),
      activityDate: this.event.activityDate,
      activityDescription: this.event.activityDescription,
      requirementCode: this.event.requirementCode,
      notes: this.event.details || ''
    };
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

          // Si ya tenemos los proyectos pero no se ha establecido el default
          if (this.projects.length > 0 && !this.data.isEdit && !this.event.projectID) {
            this.setDefaultProject();
          }
        },
        error: (err: any) => {
          console.error('Error al cargar tipos de actividad', err);
          this.setDefaultActivityTypes();

          // Mismo caso aquí
          if (this.projects.length > 0 && !this.data.isEdit && !this.event.projectID) {
            this.setDefaultProject();
          }
        }
      });
    } else {
      // Si los tipos ya están cargados pero necesitamos establecer proyecto default
      if (this.projects.length > 0 && !this.data.isEdit && !this.event.projectID) {
        this.setDefaultProject();
      }
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
        this.setDefaultProject(); // ← Añade esta línea
      });
    } else if (this.currentEmployeeId) {
      this.projectService.getProjectsByEmployee(this.currentEmployeeId, {
        PageNumber: 1,
        PageSize: 100,
        search: ''
      }).subscribe((response: any) => {
        this.projects = response.items || [];
        this.setDefaultProject(); // ← Añade esta línea
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
    // Si es recurrente, devolver array de actividades
    if (this.isRecurring) {
      return this.prepareRecurrencePayload();
    } else {
      // Si no es recurrente, devolver actividad única
      return this.prepareSinglePayload();
    }
  }

  validateHours(): void {
    // Si el valor está vacío o no es un número, establecer como null
    if (this.event.hours === '' || isNaN(Number(this.event.hours))) {
      this.event.hours = null;
      return;
    }

    const hours = Number(this.event.hours);

    // Forzar valores entre 0.5 y 8
    if (hours < 0.5) {
      this.event.hours = 0.5;
    } else if (hours > 8) {
      this.event.hours = 8;
    } else {
      this.event.hours = hours;
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

  trimDescription(): void {
    if (this.event.activityDescription && this.event.activityDescription.length > 200) {
      this.event.activityDescription = this.event.activityDescription.substring(0, 200);
    }
  }

  async onDelete(): Promise<void> {
    const confirmDialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '600px',
      data: {
        title: 'Confirmar eliminación',
        message: '¿Estás seguro de que deseas eliminar esta actividad?',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      }
    });

    const result = await confirmDialogRef.afterClosed().toPromise();

    if (result) {
      this.activityService.deleteActivity(this.event.id).subscribe({
        next: () => {
          this.snackBar.open('Actividad eliminada correctamente', 'Cerrar', { duration: 3000 });
          this.dialogRef.close({ deleted: true });
        },
        error: (error) => {
          console.error('Error al eliminar actividad', error);

          // Mostrar mensaje de error específico si la actividad está aprobada
          if (error.error?.Code === 400 && error.error.Message.includes('aprobada')) {
            this.showErrorDialog(error.error.Message);
          } else {
            this.snackBar.open('Error al eliminar actividad', 'Cerrar', { duration: 3000 });
          }
        }
      });
    }
  }

  private showErrorDialog(errorMessage: string): void {
    this.dialog.open(ConfirmDialogComponent, {
      width: '600px',
      data: {
        title: 'No se puede modificar la actividad',
        message: errorMessage,
        confirmText: 'Aceptar',
        cancelText: null // Esto ocultará el botón de cancelar
      }
    });
  }

  // Modificar isFormValid para incluir validación de recurrencia
  isFormValid(): boolean {
    // Validaciones básicas existentes
    if (!this.event.activityTypeID ||
        !this.event.projectID ||
        !this.event.activityDescription ||
        !this.event.activityDate) {
      return false;
    }

    const hours = Number(this.event.hours);
    if (isNaN(hours) || hours < 0.5 || hours > 8) {
      return false;
    }

    if (this.event.activityDescription.length > 200) {
      return false;
    }

    // Validaciones específicas para recurrencia
    if (this.isRecurring) {
      if (!this.recurrenceStartDate || !this.recurrenceEndDate) {
        return false;
      }

      if (this.recurrenceStartDate > this.recurrenceEndDate) {
        return false;
      }

      if (this.recurrenceDaysCount === 0) {
        return false;
      }

      // Advertencia si se crean muchas actividades
      if (this.recurrenceDaysCount > 30) {
        // Podrías mostrar una advertencia pero no impedir el envío
        console.warn(`Se crearán ${this.recurrenceDaysCount} actividades, esto puede tomar un tiempo`);
      }
    }

    // Para actividades no recurrentes, validar horas por día
    if (!this.isRecurring || this.data.isEdit) {
      let currentHoursForDay = 0;
      const selectedDate = this.formatDate(this.event.activityDate);
      const currentHours = this.getCurrentHoursExcludingSelf();

      if (this.data.currentCalendarEvents) {
        this.data.currentCalendarEvents.forEach((event: any) => {
          const eventStartDate = this.formatDate(event.start);
          if (eventStartDate === selectedDate && event.id !== this.event.id) {
            currentHoursForDay += event.extendedProps?.hoursQuantity || 0;
          }
        });
      }

      const proposedHours = Number(this.event.hours);
      if ((currentHoursForDay + proposedHours) > 8 && !this.data.isEdit) {
        return false;
      }
    }

    return true;
  }

  onHoursKeyPress(event: KeyboardEvent): void {
    const allowedChars = /[0-9.]/;
    const inputChar = String.fromCharCode(event.charCode);

    // Permitir números, punto y teclas de control
    if (!allowedChars.test(inputChar) && event.charCode !== 0) {
      event.preventDefault();
    }

    // Si es un punto, verificar que no haya ya un punto
    if (inputChar === '.') {
      const currentValue = (event.target as HTMLInputElement).value;
      if (currentValue.includes('.')) {
        event.preventDefault();
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
