export interface LoginRequest {
  username: string;
  Password: string;
}

export interface AuthResponse {
  code: number;
  message: string;
  data: {
    email: string;
    names: string | null;
    surnames: string | null;
    corr: string | null;
    token: string;
    roles: Role[];
    modules: Modules[];
  };
}

export interface Role {
  id: number;
  rolName: string;
}

export interface Modules {
  id: number;
  moduleName: string;
  modulePath: string;
}
