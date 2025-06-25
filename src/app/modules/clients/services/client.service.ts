import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { map, Observable } from "rxjs";
import { SuccessResponse } from "../../../shared/interfaces/response.interface";
import { ApiResponse, Client, ClientRequest, Person } from "../interfaces/client.interface";

@Injectable({
    providedIn: 'root'
})
export class ClientService{
    private http = inject(HttpClient);
    urlBase: string = environment.URL_TEST;

    getClients(): Observable<ApiResponse> {
      console.log(`${this.urlBase}api/Client/GetAllClients`);
          return this.http.get<ApiResponse>(`${this.urlBase}api/Client/GetAllClients`);
        }

    createClient(createClientRequest: ClientRequest):Observable<SuccessResponse<Client>> {
      return this.http.post<SuccessResponse<Client>>(`${this.urlBase}api/Client/CreateClientWithPerson`, createClientRequest);
    }

    updateClient(id: number, updateClientRequest: ClientRequest): Observable<SuccessResponse<Client>> {
      if (id === undefined || id === null || isNaN(id)) {
        throw new Error('ID de cliente no válido: ' + id);
      };
      const requestBody = {
        id: Number(id),
        ...updateClientRequest
      };
      return this.http.put<SuccessResponse<Client>>(`${this.urlBase}api/Client/UpdateClientWithPerson/${id}`, requestBody);
    }
}
