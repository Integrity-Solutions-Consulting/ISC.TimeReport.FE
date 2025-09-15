import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { saveAs } from 'file-saver';
import { environment } from '../../../../../environments/environment';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-excel-upload-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './excel-upload-dialog.component.html',
  styleUrl: './excel-upload-dialog.component.scss'
})
export class ExcelUploadDialogComponent {

  selectedFile: File | null = null;
  isDragOver = false;
  showInvalidFileError = false;
  isLoading = false;
  isUploading = false;
  urlBase: string = environment.URL_BASE;
  private downloadTimeout: any;

  constructor(
    public dialogRef: MatDialogRef<ExcelUploadDialogComponent>,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
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
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ];

    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    const fileType = file.type;

    if (allowedExtensions.includes(fileExtension) || allowedTypes.includes(fileType)) {
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

    this.downloadTimeout = setTimeout(() => {
      if (this.isLoading) {
        this.isLoading = false;
        this.showErrorDialog('La descarga está tardando más de lo esperado. Por favor, intente nuevamente.');
      }
    }, 30000);

    this.http.get(`${this.urlBase}/api/TimeReport/export-excel-model`, {
      responseType: 'blob',
      observe: 'response'
    }).pipe(
      finalize(() => {
        clearTimeout(this.downloadTimeout);
        this.isLoading = false;
      })
    ).subscribe({
      next: (response) => {
        if (!response.body) {
          this.showErrorDialog('El archivo recibido está vacío');
          return;
        }

        const blob = response.body;
        const contentDisposition = response.headers.get('content-disposition');
        let filename = 'modelo_excel.xlsx';

        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, '');
          }
        }

        saveAs(blob, filename);
        this.snackBar.open('Modelo descargado correctamente', 'Cerrar', {
          duration: 3000
        });
      },
      error: (error: HttpErrorResponse) => {
        this.handleDownloadError(error);
      }
    });
  }

  onUpload(): void {
    if (!this.selectedFile) return;

    this.isUploading = true;

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.http.post(`${this.urlBase}/api/DailyActivity/upload-activities`, formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      finalize(() => {
        this.isUploading = false;
      })
    ).subscribe({
      next: (event: any) => {
        if (event.type === 4) { // HttpResponse
          this.handleUploadSuccess(event.body);
        }
      },
      error: (error: HttpErrorResponse) => {
        this.handleUploadError(error);
      }
    });
  }

  private handleUploadSuccess(response: any): void {
    this.snackBar.open('Archivo cargado correctamente', 'Cerrar', {
      duration: 3000
    });

    // Cerrar el diálogo y retornar la respuesta del servidor
    this.dialogRef.close({
      success: true,
      data: response
    });
  }

  private handleUploadError(error: HttpErrorResponse): void {
    console.error('Error al cargar el archivo:', error);

    let errorMessage = 'Error al cargar el archivo';

    if (error.status === 400) {
      errorMessage = 'El archivo tiene un formato incorrecto o datos inválidos';
    } else if (error.status === 413) {
      errorMessage = 'El archivo es demasiado grande';
    } else if (error.status === 415) {
      errorMessage = 'Tipo de archivo no soportado';
    } else if (error.status === 500) {
      errorMessage = 'Error interno del servidor. Por favor, contacte al administrador.';
    } else if (error.status === 0) {
      errorMessage = 'Error de conexión. Verifique su conexión a internet.';
    }

    if (error.error && typeof error.error === 'object') {
      // Intentar extraer mensajes de error del servidor
      if (error.error.message) {
        errorMessage = error.error.message;
      } else if (error.error.errors) {
        const errors = error.error.errors;
        errorMessage = Object.values(errors).flat().join(', ');
      }
    }

    this.showErrorDialog(errorMessage);
  }

  private handleDownloadError(error: HttpErrorResponse): void {
    let errorMessage = 'Error al descargar el modelo';

    if (error.status === 404) {
      errorMessage = 'El servicio de descarga no está disponible en este momento.';
    } else if (error.status === 500) {
      errorMessage = 'Error interno del servidor. Por favor, contacte al administrador.';
    } else if (error.status === 0) {
      errorMessage = 'Error de conexión. Verifique su conexión a internet.';
    }

    if (error.error instanceof Blob) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const errorText = reader.result as string;
          const errorObj = JSON.parse(errorText);
          this.showErrorDialog(errorObj.message || errorMessage);
        } catch {
          this.showErrorDialog(errorMessage);
        }
      };
      reader.readAsText(error.error);
    } else {
      this.showErrorDialog(errorMessage);
    }
  }

  private showErrorDialog(message: string): void {
    this.dialog.open(ConfirmDialogComponent, {
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
    this.dialog.open(ConfirmDialogComponent, {
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
    if (this.downloadTimeout) {
      clearTimeout(this.downloadTimeout);
    }
    this.dialogRef.close(null);
  }

  ngOnDestroy(): void {
    if (this.downloadTimeout) {
      clearTimeout(this.downloadTimeout);
    }
  }
}
