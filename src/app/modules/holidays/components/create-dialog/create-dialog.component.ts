import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { Holiday } from '../../interfaces/holiday.interface';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';

export interface HolidayDialogData {
  holiday?: Holiday;
  isEdit?: boolean;
}

@Component({
  selector: 'app-holiday-dialog',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatNativeDateModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatCheckboxModule,
    MatButtonModule
  ],
  templateUrl: './create-dialog.component.html',
  styleUrls: ['./create-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateDialogComponent implements OnInit {
  holidayForm: FormGroup;
  isSaving = false;
  isEditMode: boolean;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<CreateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: HolidayDialogData
  ) {
    this.isEditMode = !!data.holiday;
    this.holidayForm = this.createForm();
  }

  ngOnInit() {
    if (this.data.holiday) {
      this.populateForm(this.data.holiday);
    } else {
      this.setDefaultValues();
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      holidayType: ['', Validators.required],
      holidayName: ['', Validators.required],
      holidayDate: ['', Validators.required],
      description: [''],
      isRecurring: [false]
    });
  }

  setDefaultValues(): void {
    // Establecer "Local" como valor por defecto en el select
    this.holidayForm.patchValue({
      holidayType: 'LOCAL',
      holidayDate: new Date() // Fecha de hoy por defecto
    });
  }

  populateForm(holiday: Holiday) {
    this.holidayForm.patchValue({
      holidayType: holiday.holidayType,
      holidayName: holiday.holidayName,
      holidayDate: holiday.holidayDate,
      description: holiday.description || '',
      isRecurring: holiday.isRecurring || false
    });
  }

  onSave(): void {
    if (this.holidayForm.valid) {
      this.isSaving = true;

      const formValue = this.holidayForm.value;
      const holidayData = {
        ...formValue,
        holidayDate: this.formatDate(formValue.holidayDate),
        status: true
      };

      this.dialogRef.close({
        holidayData: holidayData,
        isEdit: this.isEditMode,
        holidayId: this.data.holiday?.id
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private formatDate(date: Date): string {
    if (!date) return '';

    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);

    return `${year}-${month}-${day}`;
  }
}
