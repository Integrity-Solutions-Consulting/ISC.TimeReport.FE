import { GetAllUsersResponse } from './../interfaces/role.interface';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, Observable } from 'rxjs';
import { EmployeeWithPerson } from '../../employees/interfaces/employee.interface';

@Injectable({
  providedIn: 'root'
})
export class RoleService {

  urlBase: string = environment.URL_BASE;

  constructor(private http: HttpClient) { }

  getAllUsers(): Observable<any> {
    return this.http.get<GetAllUsersResponse>(`${this.urlBase}/api/users/GetAllUsers`)
      .pipe(
        map(response => response.data), // Get the array of User objects
        map(users => {
          // For each user, fetch their employee details to get the full name
          const userObservables = users.map(user =>
            this.http.get<EmployeeWithPerson>(`${this.urlBase}/api/Employee/GetEmployeeByID/${user.employeeID}`) // Assuming an endpoint for employee details
              .pipe(
                map(employee => ({
                  ...user,
                  fullName: `${employee.person.firstName} ${employee.person.lastName}`
                }))
              )
          );
          return forkJoin(userObservables); // Wait for all employee data to be fetched
        })
      )
  }
}
