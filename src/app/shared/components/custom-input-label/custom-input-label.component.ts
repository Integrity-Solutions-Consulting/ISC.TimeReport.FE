import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'custom-input-label',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './custom-input-label.component.html',
  styleUrls: ['./custom-input-label.component.scss']
})
export class CustomInputLabelComponent {
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() type: string = 'text';
  @Input() value: string = '';
  @Input() disabled: boolean = false;
  @Input() required: boolean = false;

  @Output() valueChange = new EventEmitter<string>();

  onInputChange(event: any) {
    this.value = event.target.value;
    this.valueChange.emit(this.value);
  }
}
