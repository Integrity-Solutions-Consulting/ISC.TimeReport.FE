export interface Project {
  id?: number,
  clientID: number,
  projectStatusID: number,
  code: string,
  name: string,
  description: string,
  startDate: Date,
  endDate: Date,
  actualStartDate?: Date,
  actualEndDate?: Date,
  budget: number,
  status: boolean
  assignedEmployees?: number[];
}

export interface ProjectWithID {
  id: number,
  clientID: number,
  projectStatusID: number,
  code: string,
  name: string,
  description: string,
  startDate: Date,
  endDate: Date,
  actualStartDate?: Date,
  actualEndDate?: Date,
  budget: number,
  status: boolean
}

export interface ApiResponse {
  items: Project[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponseByID {
  traceId: string;
  data: []
}

export interface ProjectDetails {
  id: number;
  clientID: number;
  projectStatusID: number;
  projectTypeID: number;
  code: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  actualStartDate: string;
  actualEndDate: string;
  budget: number;
  employeeProjects?: {
    id: number;
    employeeID: number;
    supplierID: number;
    assignedRole: string;
    costPerHour: number;
    allocatedHours: number;
    projectID: number;
    status: boolean;
  }[];
  employeesPersonInfo?: {
    id: number;
    personID: number;
    employeeCode: string;
    identificationNumber: string;
    firstName: string;
    lastName: string;
    status: boolean;
  }[];
}

export interface ResourceType {
  id: number;
  name: string;
}

export interface Provider {
  id: number;
  businessName: string;
  supplierType: {
    id: number;
    name: string;
  };
}

export interface EmployeeForProject {
  id: number;
  person: {
    firstName: string;
    lastName: string;
  };
  positionID: number;
}

export interface Position {
  id: number;
  positionName: string;
}
