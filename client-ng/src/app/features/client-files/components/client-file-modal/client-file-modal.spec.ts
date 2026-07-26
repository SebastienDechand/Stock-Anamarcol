import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ClientFileModal } from './client-file-modal';
import { ToastService } from '../../../../core/toast/toast.service';
import type { ClientFile } from '../../../../shared/models/client-file/client-file.model';

const makeFile = (overrides: Partial<ClientFile> = {}): ClientFile => ({
  _id: 'cf1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  lastName: 'Dupont',
  firstName: 'Jean',
  company: 'SARL Dupont',
  address: '1 rue de la Paix',
  postalCode: '75000',
  city: 'Paris',
  preInstallationVisit: false,
  productFileEntry: false,
  carpentryPlanCutout: false,
  stoneworkPlanCutout: false,
  equipment: {
    cashguardCount: 0,
    fusionCount: 0,
    registerCount: 0,
    otherEquipmentCount: 0,
    scaleCount: 0,
    tactisLicenses: 0,
    innoLicenses: 0,
    backofficePcCount: 0,
    centralizationPcCount: 0,
    allergenKiosk: false,
    orderKiosk: false,
    electronicLabels: false,
    loyaltyCard: false,
  },
  ...overrides,
});

function buildComponent(): {
  component: ClientFileModal;
  fixture: ReturnType<typeof TestBed.createComponent<ClientFileModal>>;
  toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
} {
  const toast = { success: vi.fn(), error: vi.fn() };
  TestBed.overrideComponent(ClientFileModal, { set: { template: '', imports: [] } });
  TestBed.configureTestingModule({
    imports: [ClientFileModal],
    providers: [{ provide: ToastService, useValue: toast }],
  });
  const fixture = TestBed.createComponent(ClientFileModal);
  fixture.detectChanges();
  return { component: fixture.componentInstance, fixture, toast };
}

