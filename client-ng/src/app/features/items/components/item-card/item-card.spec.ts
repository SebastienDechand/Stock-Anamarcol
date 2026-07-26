import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ItemCard } from './item-card';
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

function buildComponent(item: Item): ItemCard {
  TestBed.overrideComponent(ItemCard, { set: { template: '', imports: [] } });
  TestBed.configureTestingModule({ imports: [ItemCard] });
  const fixture = TestBed.createComponent(ItemCard);
  fixture.componentRef.setInput('item', item);
  fixture.detectChanges();
  return fixture.componentInstance;
}

describe('ItemCard', () => {
  describe('imageUrl', () => {
    it('returns an empty string when there is no image', () => {
      expect(buildComponent(makeItem()).imageUrl).toBe('');
    });

    it('returns the image as-is when it is an absolute URL', () => {
      const url = 'https://example.com/pic.jpg';
      expect(buildComponent(makeItem({ image: url })).imageUrl).toBe(url);
    });

    it('returns the image as-is when it is already rooted', () => {
      expect(buildComponent(makeItem({ image: '/uploads/pic.jpg' })).imageUrl).toBe(
        '/uploads/pic.jpg',
      );
    });

    it('prepends a leading slash to a bare relative path', () => {
      expect(buildComponent(makeItem({ image: 'pic.jpg' })).imageUrl).toBe('/pic.jpg');
    });
  });

  describe('stockLabel / stockMod', () => {
    it('reports critical stock at or below 2', () => {
      const component = buildComponent(makeItem({ quantity: 2 }));
      expect(component.stockLabel).toBe('ITEMS.STOCK_CRITICAL');
      expect(component.stockMod).toBe('urgent');
    });

    it('reports low stock between 3 and 4', () => {
      const component = buildComponent(makeItem({ quantity: 4 }));
      expect(component.stockLabel).toBe('ITEMS.STOCK_LOW');
      expect(component.stockMod).toBe('limite');
    });

    it('reports ok stock at 5 or above', () => {
      const component = buildComponent(makeItem({ quantity: 5 }));
      expect(component.stockLabel).toBe('ITEMS.STOCK_OK');
      expect(component.stockMod).toBe('ok');
    });
  });

  describe('onFileChange()', () => {
    it('emits uploadPicture with the item and the selected file', () => {
      const component = buildComponent(makeItem());
      const spy = vi.fn();
      component.uploadPicture.subscribe(spy);

      const file = new File(['data'], 'photo.png', { type: 'image/png' });
      const input = document.createElement('input');
      input.type = 'file';
      Object.defineProperty(input, 'files', { value: [file] });

      component.onFileChange({ target: input } as unknown as Event);

      expect(spy).toHaveBeenCalledWith({ item: component.item(), file });
    });

    it('does nothing when no file is selected', () => {
      const component = buildComponent(makeItem());
      const spy = vi.fn();
      component.uploadPicture.subscribe(spy);

      const input = document.createElement('input');
      input.type = 'file';
      Object.defineProperty(input, 'files', { value: [] });

      component.onFileChange({ target: input } as unknown as Event);

      expect(spy).not.toHaveBeenCalled();
    });
  });
});
