import { Component, Input } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'custom-select',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule
  ],
  templateUrl: './custom-select.component.html',
  styleUrl: './custom-select.component.scss'
})
export class CustomSelectComponent {
  @Input() label!: string;
  @Input() placeholder = '';
  @Input() control: FormControl = new FormControl();
  @Input() formGroup?: FormGroup;
  @Input() required: boolean = false;
  @Input() options: any[] = [];
  @Input() trackByField: string = 'id';
  @Input() valueField: string = 'id';
  @Input() displayField: string = 'name';
  @Input() showErrors: boolean = true;
  @Input() errorMessage: string = '';

  getTrackBy(item: any): any {
    return this.trackByField ? item[this.trackByField] : item;
  }

  getValue(item: any): any {
    return this.valueField ? item[this.valueField] : item;
  }

  getDisplay(item: any): string {
    return this.displayField ? item[this.displayField] : item;
  }
}
