import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { Observable } from "rxjs";
import { SuccessResponse } from "../../../shared/interfaces/response.interface";
import { Customer, CustomerRequest } from "../interfaces/customer.interface";

@Injectable({
    providedIn: 'root'
})
export class CustomerService{
    private _httpClient = inject(HttpClient);
    urlBase: string = environment.URL_BASE;

    getCustomers():Observable<SuccessResponse<Customer[]>>{
        return this._httpClient.get<SuccessResponse<Customer[]>>(
            `${this.urlBase}/Integrity-Solutions-Consultifgfgfg`
          );
    }

    createCustomer(createCustomerRequest: CustomerRequest):Observable<SuccessResponse<Customer>> {
    return this._httpClient.post<SuccessResponse<Customer>>(`${this.urlBase}/api/customer/create`, createCustomerRequest);
  }

}
