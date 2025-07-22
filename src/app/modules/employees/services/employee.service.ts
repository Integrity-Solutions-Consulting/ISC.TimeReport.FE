import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { SuccessResponse } from '../../../shared/interfaces/response.interface';
import { ApiResponse, GetAllEmployeesResponse, Employee, EmployeeWithPerson, EmployeeWithPersonID } from '../interfaces/employee.interface';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {

  urlBase: string = environment.URL_BASE;

  constructor(private http: HttpClient) { }

  getEmployees(pageNumber: number, pageSize: number, search: string = ''): Observable<ApiResponse> {
    let params = new HttpParams()
      .set('PageNumber', pageNumber.toString())
      .set('PageSize', pageSize.toString())
      .set('search', search || '');

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<ApiResponse>(`${this.urlBase}/api/Employee/GetAllEmployees`, { params })
  }

  getEmployeeByID(id: number): Observable<Employee> {
    return this.http.get<Employee>(`${this.urlBase}/api/Employee/GetEmployeeByID/${id}`);
  }

  getEmployeeId(id: number): Observable<any> {
    return this.http.get<any>(`${this.urlBase}/api/Employee/GetEmployeeByID/${id}`).pipe(
      map(response => {
        // Si la respuesta tiene propiedad data, la usamos, sino usamos la respuesta completa
        return response.data || response;
      }),
      catchError(error => {
        console.error('Error fetching employee', error);
        return throwError(() => new Error(error));
      })
    );
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

  getIdentificationTypes(): Observable<{ id: number, name: string }[]> {
        return this.http.get<any[]>(`${this.urlBase}/api/Catalog/identification-types`).pipe(
          map(items => items.map(item => ({ id: item.id, name: item.description })))
        );
      }

  getGenders(): Observable<{ id: number, name: string }[]> {
    return this.http.get<any[]>(`${this.urlBase}/api/Catalog/genders`).pipe(
      map(items => items.map(item => ({ id: item.id, name: item.genderName })))
    );
  }

  getNationalities(): Observable<{ id: number, name: string }[]> {
    return this.http.get<any[]>(`${this.urlBase}/api/Catalog/nationalities`).pipe(
      map(items => items.map(item => ({ id: item.id, name: item.description })))
    );
  }

  getPositions(): Observable<{ id: number, name: string }[]> {
    return this.http.get<any[]>(`${this.urlBase}/api/Catalog/positions`).pipe(
      map(items => items.map(item => ({ id: item.id, name: item.positionName })))
    );
  }

  getDepartments(): Observable<{ id: number, name: string }[]> {
    return this.http.get<any[]>(`${this.urlBase}/api/Catalog/departments`).pipe(
      map(items => items.map(item => ({ id: item.id, name: item.departamentName })))
    );
  }

  getAllCatalogs(): Observable<{
    identificationTypes: { id: number, name: string }[],
    departments: { id: number, name: string }[],
    genders: { id: number, name: string }[],
    nationalities: { id: number, name: string }[],
    positions: { id: number, name: string }[],
  }> {
    return forkJoin({
      identificationTypes: this.getIdentificationTypes(),
      genders: this.getGenders(),
      nationalities: this.getNationalities(),
      positions: this.getPositions(),
      departments: this.getDepartments()
    });
  }
}
