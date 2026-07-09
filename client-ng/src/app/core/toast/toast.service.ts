import { inject, Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastr = inject(ToastrService);
  private translate = inject(TranslateService);

  success(key: string, params?: Record<string, unknown>) {
    const message = this.translate.instant(key, params);
    this.toastr.success(message, '', { timeOut: 3000, progressBar: true });
  }

  error(key: string, params?: Record<string, unknown>) {
    const message = this.translate.instant(key, params);
    this.toastr.error(message, '', { timeOut: 4000, progressBar: true });
  }

  info(key: string, params?: Record<string, unknown>) {
    const message = this.translate.instant(key, params);
    this.toastr.info(message, '', { timeOut: 3000 });
  }

  warning(key: string, params?: Record<string, unknown>) {
    const message = this.translate.instant(key, params);
    this.toastr.warning(message, '', { timeOut: 3500 });
  }
}
