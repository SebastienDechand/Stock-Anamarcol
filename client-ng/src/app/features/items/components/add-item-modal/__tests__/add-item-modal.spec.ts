import { describe, it, expect, vi } from 'vitest';
import { AddItemModal } from '../add-item-modal';

function build(): AddItemModal {
  const modal = new AddItemModal();
  modal.posterId = 'user-001';
  return modal;
}

describe('AddItemModal — submit()', () => {
  it('does not emit when name is blank', () => {
    const modal = build();
    const spy = vi.fn();
    modal.submitted.subscribe(spy);
    modal.form.name = '   ';
    modal.submit();
    expect(spy).not.toHaveBeenCalled();
  });

  it('emits item data with posterId', () => {
    const modal = build();
    const spy = vi.fn();
    modal.submitted.subscribe(spy);
    modal.form = {
      name: 'Stylo bleu',
      supplier: 'Bureau Vallée',
      status: 'Neuf',
      quantity: 10,
      cgKit: false,
      tpvKit: false,
    };
    modal.submit();

    expect(spy).toHaveBeenCalledWith({
      name: 'Stylo bleu',
      supplier: 'Bureau Vallée',
      status: 'Neuf',
      quantity: 10,
      posterId: 'user-001',
      cgKit: false,
      tpvKit: false,
    });
  });

  it('does not emit when supplier, status or quantity are missing', () => {
    const modal = build();
    const spy = vi.fn();
    modal.submitted.subscribe(spy);
    modal.form.name = 'Crayon';
    modal.form.supplier = '';
    modal.form.status = '';
    modal.form.quantity = 0;
    modal.submit();
    expect(spy).not.toHaveBeenCalled();
  });
});
