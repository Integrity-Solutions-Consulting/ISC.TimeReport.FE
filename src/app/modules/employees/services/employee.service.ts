import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SuccessResponse } from '../../../shared/interfaces/response.interface';
import { Employee } from '../interfaces/employee.interface';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {

  urlBase: string = environment.URL_BASE;

  constructor(private http: HttpClient) { }

  getEmployees():Observable<Employee[]>{
          return this.http.get<Employee[]>(
              `${this.urlBase}/api/employee/get`
            );
      }

  createEmployee(employeeData: Employee): Observable<SuccessResponse<Employee>> {
    console.log(employeeData);
    return this.http.post<SuccessResponse<Employee>>(`${this.urlBase}/api/employee/create`, employeeData);
  }
}
