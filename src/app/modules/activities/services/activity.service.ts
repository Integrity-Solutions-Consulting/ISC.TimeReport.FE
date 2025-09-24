import { ProjectDetail } from './../../assigments/interfaces/assignment.interface';
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, forkJoin, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SuccessResponse } from '../../../shared/interfaces/response.interface';
import { Activity, ActivityType, ApiResponse, HolidaysResponse,} from '../interfaces/activity.interface';
import { AuthService } from '../../auth/services/auth.service';
import { ProjectService } from '../../projects/services/project.service';

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private projectService = inject(ProjectService);
  urlBase: string = environment.URL_BASE;

  getActivities(month?: number, year?: number): Observable<ApiResponse> {
    let params = new HttpParams();

    if (month !== undefined) {
      params = params.set('month', month.toString());
    }

    if (year !== undefined) {
      params = params.set('year', year.toString());
    }

    return this.http.get<ApiResponse>(`${this.urlBase}/api/DailyActivity/GetAllActivities`, { params }).pipe(
      tap(response => {
        console.log('Actividades obtenidas con parámetros:', { month, year });
      }),
      catchError(error => {
        console.error('Error obteniendo actividades:', error);
        return throwError(() => error);
      })
    );
  }

  getAllHolidays(): Observable<HolidaysResponse> {
    return this.http.get<HolidaysResponse>(`${this.urlBase}/api/Holiday/get-all-holiday`);
  }

  getDatedActivities(employeeId: number, filters?: { clientId?: number; dateFrom?: string; dateTo?: string }) {
    let params: any = { employeeId: employeeId.toString() };
    if (filters?.clientId) params.clientId = filters.clientId.toString();
    if (filters?.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters?.dateTo) params.dateTo = filters.dateTo;

    return this.http.get(`${this.urlBase}/api/DailyActivity/GetAllActivities`, { params });
  }

  createActivity(activityData: any): Observable<any> {
    // 1. Validación de campos requeridos (incluyendo projectID)
    if (!activityData?.projectID) {
      console.error('ProjectID faltante. Datos completos:', activityData);
      return throwError(() => new Error('Debes seleccionar un proyecto'));
    }

    // 2. Preparar el payload con la estructura exacta que espera el backend
    const payload = {
      projectID: Number(activityData.projectID), // Asegurar que es número
      activityTypeID: Number(activityData.activityTypeID),
      requirementCode: activityData.requirementCode || '',
      hoursQuantity: Number(activityData.hoursQuantity),
      activityDate: this.formatDate(activityData.activityDate), // Formato YYYY-MM-DD
      activityDescription: activityData.activityDescription,
      notes: activityData.notes || '',
      employeeID: Number(activityData.employeeID) // Añadir si es necesario
    };

    // 3. Configurar headers con el token de autenticación
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    // 4. Realizar la petición POST
    return this.http.post(`${this.urlBase}/api/DailyActivity/CreateActivity`, payload, { headers }).pipe(
      catchError(error => {
        console.error('Error en createActivity:', error);
        return throwError(() => error);
      })
    );
  }

  updateActivity(id: number, activityData: any): Observable<any> {
      const token = localStorage.getItem('token');

      const formattedData = {
        ...activityData,
        activityDate: this.formatDate(activityData.activityDate)
      };

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

    return this.http.put(`${this.urlBase}/api/DailyActivity/UpdateActivity/${id}`, formattedData, { headers });
  }

  getActivityTypes(): Observable<ActivityType[]>{
    return this.http.get<ActivityType[]>(`${this.urlBase}/api/Catalog/activity-types`);
  }

  private formatDate(date: any): string {
    if (!date) return new Date().toISOString().split('T')[0];
    if (typeof date === 'string') return date.split('T')[0];
    if (date instanceof Date) return date.toISOString().split('T')[0];
    return new Date(date).toISOString().split('T')[0];
  }

  deleteActivity(activityId: number): Observable<any> {
    return this.http.delete(`${this.urlBase}/api/DailyActivity/InactivateActivity/${activityId}`);
  }

  exportExcel(params: HttpParams): Observable<Blob> {
    return this.http.get(`${this.urlBase}/api/TimeReport/export-excel`, {
      params,
      responseType: 'blob' // Importante para manejar archivos binarios
    });
  }

  // Implementación de ejemplo para filtrar proyectos
  private isProjectAssignedToEmployee(project: any, employeeId: number): boolean {
    // Lógica personalizada según tu estructura de datos. Ejemplo:
    // 1. Si usas un mapa estático (no recomendado para producción):
    const employeeProjectsMap: { [key: number]: number[] } = {
      9: [1, 2, 3], // Ejemplo: EmployeeID 9 está en ProjectIDs 1, 2, 3
    };
    return employeeProjectsMap[employeeId]?.includes(project.id);

    // 2. Si los proyectos tienen un array assignedEmployees:
    // return project.assignedEmployees?.includes(employeeId);
  }

  // Versión modificada de downloadExcel que retorna Observable
  private downloadExcel(
    employeeId: number,
    clientId: number,
    year?: number,
    month?: number,
    fullMonth = false
  ): Observable<any> {
    const params = {
      employeeId: employeeId.toString(),
      clientId: clientId.toString(),
      year: year?.toString() || new Date().getFullYear().toString(),
      month: month?.toString() || (new Date().getMonth() + 1).toString(),
      fullMonth: fullMonth.toString()
    };

    return this.http.get(`${this.urlBase}/api/TimeReport/export-excel`, {
      params,
      responseType: 'blob'
    }).pipe(
      tap(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte_${params.year}-${params.month}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      })
    );
  }

}
