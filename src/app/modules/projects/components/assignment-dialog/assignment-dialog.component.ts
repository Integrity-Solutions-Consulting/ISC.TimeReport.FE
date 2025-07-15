import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-assignment-dialog',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogModule
  ],
  templateUrl: './assignment-dialog.component.html',
  styleUrl: './assignment-dialog.component.scss'
})
export class AssignmentDialogComponent {

}
