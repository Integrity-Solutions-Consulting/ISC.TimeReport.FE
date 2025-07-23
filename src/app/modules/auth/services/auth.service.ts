import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { BehaviorSubject, Observable, catchError, map, of, switchMap, tap, throwError } from "rxjs";
import { LoginRequest, AuthResponse, Role, Module } from "../interfaces/auth.interface";
import { UserWithFullName } from "../../roles/interfaces/role.interface";
import { EmployeeWithPerson } from "../../employees/interfaces/employee.interface";
import { jwtDecode } from "jwt-decode";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _httpClient = inject(HttpClient);
  private urlBase: string = environment.URL_BASE;
  private _isAuthenticated = signal<boolean>(false);
  private _userMenus = signal<string[]>([]);
  private _userRoles = signal<Role[]>([]);
  private usernameSubject = new BehaviorSubject<string>(this.getUsernameFromStorage());
  username$ = this.usernameSubject.asObservable();
  private currentEmployeeId = new BehaviorSubject<number | null>(null);

  constructor() {
    this.initializeAuthState();
    this.loadInitialData();
  }

  // Inicializa el estado de autenticación al cargar el servicio
  private initializeAuthState(): void {
    const token = this.getToken();
    const menus = this.getMenus();
    const roles = this.getRoles();
    this._isAuthenticated.set(!!token);
    this._userMenus.set(menus || []);
    //this._userRoles.set(roles || []);
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
    this._userRoles.set([]);
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
    console.log(menus);
  }

  /*getRoles(): Role[] {
    try {
      const roles = localStorage.getItem('roles');

      if (!roles) {
        return [];
      }

      const parsedRoles = JSON.parse(roles);

      // Validación adicional para asegurar que es un array
      if (!Array.isArray(parsedRoles)) {
        console.error('Los roles almacenados no tienen el formato correcto');
        return [];
      }

      // Validación opcional de la estructura de cada rol
      if (parsedRoles.length > 0 && !parsedRoles[0].id) {
        console.error('La estructura de los roles no es válida');
        return [];
      }

      return parsedRoles;
    } catch (error) {
      console.error('Error al parsear los roles del localStorage:', error);
      return [];
    }
  }*/

  getCurrentUserRoles(): Role[] {
    return this._userRoles();
  }

  hasRole(requiredRoleNames: string[]): boolean {
    if (!this.isAuthenticated()) {
      return false;
    }
    const userRoles = this.getCurrentUserRoles();
    return requiredRoleNames.some(requiredRoleName =>
      userRoles.some(userRole => userRole.roleName === requiredRoleName)
    );
  }

  // Nuevo método para verificar permisos
  checkRoutePermission(requestedUrl: string): boolean {
    const menus = this._userMenus();
    return menus.some(menu => requestedUrl.startsWith(menu));
  }

  loadUserMenus(): Observable<string[]> {
    // Esto es útil si los menús no vienen en el login y necesitas un endpoint dedicado
    return this._httpClient.get<string[]>(`${this.urlBase}/api/user/menus`).pipe(
      tap(menus => {
        this._userMenus.set(menus);
        localStorage.setItem('menus', JSON.stringify(menus));
        console.log('menus', menus)
      }),
      catchError(error => {
        console.error('Error loading user menus:', error);
        return of([]); // Retorna un observable vacío o maneja el error
      })
    );
  }

  private setSession(authResult: AuthResponse): void {
    if (!authResult.data?.token) {
      throw new Error('Invalid authentication response: token is missing');
    }

    // Guardar token
    localStorage.setItem('token', authResult.data.token);
    localStorage.setItem('employeeID', authResult.data.employeeID.toString());

    // Obtener información del empleado usando el employeeID
    this.getEmployeeInfo(authResult.data.employeeID).subscribe(employee => {
      if (employee) {
        const fullName = `${employee.person.firstName} ${employee.person.lastName}`;
        localStorage.setItem('userFullName', fullName);
        this.usernameSubject.next(fullName);
      }
    });

    // Guardar información del usuario
    localStorage.setItem('user', JSON.stringify({
      userID: authResult.data.userID,
      employeeID: authResult.data.employeeID
    }));

    // Convertir módulos a rutas de menú
    const menuPaths = authResult.data.modules.map((module: Module) => module.modulePath);
    localStorage.setItem('menus', JSON.stringify(menuPaths));
    this._userMenus.set(menuPaths);

    localStorage.setItem('roles', JSON.stringify(authResult.data.roles));
    this._userRoles.set(authResult.data.roles);
  }

  private getEmployeeInfo(employeeID: number): Observable<any> {
    return this._httpClient.get<EmployeeWithPerson>(
      `${this.urlBase}/api/Employee/GetEmployeeByID/${employeeID}`
    ).pipe(
      catchError(() => of(null))
    );
  }

  private clearSession(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('menus');
    localStorage.removeItem('roles');
    localStorage.removeItem('user');
  }

  getCurrentUser(): {
    email: string;
    names: string | null;
    surnames: string | null;
  } | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  // Mantengo este método, pero el nuevo 'getCurrentUserRoles' usando signals es preferible
  // para reactividad si lo necesitas.
  // getCurrentRoles(): Role[] {
  //   const roles = localStorage.getItem('roles');
  //   return roles ? JSON.parse(roles) : [];
  // }

  requestPasswordRecovery(username: string): Observable<any> {
    return this._httpClient.post(`${this.urlBase}/api/auth/recuperar-password`, { username });
  }

  resetPassword(token: string, newPassword: string, confirmPassword: string): Observable<any> {
    return this._httpClient.post(`${this.urlBase}/api/auth/reset-password?token=${token}`, { newPassword, confirmPassword });
  }

  getRoles(): Observable<Role[]> {
    return this._httpClient.get<{data: Role[]}>(`${this.urlBase}/api/auth/GetRoles`).pipe(
      map(response => response.data)
    );
  }

  createRole(role: {roleName: string, description: string, moduleIds: number[]}): Observable<any> {
    return this._httpClient.post(`${this.urlBase}/api/auth/roles`, role);
  }

  updateRole(id: number, role: {roleName: string, description: string, moduleIds: number[]}): Observable<any> {
    return this._httpClient.put(`${this.urlBase}/api/auth/UpdateRole/${id}`, role);
  }

  assignRolesToUser(userID: number, rolesIDs: number[]): Observable<boolean> {
    const payload = {
        userID: Number(userID),
        rolesIDs: rolesIDs.map(id => Number(id))
    };

    return this._httpClient.post(`${this.urlBase}/api/users/AssignRolesToUser`, payload).pipe(
      map((response: any) => {
        // Asume éxito si no hay error
        return true;
      }),
      catchError(error => {
        console.error('Error en asignación:', error);
        return of(false);
      })
    );
  }

  private enrichUserData(user: UserWithFullName): Observable<UserWithFullName> {
    if (!user?.employeeID) {
      return of({
        ...user,
        fullName: 'Nombre no disponible'
      });
    }

    return this._httpClient.get<EmployeeWithPerson>(
      `${this.urlBase}/api/Employee/GetEmployeeByID/${user.employeeID}`
    ).pipe(
      map(employee => ({
        ...user,
        fullName: `${employee.person.firstName} ${employee.person.lastName}`
      })),
      catchError(() => of({
        ...user,
        fullName: 'Nombre no disponible'
      }))
    );
  }

  private getUpdatedUser(userID: number): Observable<UserWithFullName> {
    return this._httpClient.get<UserWithFullName>(
      `${this.urlBase}/api/users/${userID}`
    ).pipe(
      switchMap(user => this.enrichUserData(user))
    );
  }

  private loadInitialData(): void {
    const employeeId = localStorage.getItem('employeeID');
    if (employeeId) {
      this.currentEmployeeId.next(parseInt(employeeId, 10));
    }
  }

  getRolesOfUser(userId: number): Observable<any> {
    return this._httpClient.get(`${this.urlBase}/api/users/GetRolesOfUser/${userId}`);
  }

  getDecodedToken(): any {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token not found in localStorage'); // O maneja el caso como prefieras
    }
    return jwtDecode(token);
  }

  getEmployeeId(): number | null {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const decoded = jwtDecode(token) as { EmployeeID?: number };
      return decoded.EmployeeID || null;
    } catch {
      return null;
    }
  }

  getUsernameFromStorage(): string {
    return localStorage.getItem('userFullName') || 'Usuario';
  }

  getUsername(): string {
    return this.getUsernameFromStorage();
  }

  updateUsername(): void {
    this.usernameSubject.next(this.getUsernameFromStorage());
  }

  public getCurrentEmployeeId(): number | null {
    return this.currentEmployeeId.value;
  }

}
