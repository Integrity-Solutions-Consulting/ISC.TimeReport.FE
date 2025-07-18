import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

interface ResourceTypes {
  id: number;
  name: string;
}

@Component({
  selector: 'app-assignment-dialog',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './assignment-dialog.component.html',
  styleUrl: './assignment-dialog.component.scss'
})
export class AssignmentDialogComponent {
types: ResourceTypes[] = [
    {id: 0, name: 'Steak'},
    {id: 1, name: 'Pizza'},
    {id: 2, name: 'Tacos'},
  ];
}
