import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

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
  showInvalidFileError = false;

  constructor(
    public dialogRef: MatDialogRef<ExcelUploadDialogComponent>,
    public dialog: MatDialog,
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
      this.showInvalidFileError = false;
    } else {
      // Aquí podrías mostrar un mensaje de error
      this.showInvalidFileError = true;
      this.showInvalidFormatDialog(file.name, fileExtension);
      this.selectedFile = null;
    }
  }

  private showInvalidFormatDialog(fileName: string, fileExtension: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Formato de archivo no válido',
        message: `El archivo "${fileName}" tiene el formato "${fileExtension}" que no es compatible. Solo se permiten archivos .xlsx y .xls.`,
        confirmText: 'Aceptar',
        cancelText: null // Esto ocultará el botón de cancelar
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      // No es necesario hacer nada después de cerrar el diálogo
    });
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
