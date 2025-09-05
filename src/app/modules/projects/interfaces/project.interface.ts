export interface Project {
  clientID: number;
  projectStatusID: number;
  projectTypeID: number;
  code: string;
  name: string;
  description: string;
  startDate: string; // ISO string
  endDate: string;   // ISO string
  actualStartDate: string | null;
  actualEndDate: string | null;
  budget: number;
  hours: number;
  status: boolean;
  waitingStartDate?: string | null; // New optional field
  waitingEndDate?: string | null;   // New optional field
  observation?: string | null;  // New optional field
}

export interface ProjectWithID {
  id: number,
  clientID: number;
  projectStatusID: number;
  projectTypeID: number;
  code: string;
  name: string;
  description: string;
  startDate: string; // ISO string
  endDate: string;   // ISO string
  actualStartDate: string | null;
  actualEndDate: string | null;
  budget: number;
  hours: number;
  status: boolean;
  waitingStartDate?: string | null; // New optional field
  waitingEndDate?: string | null;   // New optional field
  observation?: string | null;  // New optional field
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

export interface EmployeeProjectMiddle {
  employeeId?: number | null;  // Nota: employeeId (sin mayúscula D)
  supplierID?: number | null;
  assignedRole: string;
  costPerHour: number;
  allocatedHours: number;
  id?: number;                // Solo para actualizaciones
  status?: boolean;           // Solo para actualizaciones
}

export interface EmployeeProject {
  id?: number;
  employeeID?: number | null;
  supplierID?: number | null;
  assignedRole: string;
  costPerHour: number;
  allocatedHours: number;
  projectID: number;
  status: boolean;
  markedForDeletion?: boolean;
}

export interface ResourceAssignmentPayload {
  projectID: number;
  employeeProjectMiddle: EmployeeProjectMiddle[];  // Nota: minúscula
}

export interface EmployeePersonInfo {
  id: number;
  personID: number;
  workModeID?: number; // Añadido workModeID basado en tu respuesta anterior
  employeeCode: string;
  identificationNumber: string;
  firstName: string;
  lastName: string;
  status: boolean;
}

export interface ProjectDetails {
  id: number;
  clientID: number;
  projectStatusID: number;
  projectTypeID: number | null; // Puede ser null
  code: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  actualStartDate: string | null; // Puede ser null
  actualEndDate: string | null;   // Puede ser null
  budget: number;
  hours: number; // Asegúrate de incluirlo si tu API lo envía
  status: boolean; // Si tu API lo envía

  employeeProjects?: EmployeeProject[]; // Marcado como opcional con '?', ya que tu API a veces no lo envía
  employeesPersonInfo?: EmployeePersonInfo[]; // Marcado como opcional con '?'
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

export interface ProjectDetail {
  id: number;
  clientID: number;
  projectStatusID: number;
  code: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  budget: number;
  employeeProjects: EmployeeProject[]; // Non-nullable array
  employeesPersonInfo: EmployeePersonInfo[];   // Non-nullable array
  // Add other properties as needed
}

export interface AllProjectsResponse {
  items: SimpleProjectItem[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface SimpleProjectItem {
  id: number;
  name: string;
  // ... any other properties for simple project items
}

export interface Role {
  id: number;
  roleName: string;
}

export interface ApiResponseData {
  items: ProjectWithID[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}
