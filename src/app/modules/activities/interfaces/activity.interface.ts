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
  status: boolean;
}

export interface ApiResponse {
  data: Activity[];
  code: number;
  message: string;
}

