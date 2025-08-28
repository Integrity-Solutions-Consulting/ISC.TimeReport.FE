
export interface LeaderWithPerson {
  projectID: number;
  leadershipType: boolean;
  startDate: Date | null;
  endDate: Date | null;
  responsibilities: string;
  status: boolean;
  person: {
    genderId: number;
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
  items: LeaderWithIDandPerson[];
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

export interface LeaderAssignmentPayload {
  personID: number;
  personProjectMiddle: PersonProjectMiddle[];
}

export interface PersonProjectMiddle {
  projectID: number;
  leadershipType: boolean;
  startDate: string;
  endDate?: string;
  responsibilities?: string;
  status: boolean;
}

export interface LeaderAssignment {
  id: number;
  responsibility: string;
  startDate: string;
  endDate: string;
  leadershipType: boolean;
  status: boolean;
  projectos: any;
  projectId?: number;
  projectName?: string;
}

export interface LeaderGroup {
  person: {
    id: number;
    genderId: number;
    nationalityId: number;
    identificationTypeId: number;
    identificationNumber: string;
    personType: any;
    firstName: string;
    lastName: string;
    birthDate: string | null;
    email: string;
    phone: string;
    address: string;
    status: boolean;
  };
  leaderMiddle: LeaderAssignment[];
}

export interface Project {
  id: number;
  clientID: number;
  projectStatusID: number;
  projectTypeID: number;
  code: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  actualStartDate: string | null;
  actualEndDate: string | null;
  budget: number;
  hours: number;
  status: boolean;
}

export interface UniqueLeader {
  id: number;
  person: Person;
  projects: number[]; // IDs de proyectos a los que está asignado
  leadershipType: boolean;
  status: boolean;
}
