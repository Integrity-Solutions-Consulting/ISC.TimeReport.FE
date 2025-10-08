import { ChangeDetectionStrategy, Component, Inject, OnInit, inject } from '@angular/core';
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
import { HolidaysService } from '../../services/holidays.service';

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

  private holidaysService = inject(HolidaysService);

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
    this.holidayForm.patchValue({
      holidayType: 'LOCAL',
      holidayDate: new Date()
    });
  }

  populateForm(holiday: Holiday) {
    // Convertir la fecha string a objeto Date
    const holidayDate = holiday.holidayDate ? new Date(holiday.holidayDate) : new Date();

    this.holidayForm.patchValue({
      holidayType: holiday.holidayType,
      holidayName: holiday.holidayName,
      holidayDate: holidayDate,
      description: holiday.description || '',
      isRecurring: holiday.isRecurring || false
    });
  }

  onSave(): void {
    if (this.holidayForm.valid && !this.isSaving) {
      this.isSaving = true;
      this.holidaysService.showLoading();

      try {
        const formValue = this.holidayForm.value;

        // Crear el payload exactamente como lo espera el endpoint
        const holidayData = {
          holidayName: formValue.holidayName,
          holidayDate: this.formatDate(formValue.holidayDate),
          isRecurring: formValue.isRecurring,
          holidayType: formValue.holidayType,
          description: formValue.description || '',
          status: true
        };

        if (this.isEditMode && this.data.holiday?.id) {
          // Actualizar feriado existente
          this.holidaysService.updateHoliday(
            this.data.holiday.id.toString(),
            holidayData
          ).subscribe({
            next: (response) => {
              this.dialogRef.close({
                success: true,
                isEdit: this.isEditMode,
                data: response
              });
            },
            error: (error) => {
              console.error('Error al actualizar el feriado:', error);
              this.isSaving = false;
              this.holidaysService.hideLoading();
              // Aquí podrías mostrar un mensaje de error al usuario
            }
          });
        } else {
          // Crear nuevo feriado
          this.holidaysService.createHoliday(holidayData).subscribe({
            next: (response) => {
              this.dialogRef.close({
                success: true,
                isEdit: this.isEditMode,
                data: response
              });
            },
            error: (error) => {
              console.error('Error al crear el feriado:', error);
              this.isSaving = false;
              this.holidaysService.hideLoading();
              // Aquí podrías mostrar un mensaje de error al usuario
            }
          });
        }

      } catch (error) {
        console.error('Error al procesar el formulario:', error);
        this.isSaving = false;
        this.holidaysService.hideLoading();
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close({ success: false });
  }

  private formatDate(date: Date): string {
    if (!date) return '';

    // Asegurarnos de que sea un objeto Date válido
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return '';
    }

    const year = dateObj.getFullYear();
    const month = ('0' + (dateObj.getMonth() + 1)).slice(-2);
    const day = ('0' + dateObj.getDate()).slice(-2);

    return `${year}-${month}-${day}`;
  }
}
