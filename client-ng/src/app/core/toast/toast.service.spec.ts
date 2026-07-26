import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;
  let toastr: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
    warning: ReturnType<typeof vi.fn>;
  };
  let translate: { instant: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    toastr = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() };
    translate = { instant: vi.fn((key: string) => `translated:${key}`) };

    TestBed.configureTestingModule({
      providers: [
        { provide: ToastrService, useValue: toastr },
        { provide: TranslateService, useValue: translate },
      ],
    });

    service = TestBed.inject(ToastService);
  });

  it('success() translates the key and forwards the message to toastr.success', () => {
    service.success('TOAST.SAVED', { name: 'Alice' });
    expect(translate.instant).toHaveBeenCalledWith('TOAST.SAVED', { name: 'Alice' });
    expect(toastr.success).toHaveBeenCalledWith(
      'translated:TOAST.SAVED',
      '',
      expect.objectContaining({ timeOut: 3000 }),
    );
  });

  it('error() translates the key and forwards the message to toastr.error', () => {
    service.error('TOAST.ERROR');
    expect(translate.instant).toHaveBeenCalledWith('TOAST.ERROR', undefined);
    expect(toastr.error).toHaveBeenCalledWith(
      'translated:TOAST.ERROR',
      '',
      expect.objectContaining({ timeOut: 4000 }),
    );
  });

  it('info() translates the key and forwards the message to toastr.info', () => {
    service.info('TOAST.INFO');
    expect(toastr.info).toHaveBeenCalledWith('translated:TOAST.INFO', '', expect.any(Object));
  });

  it('warning() translates the key and forwards the message to toastr.warning', () => {
    service.warning('TOAST.WARN');
    expect(toastr.warning).toHaveBeenCalledWith('translated:TOAST.WARN', '', expect.any(Object));
  });
});
