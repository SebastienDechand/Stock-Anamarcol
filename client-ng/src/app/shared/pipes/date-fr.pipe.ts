import { Pipe, PipeTransform } from '@angular/core';
import { formatDateFr } from '../utils/date.utils';

@Pipe({ name: 'dateFr', standalone: true })
export class DateFrPipe implements PipeTransform {
  transform(value: string | Date | undefined | null): string {
    return formatDateFr(value);
  }
}
