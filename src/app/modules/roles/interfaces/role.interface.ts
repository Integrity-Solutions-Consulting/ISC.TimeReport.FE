import { Module, Role } from "../../auth/interfaces/auth.interface";

export interface User {
  id: number;
  employeeID: number;
  username: string;
  lastLogin?: string;
  isActive: boolean;
  role: Role[];
  module: Module[];
}

export interface GetAllUsersResponse {
  traceId: string;
  data: User[];
}

export interface UserWithFullName extends User {
  fullName: string;
}
