import { Injectable } from '@angular/core';
import { Person } from '../interfaces/person.interface';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { SuccessResponse } from '../../../shared/interfaces/response.interface';

@Injectable({
  providedIn: 'root'
})
export class PersonService {

   urlBase: string = environment.URL_BASE;

  constructor(private http: HttpClient) { }

  createPerson(person: Person): Observable<SuccessResponse<Person>> {
    return this.http.post<SuccessResponse<Person>>(`${this.urlBase}/api/person/create`, person);
  }
}
