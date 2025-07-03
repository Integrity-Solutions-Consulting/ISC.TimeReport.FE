import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SuccessResponse } from '../../../shared/interfaces/response.interface';
import { Activity, ApiResponse } from '../interfaces/activity.interface';

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private http = inject(HttpClient);
  urlBase: string = environment.URL_TEST;

  getActivities(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.urlBase}/api/DailyActivity/GetAllActivities`).pipe(
      map(response => {
        // Puedes hacer transformaciones adicionales aquí si es necesario
        return response;
      })
    );
  }

  createActivity(activityData: any): Observable<any> {
    console.log(activityData);
    if (!activityData.activityDate || !activityData.hoursQuantity) {
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
}
