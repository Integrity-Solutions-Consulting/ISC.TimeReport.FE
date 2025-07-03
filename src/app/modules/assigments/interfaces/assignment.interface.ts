export interface EmployeeProject {
  id: number;
  employeeID: number;
  projectID: number;
  status: boolean;
  // Agrega otros campos que necesites de tu tabla EmployeeProjects
  assignment_date?: Date;
  assignment_end_date?: Date;
}

export interface EmployeePersonInfo {
  id: number;
  personID: number;
  employeeCode: string;
  identificationNumber: string;
  firstName: string;
  lastName: string;
  status: boolean;
}

export interface ProjectDetail {
  id: number;
  clientID: number;
  projectStatusID: number;
  code: string;
  name: string;
  description: string;
  employeeProjects: EmployeeProject[];
  employeesPersonInfo: EmployeePersonInfo[];
}

export interface CombinedAssignment {
  employeeCode: string;
  fullName: string;
  identificationNumber: string;
  assignmentDate: Date;
  status: string;
}

interface ApiResponse {
  traceId?: string;
  data?: {
    employeeProjects?: EmployeeProject[];
    employeesPersonInfo?: EmployeePersonInfo[];
  };
  // Posibles propiedades cuando no hay 'data'
  employeeProjects?: EmployeeProject[];
  employeesPersonInfo?: EmployeePersonInfo[];
}
