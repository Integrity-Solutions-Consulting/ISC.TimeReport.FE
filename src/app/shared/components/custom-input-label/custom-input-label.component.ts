import { CommonModule } from '@angular/common';
import { Component, forwardRef, Input } from '@angular/core';
import { ControlContainer, FormControl, FormGroup, FormGroupDirective, Validators, FormsModule, NG_VALUE_ACCESSOR, NgForm, ReactiveFormsModule } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'custom-input-label',
  standalone: true,
  templateUrl: './custom-input-label.component.html',
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
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
  @Input() label!: string;
  @Input() required: boolean = false;
  @Input() type = 'text';
  @Input() placeholder = '';
  @Input() hint!: string;
  @Input() control: FormControl = new FormControl('', [
    Validators.required,
    Validators.email
  ]);
  @Input() invalidEmailMessage = '';
  @Input() requiredMessage = '';
  @Input() patternMessage = '';
  @Input() patternErrorMessages: {[key: string]: string} = {};

  internalValue: any = '';

  get hasError(): boolean {
    return this.control && this.control.invalid && (this.control.dirty || this.control.touched);
  }

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
