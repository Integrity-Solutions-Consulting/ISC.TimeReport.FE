export interface LoginRequest {
  email: string;
  Password: string;
}

export interface AuthResponse {
  code: number;
  message: string;
  data: {
    token: string;
    email: string;
    names: string | null;
    surnames: string | null;
  };
}