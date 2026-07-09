import { describe, it, expect, vi } from 'vitest';
import { AddItemModal } from '../add-item-modal';

function build(): AddItemModal {
  const modal = new AddItemModal();
  modal.posterId = 'user-001';
  return modal;
}

describe('AddItemModal — submit()', () => {
  it('does not emit when denomination is blank', () => {
    const modal = build();
    const spy = vi.fn();
    modal.submitted.subscribe(spy);
    modal.form.denomination = '   ';
    modal.submit();
    expect(spy).not.toHaveBeenCalled();
  });

  it('emits item data with posterId', () => {
    const modal = build();
    const spy = vi.fn();
    modal.submitted.subscribe(spy);
    modal.form = {
      denomination: 'Stylo bleu',
      fournisseur: 'Bureau Vallée',
      etat: 'Neuf',
      quantite: 10,
      prepaCG: false,
      prepaTPV: false,
    };
    modal.submit();

    expect(spy).toHaveBeenCalledWith({
      denomination: 'Stylo bleu',
      fournisseur: 'Bureau Vallée',
      etat: 'Neuf',
      quantite: 10,
      posterId: 'user-001',
      prepaCG: false,
      prepaTPV: false,
    });
  });

  it('does not emit when fournisseur, état or quantité are missing', () => {
    const modal = build();
    const spy = vi.fn();
    modal.submitted.subscribe(spy);
    modal.form.denomination = 'Crayon';
    modal.form.fournisseur = '';
    modal.form.etat = '';
    modal.form.quantite = 0;
    modal.submit();
    expect(spy).not.toHaveBeenCalled();
  });
});
