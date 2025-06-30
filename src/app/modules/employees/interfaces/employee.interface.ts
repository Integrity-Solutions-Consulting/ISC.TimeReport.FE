export interface Person {
  id: number;
  genderId: number;
  nationalityId: number;
  identificationTypeId: number;
  identificationNumber: string;
  personType: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  email: string;
  phone: string;
  address: string;
}

export interface Employee {
  id: number;
  person: Person;
  positionID?: number | null;
  employeeCode: string;
  hireDate: Date;
  terminationDate: Date;
  contractType: boolean;
  status: boolean;
  department?: string | null;
  salary?: number | null;
}

export interface EmployeeWithPerson {
  positionID: number;
  employeeCode: string;
  hireDate: Date;
  terminationDate: Date;
  contractType: boolean;
  department: string;
  corporateEmail: string;
  salary: number;
  status: boolean;
  person: {
      genderId: number;
      nationalityId: number;
      identificationTypeId: number;
      identificationNumber: string;
      personType: string;
      firstName: string;
      lastName: string;
      birthDate: string;
      email: string;
      phone: string;
      address: string;
    }
}

export interface EmployeeWithIDandPerson {
  id: number;
  positionID: number;
  employeeCode: string;
  hireDate: Date;
  terminationDate: Date;
  contractType: boolean;
  department: string;
  corporateEmail: string;
  salary: number;
  status: boolean;
  person: {
      genderId: number;
      nationalityId: number;
      identificationTypeId: number;
      identificationNumber: string;
      personType: string;
      firstName: string;
      lastName: string;
      birthDate: string;
      email: string;
      phone: string;
      address: string;
    }
}

export interface EmployeeWithPersonID {
    personID: number;
    positionID: number;
    employeeCode: string;
    hireDate: Date;
    terminationDate: Date;
    contractType: boolean;
    department: string;
    corporateEmail: string;
    salary: number;
}

export interface ApiResponse {
  items: Employee[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface PersonApiResponse {
  items: Person[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}
