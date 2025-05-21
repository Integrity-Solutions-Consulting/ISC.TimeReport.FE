import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'custom-container',
  standalone: true,
  imports: [
    MatCardModule
  ],
  templateUrl: './custom-container.component.html',
  styleUrl: './custom-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomContainerComponent {
}
