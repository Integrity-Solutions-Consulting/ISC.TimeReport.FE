import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-leader-edit-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatButtonModule,
    MatDialogActions,
    MatDialogContent,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule
  ],
  templateUrl: './leader-edit-modal.component.html',
  styleUrl: './leader-edit-modal.component.scss'
})
export class LeaderEditModalComponent {

  editForm: FormGroup;

  identificationTypes = [
    { id: '1', name: 'Cédula' },
    { id: '2', name: 'RUC' },
    { id: '3', name: 'Pasaporte' }
  ];

  genders = [
    { id: 'M', name: 'Masculino' },
    { id: 'F', name: 'Femenino' }
  ];

  leaderTypes = [
    { id: '1', name: 'Integrity'},
    { id: '2', name: 'Externo'}
  ];

  private leaderId: number;

  constructor(
    public dialogRef: MatDialogRef<LeaderEditModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder
  ) {
    this.leaderId = data.leader.id;
    this.editForm = this.fb.group({
        idtype: [data.leader.identificationType, Validators.required],
        idnumber: [data.leader.identificationNumber, Validators.required],
        names: [data.leader.names],
        surnames: [data.leader.surnames],
        gender: [data.leader.gender],
        phone: [data.leader.cellPhoneNumber, [
        Validators.required,
          Validators.pattern(/^[0-9]+$/)
        ]],
        position: [data.leader.position],
        pemail: [data.leader.pemail, [
          Validators.required,
          Validators.email
        ]],
        cemail: [data.leader.cemail, [
          Validators.required,
          Validators.email
        ]],
        homeAddress: [data.leader.homeAddress],
        leaderType: [data.leader.leaderType, Validators.required],
        projectCode: [data.leader.projectCode, Validators.required],
        customerCode: [data.leader.customerCode, Validators.required]
    });

    console.log(data.leader);
    console.log(data.leader.requestBody);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.editForm.valid) {
      const updatedLeader = {
        id: this.leaderId,
        leaderType: this.editForm.value.leaderType,
        projectCode: this.editForm.value.projectCode,
        customerCode: this.editForm.value.customerCode,
        identificationType: this.editForm.value.idtype,
        identificationNumber: this.editForm.value.idnumber,
        names: this.editForm.value.names,
        surnames: this.editForm.value.surnames,
        gender: this.editForm.value.gender,
        cellPhoneNumber: this.editForm.value.phone,
        position: this.editForm.value.position,
        personalEmail: this.editForm.value.pemail,
        corporateEmail: this.editForm.value.cemail,
        homeAddress: this.editForm.value.homeAddress,
      };
      console.log(updatedLeader);
      this.dialogRef.close(updatedLeader);
    }
  }

}
