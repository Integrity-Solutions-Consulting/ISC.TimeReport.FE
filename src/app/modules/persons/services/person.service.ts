import { Injectable } from '@angular/core';
import { Person } from '../interfaces/person.interface';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class PersonService {

  private apiUrl = 'api/persons';

  constructor(private http: HttpClient) { }

  createPerson(person: Person): Observable<Person> {
    return this.http.post<Person>(this.apiUrl, person);
  }
}
