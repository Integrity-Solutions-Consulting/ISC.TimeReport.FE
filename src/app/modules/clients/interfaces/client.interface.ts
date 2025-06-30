export interface ClientRequest{
    name:  string;
    phone:  string;
    email:  string;
}

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

export interface Client {
  id: number;
  person: Person;
  tradeName: string;
  legalName: string;
  status: boolean;
}

export interface ClientWithPerson {
    tradeName: string;
    legalName: string;
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

export interface ClientWithIDandPerson {
  id: number;
    tradeName: string;
    legalName: string;
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

export interface ClientWithPersonID {
    personID: number;
    tradeName: string;
    legalName: string;
}

export interface ApiResponse {
  items: Client[];
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
