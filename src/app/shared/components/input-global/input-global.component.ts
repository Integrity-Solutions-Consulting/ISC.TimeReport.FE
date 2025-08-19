import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';

@Component({
  selector: 'app-input-global',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './input-global.component.html',
  styleUrls: ['./input-global.component.scss']
})
export class InputGlobalComponent {
  @Input() label: string = '';
  @Input() type: string = 'text';
  @Input() placeholder: string = '';
  @Input() control!: FormControl;
  @Input() required: boolean = false;

  get hasError(): boolean {
    return this.control && this.control.invalid && (this.control.dirty || this.control.touched);
  }
}
