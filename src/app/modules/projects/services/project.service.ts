import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Project } from '../interfaces/project.interface';
import { Observable } from 'rxjs';
import { SuccessResponse } from '../../../shared/interfaces/response.interface';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

    urlBase: string = environment.URL_TEST;

    constructor(private http: HttpClient) { }

    getProjects():Observable<Project[]>{
              return this.http.get<Project[]>(
                  `${this.urlBase}/api/Project/GetAllProjects`
                );
    }

    createProject(createProjectRequest: Project): Observable<SuccessResponse<Project>> {
      console.log(createProjectRequest);
      return this.http.post<SuccessResponse<Project>>(`${this.urlBase}/api/Project/CreateProject`, createProjectRequest);
    }

    updateProject(id: number, updateProjectRequest: Project): Observable<SuccessResponse<Project>> {
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
