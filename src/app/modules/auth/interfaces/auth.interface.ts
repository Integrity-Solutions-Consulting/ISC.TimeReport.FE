export interface LoginRequest {
  Username: string;
  Password: string;
}

export interface AuthResponse {
  code: number;
  message: string;
  data: {
    token: string;
    username: string;
    names: string | null;
    surnames: string | null;
    email: string | null;
  };
}