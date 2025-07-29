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
  role: { id: number; roleName: string }[];
}

export interface Person {
  id: number;
  firstName: string;
  lastName: string;
  identificationNumber: string;
  email: string;
}

export interface Employee {
  id: number;
  person: Person;
  employeeCode: string;
  corporateEmail: string;
  status: boolean;
}

export interface EmployeePagedResponse {
  items: Employee[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}
