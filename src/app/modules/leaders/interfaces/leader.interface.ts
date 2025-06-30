export interface LeaderWithPerson {
  projectID: number;
  leadershipType: boolean;
  startDate: Date;
  endDate: Date;
  responsibilities: string;
  status: boolean;
  person: {
    genderID: number;
    nationalityId: number;
    identificationTypeId: number;
    identificationNumber: string;
    personType: string;
    firstName: string;
    lastName: string;
    birthDate: Date;
    email: string;
    phone: string;
    address: string;
  }
}

export interface LeaderWithIDandPerson{
  id: number;
  projectID: number;
  leadershipType: boolean;
  startDate: Date;
  endDate: Date;
  responsibilities: string;
  status: boolean;
  person: {
    id: number;
    genderID: number;
    nationalityId: number;
    identificationTypeId: number;
    identificationNumber: string;
    personType: string;
    firstName: string;
    lastName: string;
    birthDate: Date;
    email: string;
    phone: string;
    address: string;
  }
}

export interface LeaderWithPersonID {
  personID: number;
  projectID: number;
  leadershipType: boolean;
  startDate: Date;
  endDate: Date;
  responsibilities: string;
  status: boolean;

}

export interface Leader {
  person: Person;
  projectID: number;
  leadershipType: boolean;
  startDate: Date;
  endDate: Date;
  status: boolean;
  responsibilities: string;
}

export interface Person {
  id: number;
  genderID: number;
  nationalityId: number;
  identificationTypeId: number;
  identificationNumber: string;
  personType: string;
  firstName: string;
  lastName: string;
  birthDate: Date;
  email: string;
  phone: string;
  address: string;
}

export interface ApiResponse {
  items: Leader[];
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

interface Project {
  id: number;
  clientID: number;
  projectStatusID: number;
  code: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  actualStartDate: string;
  actualEndDate: string;
  budget: number;
  status: boolean;
}
