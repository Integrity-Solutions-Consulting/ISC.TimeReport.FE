import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'orderBy',
  standalone: true
})
export class OrderByPipe implements PipeTransform {
  transform(array: any[], field: string): any[] {
    if (!Array.isArray(array)) return array;
    return array.slice().sort((a, b) => (a[field] > b[field]) ? 1 : -1);
  }
}
