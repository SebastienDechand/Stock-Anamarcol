import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of } from 'rxjs';
import { EditItemModal } from './edit-item-modal';
import { ItemsFacade } from '../../store/facade/items.facade';
import { UsersFacade } from '../../../members/store/facade/users.facade';
import { AuthFacade } from '../../../../store/auth/facade/auth.facade';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../../core/services/language/language.service';
import type { Item } from '../../../../shared/models/item/item.model';

const makeItem = (overrides: Partial<Item> = {}): Item => ({
  _id: '1',
  posterId: 'u1',
  name: 'Joint Hooper',
  quantity: 10,
  supplier: 'Alpha',
  status: 'Neuf',
  ...overrides,
});

function buildComponent(item: Item) {
  const facade = {
    setSelectedItemId: vi.fn(),
    loadHistory: vi.fn(),
    updateQuantity: vi.fn(),
    uploadPicture: vi.fn(),
    selectedItem$: of(null),
    history$: of([]),
    isLoadingHistory$: of(false),
  };

  TestBed.overrideComponent(EditItemModal, { set: { template: '', imports: [] } });
  TestBed.configureTestingModule({
    imports: [EditItemModal],
    providers: [
      { provide: ItemsFacade, useValue: facade },
      { provide: UsersFacade, useValue: { users$: of([{ _id: 'u1', username: 'alice' }]) } },
      {
        provide: AuthFacade,
        useValue: { isAdmin$: of(true), user$: of({ _id: 'admin1', username: 'admin' }) },
      },
      { provide: TranslateService, useValue: { instant: (key: string) => key } },
      { provide: LanguageService, useValue: { current: 'fr' } },
    ],
  });

  const fixture = TestBed.createComponent(EditItemModal);
  fixture.componentRef.setInput('item', item);
  fixture.detectChanges();
  return { component: fixture.componentInstance, facade };
}