describe('ClientFileModal', () => {
  afterEach(() => {
    vi.doUnmock('@e965/xlsx');
    vi.restoreAllMocks();
  });

  describe('ngOnChanges()', () => {
    it('resets to an empty form when there is no file', () => {
      const { component } = buildComponent();
      expect(component.form.lastName).toBe('');
      expect(component.lastNameControl.value).toBe('');
    });

    it('populates the form and lastNameControl from the given file', () => {
      const { component, fixture } = buildComponent();
      fixture.componentRef.setInput('file', makeFile());
      fixture.detectChanges();

      expect(component.form.lastName).toBe('Dupont');
      expect(component.form.company).toBe('SARL Dupont');
      expect(component.lastNameControl.value).toBe('Dupont');
    });
  });

  describe('isEdit', () => {
    it('is false without a file and true with one', () => {
      const { component, fixture } = buildComponent();
      expect(component.isEdit).toBe(false);
      fixture.componentRef.setInput('file', makeFile());
      fixture.detectChanges();
      expect(component.isEdit).toBe(true);
    });
  });

  describe('getStr()/setStr()', () => {
    it('setStr writes to the form and getStr reads it back', () => {
      const { component } = buildComponent();
      component.setStr('company', 'ACME');
      expect(component.getStr('company')).toBe('ACME');
    });

    it('getStr returns an empty string for an unset field', () => {
      const { component } = buildComponent();
      expect(component.getStr('vatNumber')).toBe('');
    });
  });

  describe('getBool()/setBool()', () => {
    it('setBool writes to the form and getBool reads it back', () => {
      const { component } = buildComponent();
      component.setBool('preInstallationVisit', true);
      expect(component.getBool('preInstallationVisit')).toBe(true);
    });
  });

  describe('getEquipNum()/setEquipNum()', () => {
    it('setEquipNum parses a numeric string', () => {
      const { component } = buildComponent();
      component.setEquipNum('registerCount', '5');
      expect(component.getEquipNum('registerCount')).toBe(5);
    });

    it('setEquipNum falls back to 0 for a non-numeric string', () => {
      const { component } = buildComponent();
      component.setEquipNum('registerCount', 'abc');
      expect(component.getEquipNum('registerCount')).toBe(0);
    });
  });

  describe('getEquipBool()/setEquipBool()', () => {
    it('setEquipBool writes to the equipment sub-object and getEquipBool reads it back', () => {
      const { component } = buildComponent();
      component.setEquipBool('allergenKiosk', true);
      expect(component.getEquipBool('allergenKiosk')).toBe(true);
    });
  });

  describe('onDragOver() / onDragLeave()', () => {
    it('onDragOver sets isDragging and prevents the default behaviour', () => {
      const { component } = buildComponent();
      const event = { preventDefault: vi.fn() } as unknown as DragEvent;
      component.onDragOver(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.isDragging()).toBe(true);
    });

    it('onDragLeave clears isDragging', () => {
      const { component } = buildComponent();
      component.onDragOver({ preventDefault: vi.fn() } as unknown as DragEvent);
      component.onDragLeave();
      expect(component.isDragging()).toBe(false);
    });
  });

  describe('submit()', () => {
    it('does not emit and marks the control touched when lastName is blank', () => {
      const { component } = buildComponent();
      const spy = vi.fn();
      component.save.subscribe(spy);

      component.submit();

      expect(spy).not.toHaveBeenCalled();
      expect(component.lastNameControl.touched).toBe(true);
    });

    it('emits save with the form data and lastName when valid', () => {
      const { component } = buildComponent();
      component.lastNameControl.setValue('Martin');
      component.setStr('company', 'ACME');
      const spy = vi.fn();
      component.save.subscribe(spy);

      component.submit();

      expect(spy).toHaveBeenCalledWith({
        id: undefined,
        data: expect.objectContaining({ lastName: 'Martin', company: 'ACME' }),
      });
    });
  });

  describe('XLSX import (onXlsxChange / onDrop)', () => {
    function mockXlsxRows(rows: unknown[][]): void {
      vi.doMock('@e965/xlsx', () => ({
        read: vi.fn().mockReturnValue({ Sheets: { Sheet1: {} }, SheetNames: ['Sheet1'] }),
        utils: {
          sheet_to_json: vi.fn().mockReturnValue(rows),
        },
      }));
    }

    it('maps recognized BDC labels onto the form and shows a success toast', async () => {
      mockXlsxRows([
        ['Societe', 'ACME Corp', 'Nom', 'Martin'],
        ['CP', '75000', 'Nombre de caisses', '3'],
      ]);

      const { component, toast } = buildComponent();
      const file = new File(['fake'], 'bdc.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const input = document.createElement('input');
      input.type = 'file';
      Object.defineProperty(input, 'files', { value: [file] });
      Object.defineProperty(input, 'value', { value: 'bdc.xlsx', writable: true });

      await component.onXlsxChange({ target: input } as unknown as Event);

      expect(component.getStr('company')).toBe('ACME Corp');
      expect(component.getStr('lastName')).toBe('Martin');
      expect(component.getStr('postalCode')).toBe('75000');
      expect(component.getEquipNum('registerCount')).toBe(3);
      expect(component.lastNameControl.value).toBe('Martin');
      expect(toast.success).toHaveBeenCalledWith('TOAST.PURCHASE_ORDER_UPDATED', { count: 4 });
      expect(input.value).toBe('');
    });

    it('ignores unrecognized labels', async () => {
      mockXlsxRows([['Colonne inconnue', 'valeur', '', '']]);

      const { component, toast } = buildComponent();
      const file = new File(['fake'], 'bdc.xlsx');
      const input = document.createElement('input');
      Object.defineProperty(input, 'files', { value: [file] });
      Object.defineProperty(input, 'value', { value: 'bdc.xlsx', writable: true });

      await component.onXlsxChange({ target: input } as unknown as Event);

      expect(component.getStr('company')).toBe('');
      expect(toast.success).toHaveBeenCalledWith('TOAST.PURCHASE_ORDER_UPDATED', { count: 0 });
    });

    it('shows an error toast and resets xlsxImporting when parsing throws', async () => {
      vi.doMock('@e965/xlsx', () => ({
        read: vi.fn().mockImplementation(() => {
          throw new Error('bad file');
        }),
        utils: { sheet_to_json: vi.fn() },
      }));

      const { component, toast } = buildComponent();
      const file = new File(['fake'], 'bdc.xlsx');
      const input = document.createElement('input');
      Object.defineProperty(input, 'files', { value: [file] });
      Object.defineProperty(input, 'value', { value: 'bdc.xlsx', writable: true });

      await component.onXlsxChange({ target: input } as unknown as Event);

      expect(toast.error).toHaveBeenCalledWith('TOAST.PURCHASE_ORDER_ERROR');
      expect(component.xlsxImporting()).toBe(false);
    });

    it('onXlsxChange does nothing when no file is selected', async () => {
      const { component, toast } = buildComponent();
      const input = document.createElement('input');
      Object.defineProperty(input, 'files', { value: [] });

      await component.onXlsxChange({ target: input } as unknown as Event);

      expect(toast.success).not.toHaveBeenCalled();
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('onDrop imports a dropped .xlsx file', async () => {
      mockXlsxRows([['Nom', 'Bernard', '', '']]);

      const { component, toast } = buildComponent();
      const file = new File(['fake'], 'bdc.xlsx');
      const event = {
        preventDefault: vi.fn(),
        dataTransfer: { files: [file] },
      } as unknown as DragEvent;

      await component.onDrop(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.isDragging()).toBe(false);
      expect(component.getStr('lastName')).toBe('Bernard');
      expect(toast.success).toHaveBeenCalled();
    });

    it('onDrop ignores a dropped file that is not .xlsx/.xls', async () => {
      const { component, toast } = buildComponent();
      const file = new File(['fake'], 'document.pdf');
      const event = {
        preventDefault: vi.fn(),
        dataTransfer: { files: [file] },
      } as unknown as DragEvent;

      await component.onDrop(event);

      expect(toast.success).not.toHaveBeenCalled();
      expect(toast.error).not.toHaveBeenCalled();
    });
  });
});
