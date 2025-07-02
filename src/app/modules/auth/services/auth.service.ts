import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { Observable, catchError, map, of, tap } from "rxjs";
import { LoginRequest, AuthResponse, Role } from "../interfaces/auth.interface";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _httpClient = inject(HttpClient);
  private urlBase: string = environment.URL_BASE;
  private _isAuthenticated = signal<boolean>(false);
  private _userMenus = signal<string[]>([]);

  constructor() {
    this.initializeAuthState();
  }

  // Inicializa el estado de autenticación al cargar el servicio
  private initializeAuthState(): void {
    const token = this.getToken();
    const menus = this.getMenus();
    this._isAuthenticated.set(!!token);
    this._userMenus.set(menus || []);
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this._httpClient.post<AuthResponse>(
      `${this.urlBase}/api/auth/login`,
      credentials
    ).pipe(
      tap((response: AuthResponse) => {
        console.log('Login response:', response); // Para debug
        if (response.code !== 200) { // Asumo que 200 es el código de éxito
          throw new Error(response.message);
        }
        this.setSession(response);
        this._isAuthenticated.set(true);
      }),
      catchError(error => {
        this.clearSession();
        throw error;
      })
    );
  }

  logout(): void {
    this.clearSession();
    this._isAuthenticated.set(false);
    this._userMenus.set([]);
  }

  isAuthenticated(): boolean {
    return this._isAuthenticated();
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getMenus(): string[] {
    const menus = localStorage.getItem('menus');
    return menus ? JSON.parse(menus) : [];
  }

  // Nuevo método para verificar permisos
  checkRoutePermission(requestedUrl: string): boolean {
    const menus = this._userMenus();
    return menus.some(menu => requestedUrl.startsWith(menu));
  }

  // Nuevo método para obtener los menús desde el backend
  loadUserMenus(): Observable<string[]> {
    // Asumiendo que tienes un endpoint para esto
    return this._httpClient.get<string[]>(`${this.urlBase}/api/user/menus`).pipe(
      tap(menus => {
        this._userMenus.set(menus);
        localStorage.setItem('menus', JSON.stringify(menus));
      })
    );
  }

  private setSession(authResult: AuthResponse): void {
    if (!authResult.data?.token) {
      throw new Error('Invalid authentication response: token is missing');
    }

    // Guardar token
    localStorage.setItem('token', authResult.data.token);

    // Guardar información del usuario si es necesario
    localStorage.setItem('user', JSON.stringify({
      email: authResult.data.email,
      names: authResult.data.names,
      surnames: authResult.data.surnames
    }));

    // Convertir módulos a rutas de menú
    const menuPaths = authResult.data.modules.map(module => module.modulePath);
    localStorage.setItem('menus', JSON.stringify(menuPaths));
    this._userMenus.set(menuPaths);
  }

  private clearSession(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('menus');
  }

  getCurrentUser(): {
    email: string;
    names: string | null;
    surnames: string | null;
  } | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  // Para obtener los roles del usuario
  getCurrentRoles(): Role[] {
    const roles = localStorage.getItem('roles');
    return roles ? JSON.parse(roles) : [];
  }
}
