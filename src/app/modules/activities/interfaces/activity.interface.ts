export interface Activity {
  id: number;
  employeeID: number;
  projectID: number;
  activityTypeID: number;
  hoursQuantity: number;
  activityDate: Date; // O Date si lo conviertes
  activityDescription: string;
  notes: string;
  isBillable: boolean;
  approvedByID: number | null;
  approvalDate: Date | null; // O Date si lo conviertes
  requirementCode: string;
  status: boolean;
}

export interface ApiResponse {
  data: Activity[];
  code: number;
  message: string;
}

export interface ProjectDetail {
  name: string;
  clientID: number;
  employeesPersonInfo: {
    firstName: string;
    lastName: string;
    identificationNumber: string;
  }[];
}

export interface ClientDetail {
  tradeName: string;
  legalName: string;
}

export interface LeaderDetail {
  person: {
    firstName: string;
    lastName: string;
  };
}

export interface Collaborator {
  employeeID: number;
  nombre: string;
  cedula: string;
  proyecto: string;
  cliente: string;
  lider: string;
  horas: number;
  estado: string;
}

export interface ActivityType {
  id: number;
  name: string;
  description: string;
  colorCode: string;
}
