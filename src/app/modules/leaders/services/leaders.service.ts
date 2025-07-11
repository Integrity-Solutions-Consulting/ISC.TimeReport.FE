import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Leader, LeaderWithPerson, LeaderWithPersonID, ApiResponse } from '../interfaces/leader.interface';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { SuccessResponse } from '../../../shared/interfaces/response.interface';

@Injectable({
    providedIn: 'root'
})
export class LeadersService {

  private http = inject(HttpClient);
  urlBase: string = environment.URL_BASE;

  getLeaders(pageNumber: number, pageSize: number, search: string = ''):Observable<ApiResponse>{
      let params = new HttpParams()
        .set('PageNumber', pageNumber.toString())
        .set('PageSize', pageSize.toString());

      if (search) {
        params = params.set('search', search);
      }
      return this.http.get<ApiResponse>(`${this.urlBase}/api/Leader/GetAllLeaders`, { params });
  }

  getLeaderByID(id: number): Observable<Leader> {
    return this.http.get<Leader>(`${this.urlBase}/api/Leader/GetLeaderByID/${id}`);
  }

  getLeaderId(id: number): Observable<any> {
    return this.http.get<any>(`${this.urlBase}/api/Leader/GetLeaderByID/${id}`).pipe(
      tap(response => console.log('Respuesta cruda del API:', response)),
      map(response => {
        // Maneja tanto la estructura con wrapper {data: ...} como respuesta directa
        const data = response.data || response;
        console.log('Datos procesados:', data);
        return data;
      }),
      catchError(error => {
        console.error('Error al obtener líder:', error);
        return throwError(() => new Error(error));
      })
    );
  }

  createLeaderWithPerson(leaderWithPersonRequest: LeaderWithPerson): Observable<SuccessResponse<Leader>> {
    console.log(leaderWithPersonRequest)
    return this.http.post<SuccessResponse<Leader>>(`${this.urlBase}/api/Leader/CreateLeaderWithPerson`, leaderWithPersonRequest);
  }

  createLeaderWithPersonID(leaderWithPersonIDRequest: LeaderWithPersonID): Observable<SuccessResponse<Leader>> {
    return this.http.post<SuccessResponse<Leader>>(`${this.urlBase}/api/Leader/CreateLeaderWithPersonID`, leaderWithPersonIDRequest);
  }

  updateLeaderWithPerson(id: number, updateWithPersonRequest: LeaderWithPerson): Observable<SuccessResponse<Leader>> {
    return this.http.put<SuccessResponse<Leader>>(`${this.urlBase}/api/Leader/UpdateLeaderWithPerson/${id}`, updateWithPersonRequest);
  }

  inactivateLeader(id: number, data: any): Observable<any> {
    console.log(data)
    return this.http.delete(`${this.urlBase}/api/Leader/InactivateLeaderByID/${id}`);
  }

  activateLeader(id: number, data: any): Observable<any> {
    return this.http.delete(`${this.urlBase}/api/Leader/ActivateLeaderByID/${id}`);
  }

}
