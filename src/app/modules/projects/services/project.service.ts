import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { ApiResponse, Project } from '../interfaces/project.interface';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { SuccessResponse } from '../../../shared/interfaces/response.interface';
import { ProjectDetail } from '../../assigments/interfaces/assignment.interface';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

    urlBase: string = environment.URL_BASE;

    constructor(private http: HttpClient) { }

    getProjects(): Observable<ApiResponse> {
      return this.http.get<ApiResponse>(`${this.urlBase}/api/Project/GetAllProjects`);
    }

    getProjectById(id: number): Observable<Project> {
      return this.http.get<Project>(`${this.urlBase}/api/Project/GetProjectByID/${id}`);
    }

    getProjectDetails(id: number): Observable<any> {
      return this.http.get(`${this.urlBase}/api/Project/GetProjectDetailByID/${id}`).pipe(
        map(response => {
          // Si la respuesta ya tiene employeeProjects directamente
          if (response.hasOwnProperty('employeeProjects')) {
            return { data: response }; // Normalizamos a la estructura esperada
          }
          return response;
        }),
        catchError(error => {
          console.error('Error en la petición:', error);
          return of({ data: { employeeProjects: [], employeesPersonInfo: [] } });
        })
      );
    }

    createProject(createProjectRequest: Project): Observable<SuccessResponse<Project>> {
      console.log(createProjectRequest);
      return this.http.post<SuccessResponse<Project>>(`${this.urlBase}/api/Project/CreateProject`, createProjectRequest);
    }

    updateProject(id: number, updateProjectRequest: Project): Observable<SuccessResponse<Project>> {
      console.log(id)
      if (id === undefined || id === null || isNaN(id)) {
        throw new Error('ID de proyecto no válido: ' + id);
      };
      const requestBody = {
        id: Number(id),
        ...updateProjectRequest
      };
      console.log(requestBody);
      return this.http.put<SuccessResponse<Project>>(`${this.urlBase}/api/Project/UpdateProjectByID/${id}`, requestBody);
    }

    inactivateProject(id: number, data: any): Observable<any> {
      return this.http.delete(`${this.urlBase}/api/Project/InactiveProjectByID/${id}`);
    }

    activateProject(id: number, data: any): Observable<any> {
      return this.http.delete(`${this.urlBase}/api/Project/ActiveProjectByID/${id}`);
    }
}
