import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-excel-upload-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule
  ],
  templateUrl: './excel-upload-dialog.component.html',
  styleUrl: './excel-upload-dialog.component.scss'
})
export class ExcelUploadDialogComponent {

  selectedFile: File | null = null;
  isDragOver = false;

  constructor(
    public dialogRef: MatDialogRef<ExcelUploadDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
    }
  }

  private processFile(file: File): void {
    const allowedExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    if (allowedExtensions.includes(fileExtension)) {
      this.selectedFile = file;
    } else {
      // Aquí podrías mostrar un mensaje de error
      console.error('Formato de archivo no válido');
      this.selectedFile = null;
    }
  }

  getFileSize(size: number): string {
    if (size < 1024) {
      return size + ' bytes';
    } else if (size < 1048576) {
      return (size / 1024).toFixed(1) + ' KB';
    } else {
      return (size / 1048576).toFixed(1) + ' MB';
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onUpload(): void {
    if (this.selectedFile) {
      this.dialogRef.close(this.selectedFile);
    }
  }
}
