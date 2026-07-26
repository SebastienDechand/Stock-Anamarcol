import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi } from 'vitest';
import { AddItemModal } from './add-item-modal';

function build(): AddItemModal {
  TestBed.overrideComponent(AddItemModal, { set: { template: '', imports: [] } });
  TestBed.configureTestingModule({ imports: [AddItemModal] });

  const fixture = TestBed.createComponent(AddItemModal);
  fixture.componentRef.setInput('posterId', 'user-001');
  fixture.detectChanges();
  return fixture.componentInstance;
}

describe('AddItemModal - submit()', () => {
  it('does not emit when name is blank', () => {
    const modal = build();
    const spy = vi.fn();
    modal.submitted.subscribe(spy);
    modal.form.patchValue({ name: '   ' });
    modal.submit();
    expect(spy).not.toHaveBeenCalled();
  });

  it('emits item data with posterId', () => {
    const modal = build();
    const spy = vi.fn();
    modal.submitted.subscribe(spy);
    modal.form.setValue({
      name: 'Stylo bleu',
      supplier: 'Bureau Vallée',
      status: 'Neuf',
      quantity: 10,
      cgKit: false,
      tpvKit: false,
    });
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

  it('does not emit when supplier or status are missing', () => {
    const modal = build();
    const spy = vi.fn();
    modal.submitted.subscribe(spy);
    modal.form.patchValue({ name: 'Crayon', supplier: '', status: '', quantity: 0 });
    modal.submit();
    expect(spy).not.toHaveBeenCalled();
  });
});
