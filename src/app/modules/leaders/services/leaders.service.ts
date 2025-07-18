import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Leader, LeaderWithPerson, LeaderWithPersonID, ApiResponse } from '../interfaces/leader.interface';
import { catchError, forkJoin, map, Observable, tap, throwError } from 'rxjs';
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

  getIdentificationTypes(): Observable<{ id: number, name: string }[]> {
        return this.http.get<any[]>(`${this.urlBase}/api/Catalog/identification-types`).pipe(
          map(items => items.map(item => ({ id: item.id, name: item.description })))
        );
      }

  getGenders(): Observable<{ id: number, name: string }[]> {
    return this.http.get<any[]>(`${this.urlBase}/api/Catalog/genders`).pipe(
      map(items => items.map(item => ({ id: item.id, name: item.genderName })))
    );
  }

  getNationalities(): Observable<{ id: number, name: string }[]> {
    return this.http.get<any[]>(`${this.urlBase}/api/Catalog/nationalities`).pipe(
      map(items => items.map(item => ({ id: item.id, name: item.description })))
    );
  }

  getPositions(): Observable<{ id: number, name: string }[]> {
    return this.http.get<any[]>(`${this.urlBase}/api/Catalog/positions`).pipe(
      map(items => items.map(item => ({ id: item.id, name: item.positionName })))
    );
  }

  getDepartments(): Observable<{ id: number, name: string }[]> {
    return this.http.get<any[]>(`${this.urlBase}/api/Catalog/departments`).pipe(
      map(items => items.map(item => ({ id: item.id, name: item.departamentName })))
    );
  }

  getProyectTypes(): Observable<{ id: number, name: string }[]> {
    return this.http.get<any[]>(`${this.urlBase}/api/Catalog/project-type`).pipe(
      map(items => items.map(item => ({ id: item.id, name: item.typeName })))
    );
  }

  getProyectStatus(): Observable<{ id: number, name: string }[]> {
    return this.http.get<any[]>(`${this.urlBase}/api/Catalog/project-statuses`).pipe(
      map(items => items.map(item => ({ id: item.id, name: item.statusName })))
    );
  }

  getAllCatalogs(): Observable<{
    identificationTypes: { id: number, name: string }[],
    departments: { id: number, name: string }[],
    genders: { id: number, name: string }[],
    nationalities: { id: number, name: string }[],
    positions: { id: number, name: string }[],
    projectTypes: { id: number, name: string }[],
    projectStatus: { id: number, name: string }[],
    }> {
      return forkJoin({
        identificationTypes: this.getIdentificationTypes(),
        genders: this.getGenders(),
        nationalities: this.getNationalities(),
        positions: this.getPositions(),
        departments: this.getDepartments(),
        projectTypes: this.getProyectTypes(),
        projectStatus: this.getProyectStatus()
      });
    }

}
