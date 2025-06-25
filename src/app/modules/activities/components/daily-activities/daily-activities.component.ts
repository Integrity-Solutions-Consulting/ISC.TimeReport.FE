import { Component , signal, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule, FullCalendarComponent } from '@fullcalendar/angular';
import { CalendarOptions, DateSelectArg, EventClickArg, EventApi } from '@fullcalendar/core';
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import { INITIAL_EVENTS, createEventId } from './event-utils';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { EventDialogComponent } from '../event-dialog/event-dialog.component';

@Component({
  selector: 'daily-activities',
  standalone: true,
  imports: [
    CommonModule,
    FullCalendarModule,
    MatDialogModule,
    MatButtonModule,
  ],
  templateUrl: './daily-activities.component.html',
  styleUrl: './daily-activities.component.scss'
})
export class DailyActivitiesComponent {
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
    initialView: 'dayGridMonth',
    initialEvents: INITIAL_EVENTS, // alternatively, use the `events` setting to fetch from a feed
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
        click: this.handleAddActivity
      }
    }
    /* you can update a remote database when these fire:
    eventAdd:
    eventChange:
    eventRemove:
    */
  });
  currentEvents = signal<EventApi[]>([]);

  constructor(
    private changeDetector: ChangeDetectorRef,
    private dialog: MatDialog
  ) {}

  handleDateSelect(selectInfo: DateSelectArg) {
    const dialogRef = this.dialog.open(EventDialogComponent, {
      width: '500px',
      data: {
        event: {
          activityDate: selectInfo.start,
          fullDay: 'full',
          hours: 4,
          color: '#4285F4' // Color por defecto
        },
        isEdit: false
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        selectInfo.view.calendar.unselect();
        this.createEventWithColor(selectInfo.view.calendar, result);
      }
    });
  }

  handleAddActivity() {
    const dialogRef = this.dialog.open(EventDialogComponent, {
      width: '400px',
      data: {
        event: {},
        isEdit: false
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const calendarApi = this.calendarComponent.getApi();
        calendarApi.addEvent({
          id: createEventId(),
          title: result.title,
          start: result.start || new Date().toISOString(),
          end: result.end,
          allDay: result.allDay,
        });
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

    return calendarApi.addEvent({
      id: createEventId(),
      title: `${eventData.activityType} - ${eventData.project}`,
      start: eventData.activityDate,
      end: eventData.fullDay === 'full' ?
        eventData.activityDate :
        new Date(eventData.activityDate.getTime() + eventData.hours * 60 * 60 * 1000),
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

  handleEventClick(clickInfo: EventClickArg) {
    const dialogRef = this.dialog.open(EventDialogComponent, {
      width: '500px',
      data: {
        event: {
          activityType: clickInfo.event.extendedProps['activityType'] || 'Desarrollo',
          project: clickInfo.event.title.split(' - ')[1] || 'ISC-FS-2025',
          details: clickInfo.event.extendedProps['details'],
          activityDate: clickInfo.event.start || new Date(),
          fullDay: clickInfo.event.extendedProps['fullDay'] || 'full',
          hours: clickInfo.event.extendedProps['hours'] || 4,
          color: clickInfo.event.backgroundColor || '#4285F4'
        },
        isEdit: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        clickInfo.event.setProp('title', `${result.activityType} - ${result.project}`);
        clickInfo.event.setStart(result.activityDate);
        clickInfo.event.setEnd(result.fullDay === 'full' ?
          result.activityDate :
          new Date(result.activityDate.getTime() + result.hours * 60 * 60 * 1000));

        this.applyEventColors(clickInfo.event, result.color);

        clickInfo.event.setExtendedProp('details', result.details);
        clickInfo.event.setExtendedProp('hours', result.hours);
        clickInfo.event.setExtendedProp('fullDay', result.fullDay);
        clickInfo.event.setExtendedProp('activityType', result.activityType);
      }
    });
  }

  private lightenColor(color: string, factor: number): string {
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

  private getTextColor(bgColor: string): string {
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
