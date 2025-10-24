// models/projection.model.ts
export interface Projection {
  groupProjection: string;
  resourceTypeId: number;
  resourceTypeName: string;
  resource_name: string;
  projection_name: string;
  hourly_cost: number;
  resource_quantity: number;
  time_distribution: string;
  total_time: number;
  resource_cost: number;
  participation_percentage: number;
  period_type: boolean;
  period_quantity: number;
}

export interface ProjectionGroup {
  groupId: string;
  projections: Projection[];
  totalResources: number;
  totalCost: number;
  resourceTypesCount: number;
}
