import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { provideMockStore } from '@ngrx/store/testing';
import { ItemsPage } from '../items-page';
import { ItemsFacade } from '../store/items.facade';
import { initialItemsState } from '../store/items.state';
import { initialAuthState } from '../../../store/auth/auth.state';

const initialState = { items: initialItemsState, auth: initialAuthState };

describe('ItemsPage', () => {
  let component: ItemsPage;
  let facade: ItemsFacade;

  beforeEach(async () => {
    // Empty template avoids compiling child components and their providers
    TestBed.overrideComponent(ItemsPage, { set: { template: '', imports: [] } });

    await TestBed.configureTestingModule({
      imports: [ItemsPage],
      providers: [provideMockStore({ initialState })],
    }).compileComponents();

    facade = TestBed.inject(ItemsFacade);
    vi.spyOn(facade, 'fetchItems').mockImplementation(() => {});

    const fixture = TestBed.createComponent(ItemsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('togglePrepa() — sélection exclusive', () => {
    it('should activate CashGuard and leave TPV off', () => {
      component.togglePrepa('CashGuard');
      expect(component.cgKit()).toBe(true);
      expect(component.tpvKit()).toBe(false);
    });

    it('should activate Caisse TPV and leave CG off', () => {
      component.togglePrepa('Caisse TPV');
      expect(component.cgKit()).toBe(false);
      expect(component.tpvKit()).toBe(true);
    });

    it('should deactivate CashGuard when already active', () => {
      component.togglePrepa('CashGuard');
      component.togglePrepa('CashGuard');
      expect(component.cgKit()).toBe(false);
      expect(component.tpvKit()).toBe(false);
    });

    it('should deactivate Caisse TPV when already active', () => {
      component.togglePrepa('Caisse TPV');
      component.togglePrepa('Caisse TPV');
      expect(component.cgKit()).toBe(false);
      expect(component.tpvKit()).toBe(false);
    });

    it('should switch from CashGuard to Caisse TPV exclusively', () => {
      component.togglePrepa('CashGuard');
      component.togglePrepa('Caisse TPV');
      expect(component.cgKit()).toBe(false);
      expect(component.tpvKit()).toBe(true);
    });

    it('should switch from Caisse TPV to CashGuard exclusively', () => {
      component.togglePrepa('Caisse TPV');
      component.togglePrepa('CashGuard');
      expect(component.cgKit()).toBe(true);
      expect(component.tpvKit()).toBe(false);
    });
  });

  describe('onPrepaBatch() — mapping du champ backend', () => {
    it('should call prepaBatch with "cgKit" for CashGuard', () => {
      const spy = vi.spyOn(facade, 'prepaBatch').mockImplementation(() => {});
      component.onPrepaBatch('CashGuard', 'increment');
      expect(spy).toHaveBeenCalledWith(
        'cgKit',
        'increment',
        expect.any(Number),
        expect.any(Object),
      );
    });

    it('should call prepaBatch with "tpvKit" for Caisse TPV', () => {
      const spy = vi.spyOn(facade, 'prepaBatch').mockImplementation(() => {});
      component.onPrepaBatch('Caisse TPV', 'increment');
      expect(spy).toHaveBeenCalledWith(
        'tpvKit',
        'increment',
        expect.any(Number),
        expect.any(Object),
      );
    });
  });
});
