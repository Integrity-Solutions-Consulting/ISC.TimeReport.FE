import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ApiResponse, ApiResponseByID, Project, ProjectDetails } from '../interfaces/project.interface';
import { catchError, expand, forkJoin, map, mergeMap, Observable, of, reduce, switchMap, tap, throwError } from 'rxjs';
import { SuccessResponse } from '../../../shared/interfaces/response.interface';
import { ProjectDetail, AllProjectsResponse, SimpleProjectItem} from '../interfaces/project.interface';

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

    getAllProjects(): Observable<any[]> {
      const pageSize = 100; // Máximo permitido por el backend
      let pageNumber = 1;

      return this.http
        .get<any>(`${this.urlBase}/api/Project/GetAllProjects`, {
          params: new HttpParams()
            .set('PageNumber', pageNumber.toString())
            .set('PageSize', pageSize.toString())
        })
        .pipe(
          expand((res) => {
            if (res.data.length === pageSize) {
              pageNumber++;
              return this.http.get<any>(`${this.urlBase}/api/Project/GetAllProjects`, {
                params: new HttpParams()
                  .set('PageNumber', pageNumber.toString())
                  .set('PageSize', pageSize.toString())
              });
            }
            return of(); // Detener la paginación
          }),
          map(res => res.data),
          reduce((acc, data) => [...acc, ...data], [] as any[]) // Combinar todas las páginas
        );
    }

    getProjectsByEmployeeId(employeeId: number): Observable<any[]> {
      return this.getAllProjects().pipe(
        switchMap(projects => {
          // Filtrar proyectos asignados al empleado (aquí necesitas la lógica de filtrado)
          const filteredProjects = projects.filter(project =>
            this.isProjectAssignedToEmployee(project, employeeId) // Ver siguiente paso
          );

          if (filteredProjects.length === 0) {
            return of([]);
          }

          // Obtener clientes para cada proyecto filtrado
          const clientRequests = filteredProjects.map(project =>
            this.http.get(`${this.urlBase}/api/Client/GetClientByID/${project.clientID}`).pipe(
              map(clientRes => ({
                ...project,
                client: clientRes
              })),
              catchError(() => of({
                ...project,
                client: null
              }))
            )
          );

          return forkJoin(clientRequests);
        })
      );
    }

    private isProjectAssignedToEmployee(project: any, employeeId: number): boolean {
      // Implementación depende de tu estructura de datos. Ejemplos:
      // - Si projects tienen un array `assignedEmployees`:
      //   return project.assignedEmployees?.includes(employeeId);
      // - O si tienes una lista estática (mientras no haya endpoint directo):
      const employeeProjectsMap: { [key: number]: number[] } = {
        9: [1, 2, 3], // Ejemplo: EmployeeID 9 está en ProjectIDs 1, 2, 3
      };
      return employeeProjectsMap[employeeId]?.includes(project.id);
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

    getProjectById(id: number): Observable<any> {
      const url = `${this.urlBase}/api/Project/GetProjectByID/${id}`;

      return this.http.get<any>(url).pipe(
        map(response => {
          // Si la respuesta ya es el objeto del proyecto, lo devolvemos directamente
          return response.data || response;
        }),
        catchError(error => {
          console.error('Error fetching project', error);
          return throwError(() => new Error(error));
        })
      );
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

    getProjectDetailsById(id: number): Observable<ProjectDetail> {
      console.log('ProjectService: Attempting to call GET:', `${this.urlBase}/api/Project/GetProjectDetailByID/${id}`);
      return this.http.get<ProjectDetail>(`${this.urlBase}/api/Project/GetProjectDetailByID/${id}`);
    }

    createProject(createProjectRequest: Project): Observable<SuccessResponse<Project>> {
      console.log(createProjectRequest);
      return this.http.post<SuccessResponse<Project>>(`${this.urlBase}/api/Project/CreateProject`, createProjectRequest);
    }

    updateProject(id: number, updateProjectRequest: Project): Observable<SuccessResponse<Project>> {
      console.log('ID recibido en el servicio:', id);

      if (id === undefined || id === null || isNaN(id)) {
        throw new Error('ID de proyecto no válido: ' + id);
      }

      // Desestructura updateProjectRequest para OMITIR la propiedad 'id'
      // 'restOfProject' contendrá todas las propiedades de updateProjectRequest EXCEPTO 'id'
      const { id: _, ...restOfProject } = updateProjectRequest;

      const requestBody = {
        id: Number(id), // Usamos el 'id' que viene como parámetro (el "correcto")
        ...restOfProject // Agregamos el resto de las propiedades del proyecto
      };

      console.log('Cuerpo de la solicitud PUT:', requestBody);

      return this.http.put<SuccessResponse<Project>>(`${this.urlBase}/api/Project/UpdateProjectByID/${id}`, requestBody);
    }

    inactivateProject(id: number, data: any): Observable<any> {
      return this.http.delete(`${this.urlBase}/api/Project/InactiveProjectByID/${id}`);
    }

    activateProject(id: number, data: any): Observable<any> {
      return this.http.delete(`${this.urlBase}/api/Project/ActiveProjectByID/${id}`);
    }

    downloadExcelReport(params: HttpParams): Observable<Blob> {
      return this.http.get(`${this.urlBase}/api/TimeReport/export-excel`, {
        params,
        responseType: 'blob'
      });
    }

    getProjectsByEmployee(employeeId: number, params: { PageNumber: number, PageSize: number, search?: string }): Observable<any> {
        const httpParams = new HttpParams()
            .set('PageNumber', params.PageNumber.toString())
            .set('PageSize', params.PageSize.toString())
            .set('search', params.search || '');

        return this.http.get<any>(`${this.urlBase}/api/Project/GetAllProjectsWhereEmployee`, { params: httpParams });
    }

    assignResourcesToProject(request: any): Observable<any> {
      return this.http.post(`${this.urlBase}/api/Project/AssignEmployeesToProject`, request);
    }

    getAllEmployees(pageSize: number, pageNumber: number, search: string): Observable<any> {
      return this.http.get(`${this.urlBase}/api/Employee/GetAllEmployees`, {
        params: { pageSize, pageNumber, search }
      });
    }

    getInventoryProviders(): Observable<any> {
      return this.http.get(`${this.urlBase}/api/InventoryApi/GetInventoryProviders`);
    }

    getPositions(): Observable<any> {
      return this.http.get(`${this.urlBase}/api/Catalog/positions`);
    }

    getProjectsFilteredByRole(employeeId: number | null, isAdmin: boolean, pageSize = 10, pageNumber = 1, search = ''): Observable<ApiResponse> {
      if (isAdmin) {
        // Si es admin, obtener todos los proyectos
        return this.getProjectsForTables(pageNumber, pageSize, search);
      } else if (employeeId) {
        // Si no es admin y tiene employeeId, obtener solo los proyectos del empleado
        return this.getProjectsByEmployee(employeeId, { PageNumber: pageNumber, PageSize: pageSize, search });
      } else {
        // Si no es admin y no tiene employeeId, devolver vacío
        return of({ items: [], totalItems: 0, pageNumber: 0, pageSize: 0, totalPages: 0 });
      }
    }
}
