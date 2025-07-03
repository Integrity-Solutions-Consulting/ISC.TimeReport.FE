export interface LoginRequest {
  username: string;
  Password: string;
}

export interface AuthResponseData {
  token: string;
  email: string;
  names: string;
  surnames: string;
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
  roleID?: number;
  description?: string;
  status?: boolean;
}

export interface Module {
  id: number;
  moduleName: string;
  modulePath: string;
}
