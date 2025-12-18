import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';
import { ProyectoDataResponse, ProyectoHoursResponse } from '../interfaces/reports';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
   urlBase: string = environment.URL_BASE;

  constructor(private http: HttpClient, private authService: AuthService) {}
  getResourcesByClient(): Observable<ProyectoHoursResponse[]> {
      return this.http.get<ProyectoHoursResponse[]>(
        `${this.urlBase}/api/Report/client-resource`
      );
    }
    getProjectResources(): Observable<ProyectoDataResponse[]> {
      return this.http.get<ProyectoDataResponse[]>(
        `${this.urlBase}/api/Report/project-resource`
      );
    }
}
