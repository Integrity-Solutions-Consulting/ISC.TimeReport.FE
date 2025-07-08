import { Component , signal, ChangeDetectorRef, ViewChild, OnInit, AfterViewInit } from '@angular/core';
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
import { Project } from '../../../projects/interfaces/project.interface';
import { ProjectService } from '../../../projects/services/project.service';
import { Activity } from '../../interfaces/activity.interface';
import { Observable, take, map, catchError, throwError } from 'rxjs';
import { ApiResponse } from '../../interfaces/activity.interface';

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
    ActivityService
  ],
  templateUrl: './daily-activities.component.html',
  styleUrl: './daily-activities.component.scss'
})
export class DailyActivitiesComponent implements AfterViewInit {
  projectList: Project[] = [];
  activityColors = [
    { id: 1, value: '#2E8B57'},
    { id: 2, value: '#4169E1'},
    { id: 3, value: '#FF6347'},
    { id: 4, value: '#9370DB'},
    { id: 5, value: '#DAA520'},
    { id: 6, value: '#DC143C'},
    { id: 7, value: '#008B8B'},
  ];
  isLoadingProjects = false;
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;
  private calendar: any;
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
      right: 'addActivity'
    },
    locale: 'es',
    initialView: 'dayGridMonth', // alternatively, use the `events` setting to fetch from a feed
    weekends: false,
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    dayMaxEventRows: 3,
    select: this.handleDateSelect.bind(this),
    eventClick: this.handleEventClick.bind(this),
    eventsSet: this.handleEvents.bind(this),
    customButtons: {
      addActivity: {
        text: 'Agregar actividad',
        click: this.handleAddActivity.bind(this)
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
    eventChange: this.handleEventChange.bind(this)
    /* you can update a remote database when these fire:
    eventAdd:
    eventChange:
    eventRemove:
    */
  });
  currentEvents = signal<EventApi[]>([]);

  constructor(
    private changeDetector: ChangeDetectorRef,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
    private activityService: ActivityService,
    private projectService: ProjectService
  ) {}

  ngAfterViewInit(): void {
    this.loadProjects().pipe(take(1)).subscribe(() => {
      this.loadInitialData();
    });
  }

  private async loadInitialData(): Promise<void> {
    await this.loadActivities();
  }

  loadProjects(): Observable<Project[]> {
    this.isLoadingProjects = true;
    return this.projectService.getProjects().pipe(
      map(projects => {
        this.projectList = projects.items;
        this.isLoadingProjects = false;
        return projects.items;
      }),
      catchError(error => {
        console.error('Error loading projects', error);
        this.isLoadingProjects = false;
        return throwError(() => new Error('Error al cargar proyectos'));
      })
    );
  }

  private async loadActivities(retryCount = 0): Promise<void> {
    try {
      const response: ApiResponse | undefined = await this.activityService.getActivities().toPromise();
      console.log('Datos recibidos del backend:', response);

      if (response?.data) {
        // Asegúrate de que calendarComponent y su API estén disponibles
        if (this.calendarComponent && this.calendarComponent.getApi()) {
          this.mapActivitiesToEvents(response.data);
        } else if (retryCount < 5) { // Aumentar reintentos si es necesario
          setTimeout(() => this.loadActivities(retryCount + 1), 500); // Esperar un poco más
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
    calendarApi.removeAllEvents(); // Limpiar eventos existentes

    activities.forEach(activity => {
      try {
        const startDate = this.parseActivityDate(activity.activityDate);
        const hoursQuantity = activity.hoursQuantity;

        // Si hoursQuantity es 8, allDay es true y el evento dura todo el día.
        // Si no, es un evento de medio día.
        const allDayEvent = hoursQuantity === 8;
        let endDate: Date | undefined = undefined;

        if (!allDayEvent) {
          // Si no es un evento de día completo, calculamos la hora de finalización
          // Asumimos que si no es día completo, se está registrando por horas
          // Puedes ajustar la hora de inicio por defecto si es necesario, por ejemplo, 9 AM
          const startDateTime = new Date(startDate);
          // Puedes decidir si la hora de inicio por defecto para "medio día" es relevante
          // Por ahora, simplemente agregamos las horas a la fecha de inicio.
          endDate = new Date(startDateTime.getTime() + hoursQuantity * 60 * 60 * 1000);
        }

        const project = this.projectList.find(p => p.id === activity.projectID);
        const activityType = this.activityColors.find(t => t.id === activity.activityTypeID);
        const color = activityType?.value || '#9E9E9E'; // Color por defecto si no se encuentra

        console.log(`Actividad ID: ${activity.id}, activityTypeID: ${activity.activityTypeID}, activityType encontrado:`, activityType);

        const eventData = {
          id: activity.id.toString(),
          title: `${activity.activityDescription} - ${project?.name || 'Sin proyecto'}`,
          start: startDate,
          end: endDate, // Solo se establece 'end' si no es un evento de día completo
          allDay: allDayEvent,
          backgroundColor: color, // FullCalendar lo usará como color base
          borderColor: color,     // FullCalendar lo usará como color base
          textColor: this.getTextColor(color), // Asegura el color del texto contrastante
          extendedProps: {
            activityTypeID: activity.activityTypeID,
            projectID: activity.projectID,
            activityDescription: activity.activityDescription,
            notes: activity.notes,
            hoursQuantity: activity.hoursQuantity,
            isBillable: activity.isBillable,
            status: activity.status
          }
        };
        calendarApi.addEvent(eventData);
      } catch (error) {
        console.error(`Error procesando actividad ${activity.id}:`, activity, error);
      }
    });
    calendarApi.render(); // Asegura el renderizado
  }

  private parseActivityDate(dateInput: string | Date): Date {
    if (dateInput instanceof Date) {
      return dateInput;
    }
    // Asumiendo que dateInput es siempre 'YYYY-MM-DD' del backend
    const parts = dateInput.split('-').map(Number);
    // El constructor de Date usa el mes indexado desde 0 (enero es 0, junio es 5)
    // Esto crea una fecha en la zona horaria local a medianoche.
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  private getActivityColor(activity: any): string {
    if (!activity.status) return '#FF0000'; // Rojo para actividades no aprobadas
    if (activity.isBillable) return '#4285F4'; // Azul para billables
    return '#34A853'; // Verde para no billables aprobadas
  }

  handleDateSelect(selectInfo: DateSelectArg) {
    const dialogRef = this.dialog.open(EventDialogComponent, {
      width: '500px',
      data: {
        event: {
          activityDate: selectInfo.start, // Fecha de inicio de la selección
          // Valores por defecto para una nueva actividad
          fullDay: true, // Por defecto como día completo
          hours: 8,      // 8 horas por defecto
          activityTypeID: 1, // Puedes elegir un valor por defecto o dejarlo nulo para que el usuario elija
          projectId: null,
          activityDescription: '',
          details: ''
        },
        isEdit: false,
        projects: this.projectList, // Pasamos la lista de proyectos
        activityTypes: this.activityColors // Pasamos los tipos de actividad para el select
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        selectInfo.view.calendar.unselect(); // Deseleccionar la fecha en el calendario
        this.createActivity(result);
      }
    });
  }

  handleAddActivity() {
    const dialogRef = this.dialog.open(EventDialogComponent, {
      width: '500px',
      data: {
        event: {
          activityDate: new Date(), // Fecha actual por defecto
          fullDay: true,
          hours: 8,
          activityTypeID: 1,
          projectId: null,
          activityDescription: '',
          details: ''
        },
        isEdit: false,
        projects: this.projectList,
        activityTypes: this.activityColors
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createActivity(result);
      }
    });
  }

  private createActivity(eventData: any): void {
    const activityDate = this.ensureDateObject(eventData.activityDate);

    const activityPayload = {
      projectID: eventData.projectId,
      activityTypeID: eventData.activityTypeID,
      hoursQuantity: eventData.fullDay ? 8 : eventData.hours,
      activityDate: activityDate.toISOString().split('T')[0], // Formato YYYY-MM-DD
      activityDescription: eventData.activityDescription,
      notes: eventData.details,
      // Añade estos campos si son obligatorios en el backend
      isBillable: false, // Por defecto
      status: true       // Por defecto
    };

    this.activityService.createActivity(activityPayload).subscribe({
      next: (response) => {
        this.snackBar.open('Actividad creada correctamente', 'Cerrar', { duration: 3000 });
        this.loadActivities(); // Recargar el calendario
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
      projectID: eventData.projectId, // Necesitarás implementar esta función
      activityTypeID: this.getActivityTypeId(eventData.activityTypeID), // Necesitarás implementar esta función
      hoursQuantity: eventData.fullDay === 'full' ? 8 : eventData.hours, // Asume 8 horas para día completo
      activityDate: activityDate.toISOString().split('T')[0], // Formato YYYY-MM-DD
      activityDescription: eventData.activityDescription,
      notes: eventData.details
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
      width: '500px',
      data: {
        event: {
          id: clickInfo.event.id,
          activityTypeID: extendedProps['activityTypeID'],
          projectId: extendedProps['projectID'],
          activityDescription: extendedProps['activityDescription'],
          details: extendedProps['notes'],
          activityDate: clickInfo.event.start || new Date(), // Usar la fecha de inicio del evento
          // Aseguramos que fullDay se mapee correctamente
          fullDay: extendedProps['hoursQuantity'] === 8,
          hours: extendedProps['hoursQuantity'],
          isBillable: extendedProps['isBillable'],
          status: extendedProps['status']
        },
        isEdit: true,
        projects: this.projectList,
        activityTypes: this.activityColors
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const updateData = {
          projectID: result.projectId,
          activityTypeID: result.activityTypeID,
          hoursQuantity: result.fullDay ? 8 : result.hours, // Mapea fullDay a hoursQuantity
          activityDate: this.formatDate(result.activityDate),
          activityDescription: result.activityDescription,
          notes: result.details,
          isBillable: result.isBillable, // Asegúrate de pasar estos valores si se editan
          status: result.status
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
    // Aquí puedes implementar la lógica para actualizar la fecha/hora en el backend
    // cuando un evento es arrastrado o redimensionado.
    // changeInfo.event contiene el evento actualizado
    // changeInfo.oldEvent contiene el evento antes del cambio
    // changeInfo.revert() se puede usar para revertir el cambio si el backend falla.
    console.log('Event changed:', changeInfo.event);

    const event = changeInfo.event;
    const extendedProps = event.extendedProps;

    const updatedData = {
      projectID: extendedProps['projectID'],
      activityTypeID: extendedProps['activityTypeID'],
      hoursQuantity: event.allDay ? 8 : (event.end ? (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60) : extendedProps['hoursQuantity']),
      activityDate: this.formatDate(event.start),
      activityDescription: extendedProps['activityDescription'],
      notes: extendedProps['notes'],
      isBillable: extendedProps['isBillable'],
      status: extendedProps['status']
    };

    this.activityService.updateActivity(Number(event.id), updatedData).subscribe({
      next: () => {
        this.snackBar.open('Actividad actualizada correctamente (arrastre/redimensionado)', 'Cerrar', { duration: 2000 });
        this.loadActivities(); // Recargar para asegurar consistencia
      },
      error: (error) => {
        console.error('Error al actualizar actividad por arrastre/redimensionado', error);
        changeInfo.revert(); // Revertir el cambio en el calendario
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
