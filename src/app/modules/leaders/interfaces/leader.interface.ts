export interface LeaderwPerson {
  identificationType: string;
  identificationNumber: string;
  names: string;
  surnames: string;
  cellPhoneNumber?: string;
  position?: string;
  personalEmail?: string;
  corporateEmail: string;
  homeAddress?: string;
  leaderType: string;
  projectCode: string;
  customerCode: string;
}

export interface Leader {
    id:               number;
    leaderType:       string;
    projectCode:      string;
    customerCode:     string;
    idPerson:         number;
}

export interface Person {
  identificationType: string;
  identificationNumber: string;
  names: string;
  surnames: string;
  cellPhoneNumber: string;
  position: string;
  personalEmail: string;
  corporateEmail: string;
  homeAddress: string;
}
