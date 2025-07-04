import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { SuccessResponse } from '../../../shared/interfaces/response.interface';
import { ApiResponse, GetAllEmployeesResponse, Employee, EmployeeWithPerson, EmployeeWithPersonID } from '../interfaces/employee.interface';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {

  urlBase: string = environment.URL_TEST;

  constructor(private http: HttpClient) { }

  getEmployees(pageNumber: number, pageSize: number, search: string = ''): Observable<ApiResponse> {
    let params = new HttpParams()
      .set('PageNumber', pageNumber.toString())
      .set('PageSize', pageSize.toString());

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<ApiResponse>(`${this.urlBase}/api/Employee/GetAllEmployees`, { params })
  }

  getEmployeeByID(id: number): Observable<Employee> {
    return this.http.get<Employee>(`${this.urlBase}/api/Employee/GetEmployeeByID/${id}`);
  }

  createEmployeeWithPerson(employeeWithPersonRequest: EmployeeWithPerson): Observable<SuccessResponse<Employee>> {
    return this.http.post<SuccessResponse<Employee>>(`${this.urlBase}/api/Employee/CreateEmployeeWithPerson`, employeeWithPersonRequest);
  }

  createEmployeeWithPersonID(employeeWithPersonIDRequest: EmployeeWithPersonID): Observable<SuccessResponse<Employee>> {
    return this.http.post<SuccessResponse<Employee>>(`${this.urlBase}/api/Employee/CreateEmployeeWithPersonID`, employeeWithPersonIDRequest);
  }

  updateEmployeeWithPerson(id: number, updateWithPersonRequest: EmployeeWithPerson): Observable<SuccessResponse<Employee>> {
    return this.http.put<SuccessResponse<Employee>>(`${this.urlBase}/api/Employee/UpdateEmployeeWithPerson/${id}`, updateWithPersonRequest);
  }

  inactivateEmployee(id: number, data: any): Observable<any> {
    return this.http.delete(`${this.urlBase}/api/Employee/InactiveEmployeeByID/${id}`);
  }

  activateEmployee(id: number, data: any): Observable<any> {
    return this.http.delete(`${this.urlBase}/api/Employee/ActiveEmployeeByID/${id}`);
  }
}
