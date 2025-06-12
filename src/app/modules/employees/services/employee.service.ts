import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {

  private apiUrl = 'https://tu-api.com/employees';

  constructor(private http: HttpClient) { }

  createEmployee(employeeData: any): Observable<any> {
    console.log(employeeData);
    return this.http.post(this.apiUrl, employeeData);
  }
}
