import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { map, Observable } from "rxjs";
import { SuccessResponse } from "../../../shared/interfaces/response.interface";
import { Customer, CustomerRequest } from "../interfaces/customer.interface";

@Injectable({
    providedIn: 'root'
})
export class CustomerService{
    private _httpClient = inject(HttpClient);
    urlBase: string = environment.URL_BASE;

    getCustomers():Observable<Customer[]>{
        return this._httpClient.get<Customer[]>(
            `${this.urlBase}/api/customer/get`
          );
    }

    createCustomer(createCustomerRequest: CustomerRequest):Observable<SuccessResponse<Customer>> {
      return this._httpClient.post<SuccessResponse<Customer>>(`${this.urlBase}/api/customer/create`, createCustomerRequest);
    }

    updateCustomer(id: number, updateCustomerRequest: CustomerRequest): Observable<SuccessResponse<Customer>> {
      if (id === undefined || id === null || isNaN(id)) {
        throw new Error('ID de cliente no válido: ' + id);
      };
      const requestBody = {
        id: Number(id),
        ...updateCustomerRequest
      };
      console.log('Enviando actualización:', requestBody);
      return this._httpClient.put<SuccessResponse<Customer>>(`${this.urlBase}/api/customer/update/${id}`, requestBody);
    }
}