describe('EditItemModal', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('displayItem / poster', () => {
    it('falls back to the item input when there is no live item yet', () => {
      const { component } = buildComponent(makeItem());
      expect(component.displayItem.name).toBe('Joint Hooper');
    });

    it('resolves the poster from the users list', () => {
      const { component } = buildComponent(makeItem({ posterId: 'u1' }));
      expect(component.poster?.username).toBe('alice');
    });
  });

  describe('ngOnInit()', () => {
    it('registers the selected item id and resets the form from it', () => {
      const { component, facade } = buildComponent(makeItem({ _id: '42', name: 'Cassette' }));
      expect(facade.setSelectedItemId).toHaveBeenCalledWith('42');
      expect(component.form.controls.name.value).toBe('Cassette');
    });
  });

  describe('switchTab()', () => {
    it('loads history only the first time the history tab is opened', () => {
      const { component, facade } = buildComponent(makeItem());
      component.switchTab('history');
      component.switchTab('detail');
      component.switchTab('history');

      expect(facade.loadHistory).toHaveBeenCalledTimes(1);
      expect(component.activeTab).toBe('history');
    });
  });

  describe('startEditing() / cancelEditing()', () => {
    it('startEditing() resets the form and clears the error', () => {
      const { component } = buildComponent(makeItem());
      component.error = 'previous error';
      component.startEditing();
      expect(component.editing).toBe(true);
      expect(component.error).toBe('');
    });

    it('cancelEditing() exits both editing modes and resets the form', () => {
      const { component } = buildComponent(makeItem());
      component.startEditing();
      component.editingQty = true;
      component.cancelEditing();
      expect(component.editing).toBe(false);
      expect(component.editingQty).toBe(false);
    });
  });

  describe('submit()', () => {
    it('sets an error and does not emit when the form is invalid', () => {
      const { component } = buildComponent(makeItem());
      component.form.controls.name.setValue('');
      const spy = vi.fn();
      component.submitted.subscribe(spy);

      component.submit();

      expect(spy).not.toHaveBeenCalled();
      expect(component.error).toBe('ITEMS.REQUIRED_FIELDS');
    });

    it('emits the form value and exits editing mode when valid', () => {
      const { component } = buildComponent(makeItem());
      component.editing = true;
      const spy = vi.fn();
      component.submitted.subscribe(spy);

      component.submit();

      expect(spy).toHaveBeenCalledWith(component.form.getRawValue());
      expect(component.editing).toBe(false);
    });
  });

  describe('submitQty()', () => {
    it('calls updateQuantity with operation "add" when the new quantity is higher', () => {
      const { component, facade } = buildComponent(makeItem({ quantity: 5 }));
      component.form.controls.quantity.setValue(8);
      component.submitQty();
      expect(facade.updateQuantity).toHaveBeenCalledWith('1', 8, 'admin', 'add');
      expect(component.editingQty).toBe(false);
    });

    it('calls updateQuantity with operation "subtract" when the new quantity is lower', () => {
      const { component, facade } = buildComponent(makeItem({ quantity: 5 }));
      component.form.controls.quantity.setValue(2);
      component.submitQty();
      expect(facade.updateQuantity).toHaveBeenCalledWith('1', 2, 'admin', 'subtract');
    });

    it('clamps a negative quantity to 0', () => {
      const { component, facade } = buildComponent(makeItem({ quantity: 5 }));
      component.form.controls.quantity.setValue(-3);
      component.submitQty();
      expect(facade.updateQuantity).toHaveBeenCalledWith('1', 0, 'admin', 'subtract');
    });
  });

  describe('onFileChange()', () => {
    function makeFileInput(file?: File): HTMLInputElement {
      const input = document.createElement('input');
      input.type = 'file';
      Object.defineProperty(input, 'files', { value: file ? [file] : [] });
      return input;
    }

    it('does nothing when no file is selected', () => {
      const { component, facade } = buildComponent(makeItem());
      component.onFileChange({ target: makeFileInput() } as unknown as Event);
      expect(facade.uploadPicture).not.toHaveBeenCalled();
    });

    it('rejects a file with an unsupported type', () => {
      const { component, facade } = buildComponent(makeItem());
      const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' });
      component.onFileChange({ target: makeFileInput(file) } as unknown as Event);
      expect(component.fileError).toBe('ITEMS.IMAGE_FORMAT_ERROR');
      expect(facade.uploadPicture).not.toHaveBeenCalled();
    });

    it('rejects a file that is too large', () => {
      const { component, facade } = buildComponent(makeItem());
      const bigContent = new Uint8Array(6 * 1024 * 1024);
      const file = new File([bigContent], 'big.png', { type: 'image/png' });
      component.onFileChange({ target: makeFileInput(file) } as unknown as Event);
      expect(component.fileError).toBe('ITEMS.IMAGE_SIZE_ERROR');
      expect(facade.uploadPicture).not.toHaveBeenCalled();
    });

    it('uploads a valid image and sets the preview URL', () => {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview-url');
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      const { component, facade } = buildComponent(makeItem());
      const file = new File(['data'], 'photo.png', { type: 'image/png' });
      component.onFileChange({ target: makeFileInput(file) } as unknown as Event);

      expect(component.fileError).toBe('');
      expect(component.imagePreview()).toBe('blob:preview-url');
      expect(facade.uploadPicture).toHaveBeenCalledWith('1', expect.any(FormData));
    });
  });

  describe('formatDate()', () => {
    it('returns an en dash when there is no date', () => {
      const { component } = buildComponent(makeItem());
      expect(component.formatDate(undefined)).toBe('–');
    });

    it('formats a date using the current language locale', () => {
      const { component } = buildComponent(makeItem());
      expect(component.formatDate('2026-03-15')).toMatch(/2026/);
    });
  });

  describe('ngOnDestroy()', () => {
    it('clears the selected item id and revokes any pending preview URL', () => {
      const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview-url');

      const { component, facade } = buildComponent(makeItem());
      const file = new File(['data'], 'photo.png', { type: 'image/png' });
      component.onFileChange({
        target: (() => {
          const input = document.createElement('input');
          Object.defineProperty(input, 'files', { value: [file] });
          return input;
        })(),
      } as unknown as Event);

      component.ngOnDestroy();

      expect(facade.setSelectedItemId).toHaveBeenCalledWith(null);
      expect(revoke).toHaveBeenCalledWith('blob:preview-url');
    });
  });
});
