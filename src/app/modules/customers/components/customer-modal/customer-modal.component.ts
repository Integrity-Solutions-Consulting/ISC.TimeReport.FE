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
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-customer-edit-modal',
  standalone: true,
  templateUrl: './customer-modal.component.html',
  styleUrls: ['./customer-modal.component.scss'],
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
export class CustomerModalComponent {

  customerForm!: FormGroup;

  isEditMode: boolean = false;

  identificationTypes = [
    { id: '1', name: 'Cédula' },
    { id: '2', name: 'RUC' },
    { id: '3', name: 'Pasaporte' }
  ];
  private customerId: number;

  constructor(
    public dialogRef: MatDialogRef<CustomerModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder
  ) {
    const customerData = data?.customer || {};

    this.customerId = customerData.id || null;
    this.isEditMode = !!customerData.id;

    this.initializeForm(customerData);

  }

  private initializeForm(customerData: any): void {
    this.customerForm = this.fb.group({
      idtype: [customerData.identificationType, Validators.required],
      idnumber: [customerData.cdentificationNumber, Validators.required],
      commercialname: [customerData.commercialName, Validators.required],
      companyname: [customerData.companyName, Validators.required],
      phone: [customerData.cellPhoneNumber, [
        Validators.required,
        Validators.pattern(/^[0-9]+$/)
      ]],
      email: [customerData.email, [
        Validators.required,
        Validators.email
      ]]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.customerForm.valid) {
      const updatedCustomer = {
        id: this.customerId,
        identificationType: this.customerForm.value.idtype,
        identificationNumber: this.customerForm.value.idnumber,
        commercialName: this.customerForm.value.commercialname,
        companyName: this.customerForm.value.companyname,
        cellPhoneNumber: this.customerForm.value.phone,
        email: this.customerForm.value.email
      };
      console.log(updatedCustomer);
      this.dialogRef.close(updatedCustomer);
    }
  }
}
