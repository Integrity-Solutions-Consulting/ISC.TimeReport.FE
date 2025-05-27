import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { Data } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-customer-edit-modal',
  standalone: true,
  templateUrl: './customer-edit-modal.component.html',
  styleUrls: ['./customer-edit-modal.component.scss'],
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatFormFieldModule,
    MatOptionModule,
    MatInputModule,
    MatSelectModule,
    MatDialogContent,
    MatDialogTitle,
    MatDialogActions,
    MatButtonModule
  ]
})
export class CustomerEditModalComponent {
  editForm: FormGroup;
  identificationTypes = [
    { id: '1', name: 'Cédula' },
    { id: '2', name: 'RUC' },
    { id: '3', name: 'Pasaporte' }
  ];
  private customerId: number;

  constructor(
    public dialogRef: MatDialogRef<CustomerEditModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder
  ) {
    this.customerId = data.customer.id;
    this.editForm = this.fb.group({
      idtype: [data.customer.identificationType, Validators.required],
      idnumber: [data.customer.identificationNumber, Validators.required],
      commercialname: [data.customer.commercialName, Validators.required],
      companyname: [data.customer.companyName, Validators.required],
      phone: [data.customer.cellPhoneNumber, [
        Validators.required,
        Validators.pattern(/^[0-9]+$/)
      ]],
      email: [data.customer.email, [
        Validators.required,
        Validators.email
      ]]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.editForm.valid) {
      const updatedCustomer = {
        id: this.customerId,
        identificationType: this.editForm.value.idtype,
        identificationNumber: this.editForm.value.idnumber,
        commercialName: this.editForm.value.commercialname,
        companyName: this.editForm.value.companyname,
        cellPhoneNumber: this.editForm.value.phone,
        email: this.editForm.value.email
      };
      console.log(updatedCustomer);
      this.dialogRef.close(updatedCustomer);
    }
  }
}
