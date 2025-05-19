import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { Observable } from "rxjs";
import { SuccessResponse } from "../../../shared/interfaces/response.interface";

@Injectable({
    providedIn: 'root'
})
export class CustomerService{
    private _httpClient = inject(HttpClient);
    urlBase: string = environment.URL_API;


}