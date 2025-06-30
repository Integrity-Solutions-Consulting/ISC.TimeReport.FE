import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { Person, PersonApiResponse } from '../interfaces/client.interface';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PersonService {

  urlBase: string = environment.URL_TEST; // Ajusta según tu API

  constructor(private http: HttpClient) { }

  getPersons(): Observable<PersonApiResponse> {
    return this.http.get<PersonApiResponse>(`${this.urlBase}/api/Person/GetAllPersons`)
  }
}
