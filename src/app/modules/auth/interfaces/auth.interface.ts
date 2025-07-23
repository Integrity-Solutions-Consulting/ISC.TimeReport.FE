export interface LoginRequest {
  username: string;
  Password: string;
}

export interface AuthResponseData {
  token: string;
  userID: number;
  employeeID: number;
  roles: Role[];
  modules: Module[];
}

export interface AuthResponse {
  code: number;
  message: string;
  data: AuthResponseData;
}

export interface Role {
  roleName: string;
  id: number;
  description?: string;
  status?: boolean;
  modules?: Module[];
}

export interface Module {
  id: number;
  moduleName: string;
  modulePath: string;
  icon: string;
}
