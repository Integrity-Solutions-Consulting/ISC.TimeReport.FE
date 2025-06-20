export interface Project {
  projectId?: number,
  clientID: number,
  projectStatusID: number,
  code: string,
  name: string,
  description: string,
  startDate: Date,
  endDate: Date,
  actualStartDate?: Date,
  actualEndDate?: Date,
  budget: number
}

export interface ApiResponse {
  items: Project[];       // Array de proyectos
  totalItems: number;     // Total de ítems
  pageNumber: number;     // Página actual
  pageSize: number;       // Ítems por página
  totalPages: number;     // Total de páginas
}
