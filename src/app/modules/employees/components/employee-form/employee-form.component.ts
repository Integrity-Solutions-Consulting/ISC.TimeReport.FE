import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

interface ContractType {
  value: number;
  viewValue: string;
}

@Component({
  selector: 'employee-form',
  standalone: true,
  providers: [
    provideNativeDateAdapter()
  ],
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatSelectModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './employee-form.component.html',
  styleUrl: './employee-form.component.scss'
})
export class EmployeeFormComponent {

  contractTypes: ContractType[] = [
    {value: 0, viewValue: 'Por Proyecto'},
    {value: 1, viewValue: 'Indefinido'}
  ];

  employeeForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.employeeForm = this.fb.group({
      employeeCode: [''],
      contractType: [''],
      hireDate: [''],
      terminationDate: [''],
      department: [''],
      corporateEmail: [''],
      salary: ['']
    });
  }
}
