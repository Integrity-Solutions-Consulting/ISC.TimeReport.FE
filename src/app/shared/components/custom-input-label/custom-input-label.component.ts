import { Component, forwardRef, Input } from '@angular/core';
import { ControlContainer, FormControl, FormGroup, NG_VALUE_ACCESSOR, NgForm } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'custom-input-label',
  standalone: true,
  templateUrl: './custom-input-label.component.html',
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }],
  imports: [
    MatFormFieldModule,
    MatInputModule
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomInputLabelComponent),
      multi: true
    }
  ]
})
export class CustomInputLabelComponent {
  @Input() formGroup!: FormGroup;
  @Input() controlName!: string;
  @Input() label!: string;
  @Input() required = false;
  @Input() type = 'text';
  @Input() placeholder = '';
  @Input() errorMessage = '';

  internalValue: any = '';

  onChange: (value: any) => void = () => {};

  onTouched: () => void = () => {};

  writeValue(value: any): void {
    this.internalValue = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
}
