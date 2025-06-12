import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

interface IdentificationTypeid {
  value: number;
  viewValue: string;
}

interface Gender {
  value: string;
  viewValue: string;
}

interface Nationality {
  value: number;
  viewValue: string;
}

interface PersonType {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'person-form',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    FormsModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './person-form.component.html',
  styleUrl: './person-form.component.scss'
})
export class PersonFormComponent {

  //@Input() parentForm!: FormGroup;
  personForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.personForm = this.fb.group({
      identificationType: [''],
      identificationNumber: [''],
      gender: [''],
      personType: [''],
      nationality: [''],
      firstName: [''],
      lastName: [''],
      birthDate: [''],
      phone: [''],
      email: [''],
      address: [''],
    });
  }

  types: IdentificationTypeid[] = [
    {value: 1, viewValue: 'Cédula'},
    {value: 2, viewValue: 'Pasaporte'},
    {value: 3, viewValue: 'RUC'},
  ];

  genders: Gender[] = [
    {value: 'M', viewValue: 'Masculino'},
    {value: 'F', viewValue: 'Femenino'}
  ]

  nationalities: Nationality[] = [
    {value: 1, viewValue: 'Argentina'},
    {value: 2, viewValue: 'Bolivia'},
    {value: 3, viewValue: 'Chile'},
    {value: 4, viewValue: 'Colombia'},
    {value: 5, viewValue: 'Ecuador'},
    {value: 6, viewValue: 'Paraguay'},
    {value: 7, viewValue: 'Perú'},
    {value: 8, viewValue: 'Uruguay'},
    {value: 9, viewValue: 'Venezuela'},
  ]

  personType: PersonType[] = [
    {value: 'NATURAL', viewValue: 'Natural'},
    {value: 'JURIDICA', viewValue: 'Jurídica'}
  ]

}
