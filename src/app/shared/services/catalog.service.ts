import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Catalog } from '../interfaces/catalog.interface';

@Injectable({
  providedIn: 'root'
})
export class CatalogService {

  private baseUrl = 'api/catalogs';

  constructor(private http: HttpClient) { }

  getNationalities(): Observable<Catalog[]> {
    return this.http.get<Catalog[]>(`${this.baseUrl}/nationalities`);
  }

  getGenders(): Observable<Catalog[]> {
    return this.http.get<Catalog[]>(`${this.baseUrl}/genders`);
  }

  getIdentificationTypes(): Observable<Catalog[]> {
    return this.http.get<Catalog[]>(`${this.baseUrl}/identification-types`);
  }

  getPositions():Observable<Catalog[]> {
    return this.http.get<Catalog[]>(`${this.baseUrl}/positions`)
  }
}
