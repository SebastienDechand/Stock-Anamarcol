import { Pipe, PipeTransform, inject } from '@angular/core';
import { formatDateFr } from '../utils/date.utils';
import { LanguageService } from '../../core/services/language.service';

@Pipe({ name: 'dateFr', standalone: true, pure: false })
export class DateFrPipe implements PipeTransform {
  private languageService = inject(LanguageService);

  transform(value: string | Date | undefined | null): string {
    return formatDateFr(value, this.languageService.current);
  }
}
