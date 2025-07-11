import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ApiResponse, Project } from '../interfaces/project.interface';
import { catchError, forkJoin, map, mergeMap, Observable, of, switchMap, tap } from 'rxjs';
import { SuccessResponse } from '../../../shared/interfaces/response.interface';
import { ProjectDetail, AllProjectsResponse, SimpleProjectItem} from '../../assigments/interfaces/assignment.interface';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

    urlBase: string = environment.URL_BASE;

    constructor(private http: HttpClient) { }

    getProjects(): Observable<any> {
        return this.http.get<ApiResponse>(`${this.urlBase}/api/Project/GetAllProjects`).pipe(
        catchError(error => {
          console.error('Error fetching all projects:', error);
          // Return an observable of an empty array or an appropriate error object
          // depending on how you want to handle errors downstream.
          // For this scenario, returning a structure that won't cause .map() to fail:
          return of({ data: [] });
        })
      );
    }

    getProjectsForTables(pageNumber: number, pageSize: number, search: string = ''): Observable<ApiResponse> {
        let params = new HttpParams()
          .set('PageNumber', pageNumber.toString())
          .set('PageSize', pageSize.toString());

        if (search) {
          params = params.set('search', search);
        }

        return this.http.get<ApiResponse>(`${this.urlBase}/api/Project/GetAllProjects`, { params })
    }

    getProjectsForDetails(): Observable<AllProjectsResponse> {
      return this.http.get<AllProjectsResponse>(`${this.urlBase}/api/Project/GetAllProjects`).pipe(
        catchError(error => {
          console.error('Error fetching all projects:', error);
          // Ensure the returned 'of' matches the AllProjectsResponse structure
          // Provide a default/empty structure for error cases
          return of({ items: [], totalItems: 0, pageNumber: 0, pageSize: 0, totalPages: 0 }); // Provide default paginated response
        })
      );
    }

    getProjectById(id: number): Observable<Project> {
      return this.http.get<Project>(`${this.urlBase}/api/Project/GetProjectByID/${id}`);
    }

    getProjectDetailByID(id: number): Observable<ProjectDetail> {
      return this.http.get<any>(`${this.urlBase}/api/Project/GetProjectDetailByID/${id}`).pipe(
        map(response => {
          // If response.data is present, use it
          if (response) {
            return response as ProjectDetail;
          }
          // If response.data is missing or null, return a default ProjectDetail object
          console.warn(`API response for ProjectDetail ID ${id} is malformed or data is missing:`, response);
          return this.createDefaultProjectDetail(id); // <--- Use helper function
        }),
        catchError(error => {
          console.error(`Error fetching project detail for ID ${id}:`, error);
          // Even on HTTP error, return a default ProjectDetail object
          return of(this.createDefaultProjectDetail(id)); // <--- Use helper function
        })
      );
    }

    // Helper function to create a default ProjectDetail object
    private createDefaultProjectDetail(id: number): ProjectDetail {
      return {
        id: id, // Assign the ID so we know which project failed
        clientID: 0,
        projectStatusID: 0,
        code: 'N/A',
        name: `Error Project (ID: ${id})`,
        description: 'Could not load project details.',
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        budget: 0,
        employeeProjects: [], // Ensure these are empty arrays
        employeesPersonInfo: [] // Ensure these are empty arrays
      };
    }

    getAllProjectsDetails(): Observable<ProjectDetail[]> {
      return this.getProjectsForDetails().pipe(
        switchMap(response => {
          if (response && Array.isArray(response.items)) {
            const projectIds = response.items.map((project: SimpleProjectItem) => project.id);
            // If there are no project IDs, forkJoin on an empty array will complete immediately.
            if (projectIds.length === 0) {
              return of<ProjectDetail[]>([]); // Return an empty array of ProjectDetail if no projects found
            }
            const detailRequests = projectIds.map((id: number) => this.getProjectDetailByID(id));
            return forkJoin(detailRequests);
          } else {
            // If response.data is not an array or is undefined/null, return an empty array
            console.warn('getAllProjects: Expected response.data to be an array, but got:', response);
            return of<ProjectDetail[]>([]);
          }
        }),
        catchError(error => {
          console.error('Error in getAllProjectsDetails pipe:', error);
          return of<ProjectDetail[]>([]); // Ensure an empty array is returned on any error in this pipe
        })
      );
    }

    updateAssignmentStatus(assignmentId: number, newStatus: boolean): Observable<any> {
      return this.http.patch(`${this.urlBase}/api/Project/GetProjectDetailByID/status`, {
        employeeProjectID: assignmentId,
        status: newStatus
      });
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
