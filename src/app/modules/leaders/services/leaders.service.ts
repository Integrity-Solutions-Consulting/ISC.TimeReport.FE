import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Leader, LeaderWithPerson, LeaderWithPersonID, ApiResponse, LeaderAssignmentPayload, LeaderGroup } from '../interfaces/leader.interface';
import { BehaviorSubject, catchError, finalize, forkJoin, map, Observable, tap, throwError } from 'rxjs';
import { SuccessResponse } from '../../../shared/interfaces/response.interface';
import { Project } from '../../projects/interfaces/project.interface';

@Injectable({
    providedIn: 'root'
})
export class LeadersService {

  private http = inject(HttpClient);
  urlBase: string = environment.URL_BASE;

  // Subject para controlar el estado de carga
  private loadingSubject = new BehaviorSubject<boolean>(false);
  loadingState$ = this.loadingSubject.asObservable();

  // Método para mostrar el spinner
  showLoading() {
    this.loadingSubject.next(true);
  }

  // Método para ocultar el spinner
  hideLoading() {
    this.loadingSubject.next(false);
  }

  getLeaders(pageNumber: number, pageSize: number, search: string = ''):Observable<ApiResponse>{
      let params = new HttpParams()
        .set('PageNumber', pageNumber.toString())
        .set('PageSize', pageSize.toString());

      if (search) {
        params = params.set('search', search);
      }
      return this.http.get<ApiResponse>(`${this.urlBase}/api/Leader/GetAllLeaders`, { params });
  }

  getAllLeaders(): Observable<any> {
    return this.http.get<any>(`${this.urlBase}/api/Leader/GetAllLeaders?PageNumber=1&PageSize=9999`);
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
    this.showLoading();
    return this.http.post<SuccessResponse<Leader>>(`${this.urlBase}/api/Leader/CreateLeaderWithPerson`, leaderWithPersonRequest).pipe(
      finalize(() => this.hideLoading())
    );
  }

  createLeaderWithPersonID(leaderWithPersonIDRequest: LeaderWithPersonID): Observable<SuccessResponse<Leader>> {
    this.showLoading();
    return this.http.post<SuccessResponse<Leader>>(`${this.urlBase}/api/Leader/CreateLeaderWithPersonID`, leaderWithPersonIDRequest).pipe(
      finalize(() => this.hideLoading())
    );
  }

  updateLeaderWithPerson(id: number, updateWithPersonRequest: LeaderWithPerson): Observable<SuccessResponse<Leader>> {
    this.showLoading();
    return this.http.put<SuccessResponse<Leader>>(`${this.urlBase}/api/Leader/UpdateLeaderWithPerson/${id}`, updateWithPersonRequest).pipe(
      finalize(() => this.hideLoading())
    );
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

  assignLeaderToProject(payload: LeaderAssignmentPayload): Observable<any> {
    return this.http.post(`${this.urlBase}/api/Leader/assign-leader-to-project`, payload);
  }

  getAllLeadersGrouped(): Observable<LeaderGroup[]> {
    return this.http.get<LeaderGroup[]>(`${this.urlBase}/api/Leader/get-all-leaders-grouped`);
  }

  getAllProjects(pageNumber: number = 1, pageSize: number = 10000, search: string = ''): Observable<{items: Project[], totalItems: number}> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<{items: Project[], totalItems: number}>(`${this.urlBase}/api/Project/GetAllProjects`, { params });
  }

  getLeadersWithProjects(): Observable<{leaders: LeaderGroup[], projects: Project[]}> {
    return forkJoin({
      leaders: this.getAllLeadersGrouped(),
      projects: this.getAllProjects().pipe(map(response => response.items))
    });
  }

}
