import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { catchError, map, Observable, tap, throwError } from "rxjs";
import { SuccessResponse } from "../../../shared/interfaces/response.interface";
import { ApiResponse, Client, ClientRequest, ClientWithPerson, ClientWithPersonID, Person } from "../interfaces/client.interface";

@Injectable({
    providedIn: 'root'
})
export class ClientService{
    private http = inject(HttpClient);
    urlBase: string = environment.URL_BASE;

    getClients(pageNumber: number, pageSize: number, search: string = ''): Observable<ApiResponse> {
      let params = new HttpParams()
        .set('PageNumber', pageNumber.toString())
        .set('PageSize', pageSize.toString());

      if (search) {
        params = params.set('search', search);
      }
      return this.http.get<ApiResponse>(`${this.urlBase}/api/Client/GetAllClients`, {params});
    }

    getClientByID(id: number): Observable<Client> {
      return this.http.get<Client>(`${this.urlBase}/api/Client/GetClientByID/${id}`);
    }

    getClientId(id: number): Observable<any> {
      return this.http.get<any>(`${this.urlBase}/api/Client/GetClientByID/${id}`).pipe(
        tap(response => {
          console.log('Respuesta cruda del API:', response); // Debug
        }),
        map(response => {
          // Maneja ambos casos: con wrapper {data: ...} y respuesta directa
          const data = response.data || response;
          console.log('Datos extraídos:', data); // Debug
          return data;
        }),
        catchError(error => {
          console.error('Error en la solicitud:', error);
          return throwError(() => new Error(error));
        })
      );
    }

    createClientWithPerson(clientWithPersonRequest: ClientWithPerson): Observable<SuccessResponse<Client>> {
      return this.http.post<SuccessResponse<Client>>(`${this.urlBase}/api/Client/CreateClientWithPerson`, clientWithPersonRequest);
    }

    createClientWithPersonID(clientWithPersonIDRequest: ClientWithPersonID): Observable<SuccessResponse<Client>> {
      return this.http.post<SuccessResponse<Client>>(`${this.urlBase}/api/Client/CreateClientWithPersonID`, clientWithPersonIDRequest);
    }

    updateClientWithPerson(id: number, updateWithPersonRequest: ClientWithPerson): Observable<SuccessResponse<Client>> {
      return this.http.put<SuccessResponse<Client>>(`${this.urlBase}/api/Client/UpdateClientWithPerson/${id}`, updateWithPersonRequest);
    }

    updateClient(id: number, updateClientRequest: ClientRequest): Observable<SuccessResponse<Client>> {
      if (id === undefined || id === null || isNaN(id)) {
        throw new Error('ID de cliente no válido: ' + id);
      };
      const requestBody = {
        id: Number(id),
        ...updateClientRequest
      };
      return this.http.put<SuccessResponse<Client>>(`${this.urlBase}/api/Client/UpdateClientWithPerson/${id}`, requestBody);
    }

    inactivateClient(id: number, data: any): Observable<any> {
      return this.http.delete(`${this.urlBase}/api/Client/InactiveClientByID/${id}`);
    }

    activateClient(id: number, data: any): Observable<any> {
      return this.http.delete(`${this.urlBase}/api/Client/ActiveClientByID/${id}`);
    }
}
