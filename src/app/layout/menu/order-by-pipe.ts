import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'orderBy',
  standalone: true
})
export class OrderByPipe implements PipeTransform {
  transform(array: any[], field: string): any[] {
    if (!Array.isArray(array)) {
      return array;
    }

    return array.sort((a, b) => {
      const aValue = a[field] || 999;
      const bValue = b[field] || 999;
      return aValue - bValue;
    });
  }
}
