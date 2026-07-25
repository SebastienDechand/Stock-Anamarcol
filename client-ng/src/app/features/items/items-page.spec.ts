import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { provideMockStore } from '@ngrx/store/testing';
import { ItemsPage } from './items-page';
import { ItemsFacade } from './store/facade/items.facade';
import { initialItemsState } from './store/state/items.state';
import { initialAuthState } from '../../store/auth/state/auth.state';

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

  describe('togglePreparation() - sélection exclusive', () => {
    it('should activate CashGuard and leave TPV off', () => {
      component.togglePreparation('CashGuard');
      expect(component.cgKit()).toBe(true);
      expect(component.tpvKit()).toBe(false);
    });

    it('should activate Caisse TPV and leave CG off', () => {
      component.togglePreparation('Caisse TPV');
      expect(component.cgKit()).toBe(false);
      expect(component.tpvKit()).toBe(true);
    });

    it('should deactivate CashGuard when already active', () => {
      component.togglePreparation('CashGuard');
      component.togglePreparation('CashGuard');
      expect(component.cgKit()).toBe(false);
      expect(component.tpvKit()).toBe(false);
    });

    it('should deactivate Caisse TPV when already active', () => {
      component.togglePreparation('Caisse TPV');
      component.togglePreparation('Caisse TPV');
      expect(component.cgKit()).toBe(false);
      expect(component.tpvKit()).toBe(false);
    });

    it('should switch from CashGuard to Caisse TPV exclusively', () => {
      component.togglePreparation('CashGuard');
      component.togglePreparation('Caisse TPV');
      expect(component.cgKit()).toBe(false);
      expect(component.tpvKit()).toBe(true);
    });

    it('should switch from Caisse TPV to CashGuard exclusively', () => {
      component.togglePreparation('Caisse TPV');
      component.togglePreparation('CashGuard');
      expect(component.cgKit()).toBe(true);
      expect(component.tpvKit()).toBe(false);
    });
  });

  describe('onPreparationBatch() - mapping du champ backend', () => {
    it('should call preparationBatch with "cgKit" for CashGuard', () => {
      const spy = vi.spyOn(facade, 'preparationBatch').mockImplementation(() => {});
      component.onPreparationBatch('CashGuard', 'increment');
      expect(spy).toHaveBeenCalledWith(
        'cgKit',
        'increment',
        expect.any(Number),
        expect.any(Object),
      );
    });

    it('should call preparationBatch with "tpvKit" for Caisse TPV', () => {
      const spy = vi.spyOn(facade, 'preparationBatch').mockImplementation(() => {});
      component.onPreparationBatch('Caisse TPV', 'increment');
      expect(spy).toHaveBeenCalledWith(
        'tpvKit',
        'increment',
        expect.any(Number),
        expect.any(Object),
      );
    });
  });
});
