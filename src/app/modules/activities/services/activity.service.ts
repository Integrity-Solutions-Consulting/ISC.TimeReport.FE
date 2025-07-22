import { ProjectDetail } from './../../assigments/interfaces/assignment.interface';
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, forkJoin, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SuccessResponse } from '../../../shared/interfaces/response.interface';
import { Activity, ApiResponse,} from '../interfaces/activity.interface';
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

  getActivities(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.urlBase}/api/DailyActivity/GetAllActivities`).pipe(
      map(response => {
        // Puedes hacer transformaciones adicionales aquí si es necesario
        return response;
        console.log(response);
      })
    );
  }

  getDatedActivities(employeeId: number, filters?: { clientId?: number; dateFrom?: string; dateTo?: string }) {
    let params: any = { employeeId: employeeId.toString() };
    if (filters?.clientId) params.clientId = filters.clientId.toString();
    if (filters?.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters?.dateTo) params.dateTo = filters.dateTo;

    return this.http.get(`${this.urlBase}/api/DailyActivity/GetAllActivities`, { params });
  }

  createActivity(activityData: any): Observable<any> {
    console.log('Datos recibidos en servicio:', JSON.parse(JSON.stringify(activityData)));

    if (!activityData.activityDate || activityData.hoursQuantity === undefined) {
      console.error('Datos faltantes:', {
        date: activityData.activityDate,
        hours: activityData.hoursQuantity
      });
      return throwError(() => new Error('Datos incompletos'));
    }

    return this.http.post(`${this.urlBase}/api/DailyActivity/CreateActivity`, activityData);
  }

  updateActivity(id: number, activityData: any): Observable<any> {
      const token = localStorage.getItem('token');
      console.log(activityData);

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

    return this.http.put(`${this.urlBase}/api/DailyActivity/UpdateActivity/${id}`, activityData, { headers });
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
