import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'custom-button',
  standalone: true,
  imports: [
    MatButtonModule
  ],
  templateUrl: './custom-button.component.html',
  styleUrl: './custom-button.component.scss'
})
export class CustomButtonComponent {
  @Input() text: string = "Botón";
  @Input() disabled: boolean = false;
}
