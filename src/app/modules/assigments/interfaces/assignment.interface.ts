export interface SimpleProjectItem {
  id: number;
  clientID: number;
  projectStatusID: number;
  code: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  budget: number;
  // If GetAllProjects also returns employeeProjects or employeesPersonInfo, add them here.
  // Based on your current response, it seems it does not.
}

export interface AllProjectsResponse {
  items: SimpleProjectItem[]; // The array of projects is now under 'items'
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  // If there's a 'traceId' at this level, add it here.
  // Your example response doesn't show it directly, but your previous interface did.
  // Assuming it was on an outer wrapper if it existed.
  // If GetAllProjects returns { traceId: "...", data: { items: [...] }}
  // then AllProjectsResponse would be { traceId: string; data: { items: [...] } }
  // Based on the provided console output, the pagination properties are at the top level.
}

export interface ProjectDetail {
  id: number;
  clientID: number;
  projectStatusID: number;
  code: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  budget: number;
  employeeProjects?: EmployeeProject[];
  employeesPersonInfo?: EmployeePersonInfo[];
}

export interface EmployeeProject {
  id: number;
  employeeID: number;
  projectID: number;
  status: boolean;
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

export interface AssignmentDisplayData {
  projectName: string;
  projectCode: string;
  employeeName: string;
  employeeCode: string;
  identificationNumber: string;
  assignmentStatus: boolean; // Change from boolean to string
}
