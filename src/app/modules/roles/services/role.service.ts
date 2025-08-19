import { GetAllUsersResponse, UserWithFullName } from './../interfaces/role.interface';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { catchError, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { EmployeeWithPerson } from '../../employees/interfaces/employee.interface';
import { Role } from '../../auth/interfaces/auth.interface';

@Injectable({
  providedIn: 'root'
})
export class RoleService {

  urlBase: string = environment.URL_BASE;

  constructor(private http: HttpClient) { }

  getAllUsers(): Observable<UserWithFullName[]> {
    return this.http.get<GetAllUsersResponse>(`${this.urlBase}/api/users/GetAllUsers`)
      .pipe(
        map(response => response.data),
        switchMap(users => {
          const userObservables = users.map(user =>
            this.http.get<EmployeeWithPerson>(`${this.urlBase}/api/Employee/GetEmployeeByID/${user.employeeID}`)
              .pipe(
                map(employee => ({
                  ...user,
                  fullName: `${employee.person.firstName} ${employee.person.lastName}`
                })),
                catchError(() => of({  // Manejo de error si falla la carga del empleado
                  ...user,
                  fullName: 'Nombre no disponible'
                }))
              ));
          return forkJoin(userObservables);
        })
      );
  }

  getRoles(): Observable<Role[]> {
    return this.http.get<{data: Role[]}>(`${this.urlBase}/api/auth/GetRoles`).pipe(
      map(response => response.data)
    );
  }

  createRole(role: {roleName: string, description: string, moduleIds: number[]}): Observable<any> {
    return this.http.post(`${this.urlBase}/api/auth/roles`, role);
  }

  updateRole(id: number, role: {roleName: string, description: string, moduleIds: number[]}): Observable<any> {
    return this.http.put(`${this.urlBase}/api/auth/UpdateRole/${id}`, role);
  }
}
