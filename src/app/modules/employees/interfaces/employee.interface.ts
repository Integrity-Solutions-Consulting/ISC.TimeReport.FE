export interface Employee {
  genderID?: number | null;
  nationalityID?: number | null;
  identificationTypeId?: number | null;
  identificationNumber: string;
  firstName: string;
  lastName: string;
  birthDate?: Date | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;

  positionID?: number | null;
  employeeCode: string;
  hireDate: Date;
  contractType: boolean;
  department?: string | null;
  salary?: number | null;
}
