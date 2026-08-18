import { Pipe, PipeTransform } from '@angular/core';

/** تبدیل اعداد به ارقام فارسی با جداکننده هزارگان */
@Pipe({ name: 'faNum', pure: true })
export class FaNumPipe implements PipeTransform {
  transform(value: number | null | undefined, digits = 0): string {
    if (value == null || Number.isNaN(value)) {
      return '—';
    }
    return new Intl.NumberFormat('fa-IR', {
      maximumFractionDigits: digits,
    }).format(value);
  }
}
