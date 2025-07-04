import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private _httpClient = inject(HttpClient);
  private urlBase: string = environment.URL_TEST;

  // menu.service.ts
    getMenuByRoles(roles: string[]) {
    return this._httpClient.post<string[]>(this.urlBase + '/menus/porRoles', { roles });
    }

}