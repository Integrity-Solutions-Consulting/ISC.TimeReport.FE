import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { ApiResponse, Project } from '../interfaces/project.interface';
import { Observable, tap } from 'rxjs';
import { SuccessResponse } from '../../../shared/interfaces/response.interface';

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
      return this.http.put<SuccessResponse<Project>>(`${this.urlBase}/api/Project/UpdateProjectByID/${id}`, requestBody);
    }
}
