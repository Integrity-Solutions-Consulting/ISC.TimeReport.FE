export interface Holiday {
  id: number,
  holidayName: string,
  holidayDate: string,
  isRecurring: boolean,
  holidayType: string,
  description: string,
  status: boolean
}

export interface HolidayResponse {
  data: Holiday;
  code: number;
  message: string;
}
