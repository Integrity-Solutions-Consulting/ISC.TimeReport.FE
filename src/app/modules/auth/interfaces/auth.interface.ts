export interface LoginRequest {
  email: string;
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
    menus: Menu[];
  };
}

export interface Role {
  id: number;
  rolName: string;
}

export interface Menu {
  id: number;
  nombreMenu: string;
  rutaMenu: string;
}
