import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { Person, PersonApiResponse } from '../interfaces/leader.interface';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PersonService {

  urlBase: string = environment.URL_BASE; // Ajusta según tu API

  constructor(private http: HttpClient) { }

  getPersons(pageNumber: number = 1, pageSize: number = 10): Observable<PersonApiResponse> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<PersonApiResponse>(`${this.urlBase}/api/Person/GetAllPersons`, { params });
  }

  getAllPersons(): Observable<Person[]> {
    return new Observable<Person[]>(observer => {
      const allPersons: Person[] = [];
      let currentPage = 1;
      const pageSize = 100; // Tamaño razonable para cada request

      const fetchNextPage = () => {
        this.getPersons(currentPage, pageSize).subscribe({
          next: (response) => {
            if (response.items && response.items.length > 0) {
              allPersons.push(...response.items);

              // Verificar si hay más páginas usando la información de paginación
              if (currentPage < response.totalPages) {
                currentPage++;
                fetchNextPage();
              } else {
                // Ya tenemos todas las personas
                observer.next(allPersons);
                observer.complete();
              }
            } else {
              observer.next(allPersons);
              observer.complete();
            }
          },
          error: (err) => {
            observer.error(err);
            console.error('Error fetching persons:', err);
          }
        });
      };

      // Iniciar el proceso
      fetchNextPage();
    });
  }

  getAllPersonsForkJoin(): Observable<Person[]> {
    // Primero obtenemos la primera página para saber el total de páginas
    return this.getPersons(1, 1).pipe(
      map(firstPage => {
        const totalPages = firstPage.totalPages;

        if (totalPages <= 1) {
          // Si solo hay una página, obtener todos los items
          return this.getPersons(1, firstPage.totalItems || 1000).pipe(
            map(response => response.items)
          );
        } else {
          // Crear array de observables para todas las páginas
          const requests: Observable<PersonApiResponse>[] = [];
          for (let i = 1; i <= totalPages; i++) {
            requests.push(this.getPersons(i, 100)); // pageSize de 100 por página
          }

          return forkJoin(requests).pipe(
            map(responses => {
              return responses.flatMap(response => response.items);
            })
          );
        }
      }),
      // Aplanamos el Observable anidado
      switchMap(result => result),
      catchError(error => {
        console.error('Error in getAllPersonsForkJoin:', error);
        return of([]);
      })
    );
  }

  getAllPersonsSimple(): Observable<Person[]> {
    return this.getPersons(1, 1000).pipe(
      map(response => response.items),
      catchError(error => {
        console.error('Error fetching persons:', error);
        return of([]);
      })
    );
  }
}
