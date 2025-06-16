export interface Project {
  projectId: number,
  clientId: number,
  projectStatusId: number,
  code: string,
  name: string,
  description: string,
  startDate: Date,
  endDate: Date,
  actualStartDate: Date,
  actualEndDate: Date,
  budget: number
}
