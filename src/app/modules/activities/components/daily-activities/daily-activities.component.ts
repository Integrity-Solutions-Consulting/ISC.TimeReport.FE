import { Component , signal, ChangeDetectorRef, ViewChild, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule, FullCalendarComponent } from '@fullcalendar/angular';
import { CalendarOptions, DateSelectArg, EventClickArg, EventApi } from '@fullcalendar/core';
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { EventDialogComponent } from '../event-dialog/event-dialog.component';
import { ActivityService } from '../../services/activity.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { Project, ProjectWithID } from '../../../projects/interfaces/project.interface';
import { ProjectService } from '../../../projects/services/project.service';
import { Activity, ActivityType, Holiday } from '../../interfaces/activity.interface';
import { Observable, take, map, catchError, throwError, of, Subscription } from 'rxjs';
import { ApiResponse } from '../../interfaces/activity.interface';
import { ReportDialogComponent } from '../report-dialog/report-dialog.component';
import { AuthService } from '../../../auth/services/auth.service';
import { provideNativeDateAdapter, DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter, MomentDateModule } from '@angular/material-moment-adapter';

@Component({
  selector: 'daily-activities',
  standalone: true,
  imports: [
    CommonModule,
    FullCalendarModule,
    MatDialogModule,
    MatButtonModule,
    MatSnackBarModule,
    RouterModule
  ],
  providers: [
    ActivityService,
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
  templateUrl: './daily-activities.component.html',
  styleUrl: './daily-activities.component.scss'
})
export class DailyActivitiesComponent implements AfterViewInit, OnDestroy {
  currentEmployeeId: number | null = null;
  projectList: ProjectWithID[] = [];
  activityTypes: ActivityType[] = [];
  holidays: Holiday[] = [];
  private subscriptions: Subscription = new Subscription();
  isLoadingProjects = false;
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;
  private calendar: any;

  private isHoliday(date: Date): boolean {
    const dateString = date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    return this.holidays.some(holiday => holiday.holidayDate === dateString);
  }

  calendarOptions = signal<CalendarOptions>({
    plugins: [
      interactionPlugin,
      dayGridPlugin,
      timeGridPlugin,
      listPlugin,
    ],
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'generateReport addActivity'
    },
    locale: 'es',
    initialView: 'dayGridMonth', // alternatively, use the `events` setting to fetch from a feed
    weekends: true,
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    dayMaxEventRows: 3,
    fixedWeekCount: false,
    select: this.handleDateSelect.bind(this),
    eventClick: this.handleEventClick.bind(this),
    eventsSet: this.handleEvents.bind(this),
    customButtons: {
      addActivity: {
        text: 'Agregar Actividad',
        click: this.handleAddActivity.bind(this)
      },
      generateReport: {
        text: 'Generar Reporte',
        click: this.handleGenerateReport.bind(this)
      }
    },
    eventDidMount: (info) => {
      // Aplicar colores personalizados aquí, no en mapActivitiesToEvents
      const eventColor = info.event.backgroundColor;
      if (eventColor) {
        info.el.style.backgroundColor = this.lightenColor(eventColor, 0.3);
        info.el.style.borderColor = eventColor;
        info.el.style.color = this.getTextColor(eventColor);
      }
    },
    eventChange: this.handleEventChange.bind(this),

    dayCellDidMount: (info) => {
      if (this.isHoliday(info.date)) {
        info.el.classList.add('fc-holiday');
        info.el.style.backgroundColor = '#fde4e8ff'; // Fondo rojo claro
        info.el.style.cursor = 'not-allowed';
      }
    },
    // Añade esta propiedad para validar selecciones
    selectAllow: (selectInfo) => {
      return !this.isHoliday(selectInfo.start);
    }
  });
  currentEvents = signal<EventApi[]>([]);

  constructor(
    private changeDetector: ChangeDetectorRef,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
    private activityService: ActivityService,
    private projectService: ProjectService,
    private authService: AuthService,
  ) {
    const userData = this.getUserData();
    this.currentEmployeeId = this.getEmployeeId();
  }

  ngAfterViewInit(): void {
    this.loadActivityTypes();
    this.loadHolidays();
    this.loadProjects().pipe(take(1)).subscribe(() => {
      this.loadInitialData();
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private loadActivityTypes(): void {
    const activityTypesSub = this.activityService.getActivityTypes().subscribe({
      next: (types) => {
        this.activityTypes = types;
      },
      error: (error) => {
        console.error('Error al cargar tipos de actividad:', error);
        // Puedes mantener un fallback si es necesario
        this.activityTypes = this.getDefaultActivityTypes();
      }
    });
    this.subscriptions.add(activityTypesSub);
  }

  private getDefaultActivityTypes(): ActivityType[] {
    // Fallback por si falla la carga desde el servidor
    return [
      { id: 1, name: 'Desarrollo', description: 'Programación y desarrollo de software', colorCode: '#2E8B57' },
      { id: 2, name: 'Reunión', description: 'Reuniones con clientes y equipo', colorCode: '#4169E1' },
      { id: 3, name: 'Análisis', description: 'Análisis de requerimientos y diseño', colorCode: '#FF6347' },
      { id: 4, name: 'Testing', description: 'Pruebas y control de calidad', colorCode: '#9370DB' },
      { id: 5, name: 'Documentación', description: 'Creación de documentación', colorCode: '#DAA520' },
      { id: 6, name: 'Soporte', description: 'Soporte técnico y mantenimiento', colorCode: '#DC143C' },
      { id: 7, name: 'Capacitación', description: 'Entrenamiento y capacitación', colorCode: '#008B8B' },
      { id: 1002, name: 'Auditoria', description: 'Auditoria Informática', colorCode: '#518B00' }
    ];
  }

  private getUserData(): any {
    // Intenta obtener de localStorage
    const storedData = localStorage.getItem('userData');
    if (storedData) {
      try {
        return JSON.parse(storedData).data;
      } catch (e) {
        console.error('Error parsing userData', e);
      }
    }
    return null;
  }

  private getEmployeeId(): number | null {
    // Opción 1: Desde localStorage directamente
    const employeeId = localStorage.getItem('employeeID');
    if (employeeId) return parseInt(employeeId, 10);

    // Opción 2: Desde el objeto user en localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.employeeID || null;
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }

    // Opción 3: Desde el AuthService (si tiene un método)
    return this.authService.getCurrentEmployeeId();
  }

  private loadHolidays(): void {
    const holidaysSub = this.activityService.getAllHolidays().subscribe({
      next: (response) => {
        this.holidays = response.data;
        // Forzar re-render del calendario para aplicar estilos de feriados
        if (this.calendarComponent && this.calendarComponent.getApi()) {
          this.calendarComponent.getApi().render();
        }
      },
      error: (error) => {
        console.error('Error al cargar feriados:', error);
        this.snackBar.open('Error al cargar días feriados', 'Cerrar', { duration: 3000 });
      }
    });
    this.subscriptions.add(holidaysSub);
  }

  private async loadInitialData(): Promise<void> {
    await this.loadActivities();
  }

  loadProjects(): Observable<Project[]> {
    this.isLoadingProjects = true;

    if (!this.currentEmployeeId) {
      console.warn('No hay employeeID disponible');
      return of([]);
    }

    return this.projectService.getFilteredProjects(this.currentEmployeeId).pipe(
      map(response => {
        this.projectList = response.items || [];
        this.isLoadingProjects = false;
        return this.projectList;
      }),
      catchError(error => {
        console.error('Error loading projects:', error);
        this.isLoadingProjects = false;
        return throwError(() => new Error('Error al cargar proyectos'));
      })
    );
  }

  private async loadActivities(retryCount = 0): Promise<void> {
    try {
      const response: ApiResponse | undefined = await this.activityService.getActivities().toPromise();

      if (response?.data) {

        // Filtrar actividades solo para el empleado logueado
        const filteredActivities = response.data.filter((activity: Activity) => {
          if (this.currentEmployeeId === null) {
            console.warn('EmployeeID es null - mostrando todas las actividades');
            return true; // Mostrar todas si no hay employeeID
          }
          return activity.employeeID === this.currentEmployeeId;
        });

        if (this.calendarComponent && this.calendarComponent.getApi()) {
          this.mapActivitiesToEvents(filteredActivities);
        } else if (retryCount < 5) {
          setTimeout(() => this.loadActivities(retryCount + 1), 500);
        } else {
          console.error('CalendarComponent no disponible después de múltiples intentos');
          this.snackBar.open('No se pudo cargar el calendario. Intente recargar la página.', 'Cerrar');
        }
      }
    } catch (error) {
      console.error('Error loading activities', error);
      if (error === 401) {
        this.snackBar.open('Sesión inválida. Por favor, inicie sesión nuevamente.', 'Cerrar');
        this.router.navigate(['/login']);
      } else {
        this.snackBar.open('Error al cargar actividades.', 'Cerrar', { duration: 3000 });
      }
    }
  }

  private mapActivitiesToEvents(activities: Activity[]): void {
    const calendarApi = this.calendarComponent.getApi();
    calendarApi.removeAllEvents();

    activities.forEach(activity => {
      try {
        const startDate = this.parseActivityDate(activity.activityDate);
        const hoursQuantity = activity.hoursQuantity;
        const allDayEvent = hoursQuantity === 8;
        let endDate: Date | undefined = undefined;

        if (!allDayEvent) {
          const startDateTime = new Date(startDate);
          endDate = new Date(startDateTime.getTime() + hoursQuantity * 60 * 60 * 1000);
        }

        const project = this.projectList.find(p => p.id === activity.projectID);
        const activityType = this.activityTypes.find(t => t.id === activity.activityTypeID);
        const color = activityType?.colorCode || '#9E9E9E';
        const rawTitle = `${activity.requirementCode} - ${project?.name || 'Sin proyecto'}`;
        const truncatedTitle = rawTitle.length > 30 ? rawTitle.substring(0, 16) + '...' : rawTitle;

        const eventData = {
          id: activity.id.toString(),
          title: truncatedTitle,
          start: startDate,
          end: endDate,
          allDay: allDayEvent,
          backgroundColor: color,
          borderColor: color,
          textColor: this.getTextColor(color),
          extendedProps: {
            activityTypeID: activity.activityTypeID,
            projectID: activity.projectID,
            activityDescription: activity.activityDescription,
            notes: activity.notes,
            hoursQuantity: activity.hoursQuantity,
            requirementCode: activity.requirementCode,
            employeeID: activity.employeeID // Añadir esto para debug
          }
        };

        const addedEvent = calendarApi.addEvent(eventData);
      } catch (error) {
        console.error(`Error procesando actividad ${activity.id}:`, activity, error);
      }
    });
    calendarApi.render();
  }

  private parseActivityDate(dateInput: string | Date): Date {
    if (dateInput instanceof Date) {
      return dateInput;
    }

    // Asegúrate de que el formato sea correcto
    if (typeof dateInput === 'string') {
      // Intenta con formato ISO (YYYY-MM-DD)
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        const parts = dateInput.split('-').map(Number);
        return new Date(parts[0], parts[1] - 1, parts[2]);
      }
      // Intenta parsear como fecha ISO completa
      const parsedDate = new Date(dateInput);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }

    console.warn('Formato de fecha no reconocido, usando fecha actual', dateInput);
    return new Date();
  }

  private getActivityColor(activity: any): string {
    if (!activity.status) return '#FF0000'; // Rojo para actividades no aprobadas
    if (activity.isBillable) return '#4285F4'; // Azul para billables
    return '#34A853'; // Verde para no billables aprobadas
  }

  handleDateSelect(selectInfo: DateSelectArg) {

    if (this.isHoliday(selectInfo.start)) {
      this.snackBar.open('No se pueden crear actividades en días feriados', 'Cerrar', { duration: 3000 });
      return;
    }

    if (!this.currentEmployeeId) {
      this.snackBar.open('No se pudo identificar al empleado', 'Cerrar');
      return;
    }
    this.projectService.getProjectsByUserRole(this.currentEmployeeId ?? undefined).subscribe({
      next: (projectsResponse) => {
        const dialogRef = this.dialog.open(EventDialogComponent, {
          width: '800px',
          data: {
            event: {
              activityDate: selectInfo.start,
              fullDay: true,
              hours: 8,
              activityTypeID: 1,
              projectID: null,
              activityDescription: '',
              details: null,
              requirementCode: ''
            },
            isEdit: false,
            projects: projectsResponse.items,
            activityTypes: this.activityTypes
          }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.createActivity({
              ...result,
              projectID: result.projectID,
              employeeID: this.currentEmployeeId
            });
          }
        });
      },
      error: (error) => {
        console.error('Error loading projects for dialog', error);
        this.snackBar.open('Error al cargar proyectos', 'Cerrar', { duration: 3000 });
      }
    });
  }

  handleAddActivity() {

    if (this.isHoliday(new Date())) {
      this.snackBar.open('No se pueden crear actividades en días feriados', 'Cerrar', { duration: 3000 });
      return;
    }

    if (!this.currentEmployeeId) {
      this.snackBar.open('No se pudo identificar al empleado', 'Cerrar');
      return;
    }

    this.projectService.getProjectsByUserRole(this.currentEmployeeId ?? undefined).subscribe({
      next: (projectsResponse) => {
        const dialogRef = this.dialog.open(EventDialogComponent, {
          width: '800px',
          data: {
            event: {
              activityDate: new Date(),
              fullDay: true,
              hours: 8,
              activityTypeID: 1,
              projectID: null,
              activityDescription: '',
              details: '',
              requirementCode: ''
            },
            isEdit: false,
            projects: projectsResponse.items,
            activityTypes: this.activityTypes
          }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.createActivity({
              ...result,
              projectID: result.projectID,
              employeeID: this.currentEmployeeId // Asegúrate de incluir esto
            });
          }
        });
      },
      error: (error) => {
        console.error('Error loading projects for dialog', error);
        this.snackBar.open('Error al cargar proyectos', 'Cerrar', { duration: 3000 });
      }
    });
  }

  handleGenerateReport() {
    const dialogRef = this.dialog.open(ReportDialogComponent, {
      width: '500px',
      data: {

      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
      }
    });
  }


  private createActivity(eventData: any): void {
    if (!eventData.hoursQuantity && !eventData.activityDate) {
      console.error('Datos incompletos:', eventData);
      this.snackBar.open('Datos incompletos en la actividad', 'Cerrar');
      return;
    }

    const activityDate = this.ensureDateObject(eventData.activityDate);
    if (this.isHoliday(activityDate)) {
      this.snackBar.open('No se pueden crear actividades en días feriados', 'Cerrar', { duration: 3000 });
      return;
    }

    const activityPayload = {
      projectID: eventData.projectID,
      activityTypeID: eventData.activityTypeID,
      hoursQuantity: eventData.hoursQuantity,
      activityDate: eventData.activityDate,
      activityDescription: eventData.activityDescription,
      requirementCode: eventData.requirementCode,
      notes: eventData.notes || '',
      employeeID: this.currentEmployeeId // Asegúrate de incluir el employeeID
    };

    this.activityService.createActivity(activityPayload).subscribe({
      next: (response) => {
        this.snackBar.open('Actividad creada correctamente', 'Cerrar', { duration: 3000 });
        this.loadActivities();
      },
      error: (error) => {
        if (error.status === 401) {
          this.snackBar.open('Sesión inválida. Por favor vuelva a iniciar sesión', 'Cerrar');
          this.router.navigate(['/login']);
        } else {
          console.error('Error al crear actividad:', error);
          this.snackBar.open('Error al crear actividad: ' + (error.error?.message || error.message || 'Error desconocido'), 'Cerrar');
        }
      }
    });
  }

  private isAdminUser(): boolean {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const roles = userData.data?.roles || [];
    return roles.some((role: any) => role.id === 1 && role.roleName === "Administrador");
  }

  private applyEventColors(eventApi: EventApi, color: string): void {
    const bgColor = this.lightenColor(color, 0.85); // Fondo más claro
    const textColor = this.getTextColor(color); // Texto contrastante

    eventApi.setProp('color', color);
    eventApi.setProp('backgroundColor', bgColor);
    eventApi.setProp('textColor', textColor);
    eventApi.setProp('borderColor', color);
  }

  private createEventWithColor(calendarApi: any, eventData: any): EventApi {
    const bgColor = this.lightenColor(eventData.color, 0.85);
    const textColor = this.getTextColor(eventData.color);

    const baseColor = eventData.color || this.getColorForActivityType(eventData.activityTypeID) || '#4285F4';

    const activityDate = this.ensureDateObject(eventData.activityDate);
    // Mapea los datos del formulario al formato del endpoint
    const activityPayload = {
      projectID: eventData.projectID, // Necesitarás implementar esta función
      activityTypeID: this.getActivityTypeId(eventData.activityTypeID), // Necesitarás implementar esta función
      hoursQuantity: eventData.fullDay === 'full' ? 8 : eventData.hours, // Asume 8 horas para día completo
      activityDate: activityDate.toISOString().split('T')[0], // Formato YYYY-MM-DD
      activityDescription: eventData.activityDescription,
      notes: eventData.details || '',
      requirementCode: eventData.requirementCode
    };

    // Llama al servicio para guardar en el backend
    this.activityService.createActivity(activityPayload).subscribe({
      next: (response) => {
        this.loadActivities();
        this.snackBar.open('Actividad creada correctamente', 'Cerrar', { duration: 3000 });
      },
      error: (error) => {
        if (error.status === 401) {
          this.snackBar.open('Sesión inválida. Por favor vuelva a iniciar sesión', 'Cerrar');
          this.router.navigate(['/login']);
        } else {
          this.snackBar.open('Error al crear actividad: ' + error.error?.message, 'Cerrar');
        }
      }
    });

    return calendarApi.addEvent({
      title: `${eventData.activityType} - ${eventData.project}`,
      start: activityDate, // Usa la fecha convertida
      end: eventData.fullDay === 'full' ?
        activityDate :
        new Date(activityDate.getTime() + eventData.hours * 60 * 60 * 1000),
      color: eventData.color,
      backgroundColor: bgColor,
      textColor: textColor,
      borderColor: eventData.color,
      extendedProps: {
        details: eventData.details,
        hours: eventData.hours,
        fullDay: eventData.fullDay,
        activityType: eventData.activityType
      }
    });
  }

  private getColorForActivityType(activityTypeId: number | undefined): string {
    // Mapeo de colores para cada tipo de actividad
    const activityTypeColors: {[key: number]: string} = {
      1: '#4285F4', // Desarrollo - Azul
      2: '#EA4335', // Reunión - Rojo
      3: '#FBBC05', // Análisis - Amarillo
      4: '#34A853', // Revisión - Verde
      5: '#673AB7', // Documentación - Morado
      6: '#FF9800', // Soporte - Naranja
      7: '#00BCD4'  // Capacitación - Cyan
    };

    // Si el ID es undefined o no está en el mapeo, devuelve un color por defecto
    if (activityTypeId === undefined || !activityTypeColors[activityTypeId]) {
      return '#9E9E9E'; // Gris por defecto
    }

    return activityTypeColors[activityTypeId];
  }

  private ensureDateObject(date: any): Date {
    if (date instanceof Date) {
      return date;
    }

    if (typeof date === 'string') {
      return new Date(date);
    }

    if (date && date.toDate) { // Para objetos como firebase Timestamp
      return date.toDate();
    }

    console.warn('Formato de fecha no reconocido, usando fecha actual', date);
    return new Date(); // Fallback
  }

  getProjectId(projectName: string): number {
    const project = this.projectList.find(p => p.name === projectName);
    return project?.id ?? 0;
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

  // --- Manejo del click en un evento existente para editar ---
  handleEventClick(clickInfo: EventClickArg) {
    const extendedProps = clickInfo.event.extendedProps;

    const dialogRef = this.dialog.open(EventDialogComponent, {
      width: '800px',
      data: {
        event: {
          id: clickInfo.event.id,
          activityTypeID: extendedProps['activityTypeID'],
          projectID: extendedProps['projectID'],
          activityDescription: extendedProps['activityDescription'],
          details: extendedProps['notes'],
          activityDate: clickInfo.event.start || new Date(), // Usar la fecha de inicio del evento
          // Aseguramos que fullDay se mapee correctamente
          fullDay: extendedProps['hoursQuantity'] === 8,
          hours: extendedProps['hoursQuantity'],
          requirementCode: extendedProps['requirementCode']
        },
        isEdit: true,
        projects: this.projectList,
        activityTypes: this.activityTypes,
        currentCalendarEvents: this.currentEvents()
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const updateData = {
          projectID: result.projectID,
          activityTypeID: result.activityTypeID,
          hoursQuantity: result.hoursQuantity, // Mapea fullDay a hoursQuantity
          activityDate: result.activityDate,
          activityDescription: result.activityDescription,
          notes: result.details,
          requirementCode: result.requirementCode
        };

        this.activityService.updateActivity(Number(result.id), updateData).subscribe({
          next: () => {
            this.snackBar.open('Actividad actualizada correctamente', 'Cerrar', { duration: 3000 });
            this.loadActivities(); // Recargar actividades después de actualizar
          },
          error: (error) => {
            console.error('Error al actualizar actividad', error);
            if (error.status === 401) {
              this.snackBar.open('Sesión inválida. Por favor, inicie sesión nuevamente.', 'Cerrar');
              this.router.navigate(['/login']);
            } else {
              this.snackBar.open('Error al actualizar actividad: ' + (error.error?.message || error.message || 'Error desconocido'), 'Cerrar');
            }
          }
        });
      }
    });
  }

  handleEventChange(changeInfo: any): void {
    const event = changeInfo.event;

    if (this.isHoliday(event.start)) {
      this.snackBar.open('No se pueden mover actividades a días feriados', 'Cerrar', { duration: 3000 });
      changeInfo.revert(); // Revertir el cambio
      return;
    }

    const extendedProps = event.extendedProps;

    const updatedData = {
      projectID: extendedProps['projectID'],
      activityTypeID: extendedProps['activityTypeID'],
      hoursQuantity: event.allDay ? 8 : (event.end ? (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60) : extendedProps['hoursQuantity']),
      activityDate: this.formatDate(event.start),
      activityDescription: extendedProps['activityDescription'],
      notes: extendedProps['notes'],
      requirementCode: extendedProps['requirementCode'],
      employeeID: this.currentEmployeeId // Asegúrate de incluir el employeeID
    };

    this.activityService.updateActivity(Number(event.id), updatedData).subscribe({
      next: () => {
        this.snackBar.open('Actividad actualizada correctamente (arrastre/redimensionado)', 'Cerrar', { duration: 2000 });
        this.loadActivities();
      },
      error: (error) => {
        console.error('Error al actualizar actividad por arrastre/redimensionado', error);
        changeInfo.revert();
        this.snackBar.open('Error al actualizar actividad por arrastre/redimensionado', 'Cerrar', { duration: 3000 });
      }
    });
  }

  private formatDate(dateInput: any): string {
      // Si es undefined o null, devuelve la fecha actual
      if (!dateInput) {
          return new Date().toISOString().split('T')[0];
      }

      // Si ya es un objeto Date, formatea directamente
      if (dateInput instanceof Date) {
          return dateInput.toISOString().split('T')[0];
      }

      // Si es un string en formato ISO (YYYY-MM-DD)
      if (typeof dateInput === 'string') {
          // Si ya está en el formato correcto, devuélvelo directamente
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
              return dateInput;
          }
          // Si es un string ISO con tiempo, extrae solo la parte de la fecha
          if (dateInput.includes('T')) {
              return dateInput.split('T')[0];
          }
          // Intenta parsear otros formatos de string
          const parsedDate = new Date(dateInput);
          if (!isNaN(parsedDate.getTime())) {
              return parsedDate.toISOString().split('T')[0];
          }
      }

      // Si es un timestamp numérico
      if (typeof dateInput === 'number') {
          return new Date(dateInput).toISOString().split('T')[0];
      }

      // Si no reconocemos el formato, usamos la fecha actual como fallback
      console.warn('Formato de fecha no reconocido:', dateInput);
      return new Date().toISOString().split('T')[0];
  }

  private lightenColor(color: string | undefined, factor: number): string {
    // Si no hay color, devuelve un color por defecto aclarado
    if (!color) return '#e6f2ff'; // Azul muy claro por defecto

    // Si el color no empieza con #, añádelo
    if (!color.startsWith('#')) {
      color = `#${color}`;
    }

    // Asegúrate que el color tenga el formato correcto (3 o 6 caracteres)
    if (color.length === 4) { // #RGB
      color = `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
    } else if (color.length !== 7) { // #RRGGBB
      return '#e6f2ff'; // Color por defecto si el formato no es válido
    }

    // Convierte HEX a RGB
    const r = parseInt(color.substring(1, 3), 16);
    const g = parseInt(color.substring(3, 5), 16);
    const b = parseInt(color.substring(5, 7), 16);

    // Aclara cada componente
    const lightenedR = Math.round(r + (255 - r) * factor);
    const lightenedG = Math.round(g + (255 - g) * factor);
    const lightenedB = Math.round(b + (255 - b) * factor);

    // Convierte de vuelta a HEX
    return `#${lightenedR.toString(16).padStart(2, '0')}${lightenedG.toString(16).padStart(2, '0')}${lightenedB.toString(16).padStart(2, '0')}`;
  }

  private getTextColor(bgColor: string | undefined): string {
  if (!bgColor) return '#000000'; // Negro por defecto si no hay color

    // Asegura que el color empiece con #
    if (!bgColor.startsWith('#')) {
      bgColor = `#${bgColor}`;
    }

    // Convierte HEX a RGB
    const r = parseInt(bgColor.substring(1, 3), 16);
    const g = parseInt(bgColor.substring(3, 5), 16);
    const b = parseInt(bgColor.substring(5, 7), 16);

    // Calcula luminosidad
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Retorna blanco o negro según contraste
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  }

  handleEvents(events: EventApi[]) {
    this.currentEvents.set(events);
    this.changeDetector.detectChanges(); // workaround for pressionChangedAfterItHasBeenCheckedError
  }
}
