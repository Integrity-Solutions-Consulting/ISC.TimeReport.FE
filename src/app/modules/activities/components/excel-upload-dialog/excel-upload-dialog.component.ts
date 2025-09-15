import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { saveAs } from 'file-saver';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-excel-upload-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './excel-upload-dialog.component.html',
  styleUrl: './excel-upload-dialog.component.scss'
})
export class ExcelUploadDialogComponent {

  selectedFile: File | null = null;
  isDragOver = false;
  showInvalidFileError = false;
  isLoading = false;
  urlBase: string = environment.URL_BASE;

  constructor(
    public dialogRef: MatDialogRef<ExcelUploadDialogComponent>,
    public dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient
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
      this.showInvalidFileError = true;
      this.showInvalidFormatDialog(file.name, fileExtension);
      this.selectedFile = null;
    }
  }

  downloadExcelModel(): void {
    this.isLoading = true;

    this.http.get(`${this.urlBase}/api/TimeReport/export-excel-model`, {
      responseType: 'blob',
      observe: 'response'
    }).subscribe({
      next: (response) => {
        this.isLoading = false;

        if (!response.body) {
          this.showErrorDialog('El archivo recibido está vacío');
          return;
        }

        const blob = response.body;
        const contentDisposition = response.headers.get('content-disposition');
        let filename = 'modelo_excel.xlsx';

        // Extraer el nombre de archivo del header content-disposition
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, '');
          }
        }

        // Descargar usando file-saver
        saveAs(blob, filename);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        console.error('Error al descargar el modelo:', error);

        // Manejar diferentes tipos de errores
        let errorMessage = 'Error al descargar el modelo';

        if (error.error instanceof Blob) {
          // Si el error es un Blob, intentar leerlo como texto
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const errorText = reader.result as string;
              const errorObj = JSON.parse(errorText);
              this.showErrorDialog(errorObj.message || 'Error del servidor');
            } catch {
              this.showErrorDialog('Error al procesar la respuesta del servidor');
            }
          };
          reader.readAsText(error.error);
        } else if (error.error instanceof ProgressEvent) {
          this.showErrorDialog('Error de conexión. Verifique su conexión a internet.');
        } else {
          this.showErrorDialog(`${errorMessage}: ${error.statusText || error.message}`);
        }
      }
    });
  }

  private showErrorDialog(message: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Error',
        message: message,
        confirmText: 'Aceptar',
        cancelText: null
      }
    });
  }

  private showInvalidFormatDialog(fileName: string, fileExtension: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Formato de archivo no válido',
        message: `El archivo "${fileName}" tiene el formato "${fileExtension}" que no es compatible. Solo se permiten archivos .xlsx y .xls.`,
        confirmText: 'Aceptar',
        cancelText: null
      }
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
