import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-results-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule
  ],
  templateUrl: './results-dialog.component.html',
  styleUrl: './results-dialog.component.scss'
})
export class ResultsDialogComponent {
  displayedColumns: string[] = ['employeeCode', 'title', 'error'];
  errorActivities: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<ResultsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    // Filtrar solo los registros con errores
    this.errorActivities = data.activities.filter((activity: any) =>
      activity.status && activity.status.startsWith('Error')
    );
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onDownloadErrors(): void {
    // Aquí puedes implementar la descarga de los errores en formato CSV o Excel
    console.log('Descargar errores', this.errorActivities);
    // Implementar lógica de descarga
  }
}
