import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VehicleCard } from './vehicle-card';
import { LanguageService } from '../../../../core/services/language/language.service';
import type { Vehicle } from '../../../../shared/models/vehicle/vehicle.model';

const makeVehicle = (overrides: Partial<Vehicle> = {}): Vehicle => ({
  brand: 'mercedes',
  model: 'vito',
  format: 'van',
  licensePlate: 'AB-123-CD',
  documents: [],
  ...overrides,
});

function buildComponent(vehicle: Vehicle): VehicleCard {
  TestBed.overrideComponent(VehicleCard, { set: { template: '', imports: [] } });
  TestBed.configureTestingModule({
    imports: [VehicleCard],
    providers: [{ provide: LanguageService, useValue: { current: 'fr' } }],
  });
  const fixture = TestBed.createComponent(VehicleCard);
  fixture.componentRef.setInput('vehicle', vehicle);
  fixture.detectChanges();
  return fixture.componentInstance;
}

describe('VehicleCard', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('formatBadgeVariant', () => {
    it('maps van to blue', () => {
      expect(buildComponent(makeVehicle({ format: 'van' })).formatBadgeVariant).toBe('blue');
    });

    it('maps pickup to green', () => {
      expect(buildComponent(makeVehicle({ format: 'pickup' })).formatBadgeVariant).toBe('green');
    });

    it('maps truck to orange', () => {
      expect(buildComponent(makeVehicle({ format: 'truck' })).formatBadgeVariant).toBe('orange');
    });
  });

  describe('formatLabel', () => {
    it('returns the translation key for a known format', () => {
      expect(buildComponent(makeVehicle({ format: 'van' })).formatLabel).toBe('FLEET.FORMAT_VAN');
    });
  });

  describe('dateStatus() / revisionStatus()', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));
    });

    it('dateStatus() delegates to vehicleDateStatus for the given date', () => {
      const component = buildComponent(makeVehicle());
      expect(component.dateStatus('2026-01-01')).toBe('expired');
      expect(component.dateStatus(undefined)).toBe('none');
    });

    it('revisionStatus() derives from the vehicle serviceDate', () => {
      const component = buildComponent(makeVehicle({ serviceDate: '2025-01-01' }));
      expect(component.revisionStatus()).toBe('expired');
    });
  });

  describe('hasAlert', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));
    });

    it('is false when every date is far in the future', () => {
      const component = buildComponent(
        makeVehicle({
          inspectionExpiryDate: '2027-01-01',
          antiPollutionExpiryDate: '2027-01-01',
          serviceDate: '2026-06-01',
        }),
      );
      expect(component.hasAlert).toBe(false);
    });

    it('is false when every date field is unset (none)', () => {
      const component = buildComponent(makeVehicle());
      expect(component.hasAlert).toBe(false);
    });

    it('is true when the inspection is expired', () => {
      const component = buildComponent(makeVehicle({ inspectionExpiryDate: '2026-01-01' }));
      expect(component.hasAlert).toBe(true);
    });

    it('is true when the anti-pollution check is expiring soon', () => {
      const component = buildComponent(makeVehicle({ antiPollutionExpiryDate: '2026-06-25' }));
      expect(component.hasAlert).toBe(true);
    });

    it('is true when the yearly revision is overdue', () => {
      const component = buildComponent(makeVehicle({ serviceDate: '2025-01-01' }));
      expect(component.hasAlert).toBe(true);
    });
  });
});
