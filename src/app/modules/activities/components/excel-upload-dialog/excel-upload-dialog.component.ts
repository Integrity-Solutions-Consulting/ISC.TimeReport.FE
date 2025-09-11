import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
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
    MatIconModule
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
      // Aquí podrías mostrar un mensaje de error
      this.showInvalidFileError = true;
      this.showInvalidFormatDialog(file.name, fileExtension);
      this.selectedFile = null;
    }
  }

  downloadExcelModel(): void {
    this.isLoading = true;

    this.http.get(`${this.urlBase}/api/TimeReport/export-excel-model`, {
      responseType: 'blob',
      headers: new HttpHeaders({
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
    }).subscribe({
      next: (blob: Blob) => {
        this.isLoading = false;

        // Crear un blob con el tipo MIME correcto explícitamente
        const excelBlob = new Blob([blob], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        // Usar el nombre de archivo del header si está disponible
        const url = window.URL.createObjectURL(excelBlob);
        const a = document.createElement('a');
        a.href = url;

        // Intentar extraer el nombre del archivo del header content-disposition
        const contentDisposition = blob.type; // Esto no funcionará, necesitamos los headers completos

        // Para obtener los headers necesitamos usar observe: 'response'
        this.downloadWithHeaders();
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        console.error('Error al descargar el modelo:', error);
        this.showErrorDialog('Error al descargar el modelo: ' + error.message);
      }
    });
  }

  downloadWithHeaders(): void {
    this.isLoading = true;

    this.http.get(`${this.urlBase}/api/TimeReport/export-excel-model`, {
      responseType: 'blob',
      observe: 'response' // Esto nos da acceso a los headers completos
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

        // Crear el blob con el tipo correcto
        const excelBlob = new Blob([blob], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        // Descargar usando file-saver
        saveAs(excelBlob, filename);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        console.error('Error al descargar el modelo:', error);

        // Intentar leer el error como texto si viene como blob
        if (error.error instanceof Blob) {
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
        } else {
          this.showErrorDialog('Error al descargar el modelo: ' + error.message);
        }
      }
    });
  }

  async downloadWithFetch(): Promise<void> {
    this.isLoading = true;

    try {
      const response = await fetch(`${this.urlBase}/api/TimeReport/export-excel-model`, {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'modelo_excel.xlsx';

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      // Crear URL y descargar
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      this.isLoading = false;

    } catch (error) {
      this.isLoading = false;
      console.error('Error al descargar el modelo:', error);
      this.showErrorDialog('Error al descargar el modelo: ' + (error as Error).message);
    }
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

    dialogRef.afterClosed().subscribe();
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
