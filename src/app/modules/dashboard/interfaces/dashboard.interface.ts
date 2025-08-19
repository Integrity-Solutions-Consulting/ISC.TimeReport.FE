export interface Project {
  colaborador: string;
  proyecto: string;
  cliente: string;
  liderTecnico: string;
  fechaInicio: string;
  fechaFinalizacion: string;
}

export interface ResumenGeneralResponse {
  totalProyectosActivos: number;
  totalClientes: number;
  totalEmpleados: number;
  proyectosPlanificacion: number;
  proyectosAprobados: number;
  proyectosEnProgreso: number;
  proyectosEnEspera: number;
  proyectosCancelados: number;
  proyectosCompletos: number;
  proyectosAplazados: number;
}