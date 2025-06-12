export interface Person {
  GenderID?: number;
  NationalityID?: number;
  IdentificationTypeid?: number;
  identification_number: string;
  person_type: 'NATURAL' | 'JURIDICA';
  first_name: string;
  last_name: string;
  birth_date?: Date;
  email?: string;
  phone?: string;
  address?: string;
}
