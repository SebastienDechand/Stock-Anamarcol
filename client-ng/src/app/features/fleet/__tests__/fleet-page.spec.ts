import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { provideMockStore } from '@ngrx/store/testing';
import { FleetPage } from '../fleet-page';
import { VehiclesFacade } from '../store/vehicles.facade';
import { initialVehiclesState } from '../store/vehicles.state';
import { initialAuthState } from '../../../store/auth/auth.state';
import type { Vehicle, VehicleForm } from '../../../shared/models/vehicle.model';

const initialState = { vehicles: initialVehiclesState, auth: initialAuthState };

const mockVehicle: Vehicle = {
  _id: 'v1',
  brand: 'mercedes',
  model: 'vito',
  format: 'van',
  licensePlate: 'AA-123-BB',
  documents: [],
};

describe('FleetPage', () => {
  let component: FleetPage;
  let facade: VehiclesFacade;

  beforeEach(async () => {
    TestBed.overrideComponent(FleetPage, { set: { template: '', imports: [] } });

    await TestBed.configureTestingModule({
      imports: [FleetPage],
      providers: [provideMockStore({ initialState })],
    }).compileComponents();

    facade = TestBed.inject(VehiclesFacade);
    // ngOnInit subscribes to searchSubject only - no immediate facade calls

    const fixture = TestBed.createComponent(FleetPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── vehiclesBySection ──────────────────────────────────────────────────────

  describe('vehiclesBySection()', () => {
    const vehicles: Vehicle[] = [
      { ...mockVehicle, _id: 'v1', model: 'vito', brand: 'mercedes' },
      { ...mockVehicle, _id: 'v2', model: 'citan', brand: 'mercedes' },
      { ...mockVehicle, _id: 'v3', model: 'vito', brand: 'nissan' },
    ];

    it('should return only vehicles whose model matches the section', () => {
      const result = component.vehiclesBySection(vehicles, 'vito');
      expect(result.length).toBe(2);
      expect(result.every((v) => v.model === 'vito')).toBe(true);
    });

    it('should also filter by brand when filterBrand is set', () => {
      component.filterBrand.set('mercedes');
      const result = component.vehiclesBySection(vehicles, 'vito');
      expect(result.length).toBe(1);
      expect(result[0]._id).toBe('v1');
    });
  });

  // ── toggleSection / isSectionCollapsed ────────────────────────────────────

  describe('toggleSection()', () => {
    it('should add the key on the first call so isSectionCollapsed returns true', () => {
      component.toggleSection('vito');
      expect(component.isSectionCollapsed('vito')).toBe(true);
    });

    it('should remove the key on the second call so isSectionCollapsed returns false', () => {
      component.toggleSection('vito');
      component.toggleSection('vito');
      expect(component.isSectionCollapsed('vito')).toBe(false);
    });
  });

  describe('isSectionCollapsed()', () => {
    it('should return false for a key that has never been toggled', () => {
      expect(component.isSectionCollapsed('citan')).toBe(false);
    });
  });

  // ── formatDate ────────────────────────────────────────────────────────────

  describe('formatDate()', () => {
    it('should return "-" when date is undefined', () => {
      expect(component.formatDate(undefined)).toBe('-');
    });

    it('should return a locale string for a valid date', () => {
      const result = component.formatDate('2024-06-15');
      expect(typeof result).toBe('string');
      expect(result).not.toBe('-');
    });
  });

  // ── dateStatus ────────────────────────────────────────────────────────────

  describe('dateStatus()', () => {
    it('should return "none" when date is undefined', () => {
      expect(component.dateStatus(undefined)).toBe('none');
    });

    it('should return "expired" for a date in the past', () => {
      const past = new Date(Date.now() - 86400000 * 10).toISOString();
      expect(component.dateStatus(past)).toBe('expired');
    });

    it('should return "ok" for a date more than 30 days in the future', () => {
      const future = new Date(Date.now() + 86400000 * 60).toISOString();
      expect(component.dateStatus(future)).toBe('ok');
    });

    it('should return "soon" for a date 15 days in the future', () => {
      const soon = new Date(Date.now() + 86400000 * 15).toISOString();
      expect(component.dateStatus(soon)).toBe('soon');
    });
  });

  // ── openAdd ───────────────────────────────────────────────────────────────

  describe('openAdd()', () => {
    it('should set editingVehicle to null and showAddModal to true', () => {
      component.editingVehicle.set(mockVehicle);
      component.openAdd();
      expect(component.editingVehicle()).toBeNull();
      expect(component.showAddModal()).toBe(true);
    });
  });

  // ── openEdit ──────────────────────────────────────────────────────────────

  describe('openEdit()', () => {
    it('should set editingVehicle to the given vehicle and showAddModal to true', () => {
      component.openEdit(mockVehicle);
      expect(component.editingVehicle()).toEqual(mockVehicle);
      expect(component.showAddModal()).toBe(true);
    });
  });

  // ── closeModal ────────────────────────────────────────────────────────────

  describe('closeModal()', () => {
    it('should set showAddModal to false and editingVehicle to null', () => {
      component.showAddModal.set(true);
      component.editingVehicle.set(mockVehicle);
      component.closeModal();
      expect(component.showAddModal()).toBe(false);
      expect(component.editingVehicle()).toBeNull();
    });
  });

  // ── onSave ────────────────────────────────────────────────────────────────

  describe('onSave()', () => {
    const form: VehicleForm = {
      brand: 'mercedes',
      model: 'vito',
      format: 'van',
      licensePlate: 'AA-123-BB',
    };

    it('should call facade.update and then closeModal when payload has an id', () => {
      const updateSpy = vi.spyOn(facade, 'update');
      component.showAddModal.set(true);

      component.onSave({ id: 'v1', data: form });

      expect(updateSpy).toHaveBeenCalledWith('v1', form);
      expect(component.showAddModal()).toBe(false);
      expect(component.editingVehicle()).toBeNull();
    });

    it('should call facade.create and then closeModal when payload has no id', () => {
      const createSpy = vi.spyOn(facade, 'create');
      component.showAddModal.set(true);

      component.onSave({ data: form });

      expect(createSpy).toHaveBeenCalledWith(form);
      expect(component.showAddModal()).toBe(false);
      expect(component.editingVehicle()).toBeNull();
    });
  });

  // ── openDeleteConfirm ─────────────────────────────────────────────────────

  describe('openDeleteConfirm()', () => {
    it('should set deletingVehicle to the given vehicle', () => {
      component.openDeleteConfirm(mockVehicle);
      expect(component.deletingVehicle()).toEqual(mockVehicle);
    });
  });

  // ── confirmDelete ─────────────────────────────────────────────────────────

  describe('confirmDelete()', () => {
    it('should call facade.delete with the vehicle id and clear the signal', () => {
      const deleteSpy = vi.spyOn(facade, 'delete');
      component.deletingVehicle.set(mockVehicle);

      component.confirmDelete();

      expect(deleteSpy).toHaveBeenCalledWith('v1');
      expect(component.deletingVehicle()).toBeNull();
    });

    it('should not call facade.delete when deletingVehicle has no _id', () => {
      const deleteSpy = vi.spyOn(facade, 'delete');
      const vehicleWithoutId: Vehicle = { ...mockVehicle, _id: undefined };
      component.deletingVehicle.set(vehicleWithoutId);

      component.confirmDelete();

      expect(deleteSpy).not.toHaveBeenCalled();
      expect(component.deletingVehicle()).toBeNull();
    });
  });

  // ── openDocuments ─────────────────────────────────────────────────────────

  describe('openDocuments()', () => {
    it('should set docVehicle to the given vehicle', () => {
      component.openDocuments(mockVehicle);
      expect(component.docVehicle()).toEqual(mockVehicle);
    });
  });
});
