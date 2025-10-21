import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface ProjectionDialogData {
  projectName: string;
}

@Component({
  selector: 'app-projection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './projection-dialog.component.html',
  styleUrl: './projection-dialog.component.scss'
})
export class ProjectionDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ProjectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProjectionDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (this.data.projectName && this.data.projectName.trim() !== '') {
      this.dialogRef.close(this.data.projectName.trim());
    }
  }
}
