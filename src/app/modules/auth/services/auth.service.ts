import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { Observable, tap } from "rxjs";
import { LoginRequest, AuthResponse } from "../interfaces/auth.interface";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _httpClient = inject(HttpClient);
  private urlBase: string = environment.URL_TEST;

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this._httpClient.post<AuthResponse>(`${this.urlBase}/api/auth/login`, credentials).pipe(
      tap((response: any) => {
        localStorage.setItem('token', response.token); // Guarda el token
      })
    );
    //return this._httpClient.post<AuthResponse>(`localhost:44392/api/Auth/login`, credentials);
  }

  getMenusByRoles(roles: string[]): Observable<string[]> {
  return this._httpClient.post<string[]>('https://.com/api/menus/roles', { roles });
}

}
