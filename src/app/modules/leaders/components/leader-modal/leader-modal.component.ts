import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-leader-modal',
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
  templateUrl: './leader-modal.component.html',
  styleUrl: './leader-modal.component.scss'
})
export class LeaderModalComponent {

  leaderForm!: FormGroup;

  isEditMode: boolean = false;

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
    public dialogRef: MatDialogRef<LeaderModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder
  ) {
    const leaderData = data?.leader || {};
    this.leaderId = leaderData.id || null;
    this.isEditMode = !!leaderData.id;

    this.initializeForm(leaderData);

    console.log(data.leader);
  }

  private initializeForm(leaderData: any): void {
    this.leaderForm = this.fb.group({
      idtype: [leaderData.identificationType || '', Validators.required],
      idnumber: [leaderData.identificationNumber || '', Validators.required],
      names: [leaderData.names || ''],
      surnames: [leaderData.surnames || ''],
      gender: [leaderData.gender || ''],
      phone: [leaderData.cellPhoneNumber || '', [
        Validators.required,
        Validators.pattern(/^[0-9]+$/)
      ]],
      pemail: [leaderData.pemail || '', [
        Validators.required,
        Validators.email
      ]],
      cemail: [leaderData.cemail || '', [
        Validators.required,
        Validators.email
      ]],
      homeAddress: [leaderData.homeAddress || ''],
      leaderType: [leaderData.leaderType || '', Validators.required],
      projectCode: [leaderData.projectCode || '', Validators.required],
      customerCode: [leaderData.customerCode || '', Validators.required]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.leaderForm.valid) {
      const updatedLeader = {
        id: this.leaderId,
        leaderType: this.leaderForm.value.leaderType,
        projectCode: this.leaderForm.value.projectCode,
        customerCode: this.leaderForm.value.customerCode,
        identificationType: this.leaderForm.value.idtype,
        identificationNumber: this.leaderForm.value.idnumber,
        names: this.leaderForm.value.names,
        surnames: this.leaderForm.value.surnames,
        gender: this.leaderForm.value.gender,
        cellPhoneNumber: this.leaderForm.value.phone,
        personalEmail: this.leaderForm.value.pemail,
        corporateEmail: this.leaderForm.value.cemail,
        homeAddress: this.leaderForm.value.homeAddress,
      };
      console.log(updatedLeader);
      this.dialogRef.close(updatedLeader);
    }
  }

}
