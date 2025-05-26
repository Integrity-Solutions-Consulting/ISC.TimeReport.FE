import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { Data } from '@angular/router';

@Component({
  selector: 'app-customer-edit-modal',
  standalone: true,
  templateUrl: './customer-edit-modal.component.html',
  styleUrls: ['./customer-edit-modal.component.scss'],
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatFormFieldModule,
    MatOptionModule
  ]
})
export class CustomerEditModalComponent {
  editForm: FormGroup;
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
      this.dialogRef.close(updatedCustomer);
    }
  }
}
