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
