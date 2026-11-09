import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'percentComplete', standalone: false })
export class PercentCompletePipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null || isNaN(value)) {
      return '0%';
    }
    return `${Math.round(value)}%`;
  }
}
