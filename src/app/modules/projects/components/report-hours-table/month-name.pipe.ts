import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'monthName',
  standalone: true
})
export class MonthNamePipe implements PipeTransform {
  transform(month: number): string {
    return new Date(2025, month - 1, 1)
      .toLocaleString('es-ES', { month: 'long' })
      .replace(/^\w/, c => c.toUpperCase());
  }
}
