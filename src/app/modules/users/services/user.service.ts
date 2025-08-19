import { GetAllUsersResponse, User, UserWithFullName } from '../interfaces/user.interface';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { catchError, forkJoin, map, Observable, of, switchMap, throwError } from 'rxjs';
import { EmployeeWithPerson } from '../../employees/interfaces/employee.interface';

@Injectable({
  providedIn: 'root'
})
export class UserService {

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

  createUser(userData: User): Observable<User> {
      return this.http.post<User>(`${this.urlBase}/api/auth/register`, userData);
    }

  assignRolesToUser(userId: number, roleIds: number[]): Observable<any> {
    const url = `${this.urlBase}/api/users/AssignRolesToUser`;
    const body = {
      userID: userId,
      rolesIDs: roleIds
    };

    return this.http.post(url, body).pipe(
      catchError(error => {
        console.error('Error assigning roles:', error);
        return throwError(() => error);
      })
    );
  }
}
