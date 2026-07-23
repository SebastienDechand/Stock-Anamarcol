import { TestBed } from '@angular/core/testing';
import { describe, it, expect } from 'vitest';
import { FiltersModal } from '../filters-modal';

describe('FiltersModal - togglePrepa()', () => {
  function build(): FiltersModal {
    TestBed.overrideComponent(FiltersModal, { set: { template: '', imports: [] } });
    TestBed.configureTestingModule({ imports: [FiltersModal] });

    const fixture = TestBed.createComponent(FiltersModal);
    fixture.componentRef.setInput('selectedSuppliers', []);
    fixture.componentRef.setInput('selectedStatuses', []);
    fixture.componentRef.setInput('cgKit', false);
    fixture.componentRef.setInput('tpvKit', false);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('should activate CashGuard when neither is active', () => {
    const modal = build();
    modal.togglePrepa('CashGuard');
    expect(modal.localCgKit()).toBe(true);
    expect(modal.localTpvKit()).toBe(false);
  });

  it('should activate Caisse TPV when neither is active', () => {
    const modal = build();
    modal.togglePrepa('Caisse TPV');
    expect(modal.localCgKit()).toBe(false);
    expect(modal.localTpvKit()).toBe(true);
  });

  it('should deactivate CashGuard when already active', () => {
    const modal = build();
    modal.togglePrepa('CashGuard');
    modal.togglePrepa('CashGuard');
    expect(modal.localCgKit()).toBe(false);
    expect(modal.localTpvKit()).toBe(false);
  });

  it('should switch from CashGuard to Caisse TPV exclusively', () => {
    const modal = build();
    modal.togglePrepa('CashGuard');
    modal.togglePrepa('Caisse TPV');
    expect(modal.localCgKit()).toBe(false);
    expect(modal.localTpvKit()).toBe(true);
  });

  it('should switch from Caisse TPV to CashGuard exclusively', () => {
    const modal = build();
    modal.togglePrepa('Caisse TPV');
    modal.togglePrepa('CashGuard');
    expect(modal.localCgKit()).toBe(true);
    expect(modal.localTpvKit()).toBe(false);
  });
});
