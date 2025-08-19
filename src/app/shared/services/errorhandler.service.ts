import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AlertDialogComponent } from '../components/alert-dialog/alert-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  constructor(private dialog: MatDialog) {}

  showError(message: string): void {
    this.dialog.open(AlertDialogComponent, {
      width: '600px',
      data: { message },
      disableClose: false
    });
  }
}
